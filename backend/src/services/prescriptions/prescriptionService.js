const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');
const prisma = require('../../db/prisma');
const versionService = require('./versionService');
const refillService = require('./refillService');
const dispenseService = require('./dispenseService');

/**
 * PrescriptionService (Refactored)
 * Main service for prescription management with new architecture
 * Manages prescription lifecycle: DRAFT → ACTIVE → COMPLETED/EXPIRED/CANCELLED
 */
class PrescriptionService {
    /**
     * Generate unique prescription number for a store
     */
    async generatePrescriptionNumber(storeId) {
        const lastRx = await prisma.prescription.findFirst({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            select: { prescriptionNumber: true }
        });

        const lastNumber = lastRx?.prescriptionNumber?.match(/\d+$/)?.[0] || '0';
        const nextNumber = (parseInt(lastNumber) + 1).toString().padStart(6, '0');

        return `RX${nextNumber}`;
    }

    /**
     * Create a new prescription (NEW ARCHITECTURE)
     * Creates: Prescription + PrescriptionVersion v1 + Refill records
     */
    async createPrescription(data, userId) {
        const {
            storeId,
            patientId,
            prescriberId,
            source = 'manual',
            priority = 'Normal',
            type = 'REGULAR',
            totalRefills = 0,
            expiryDate,
            items,
            instructions,
            files,
            status = 'DRAFT' // Allow status to be passed, default to DRAFT
        } = data;

        // Generate prescription number
        const prescriptionNumber = await this.generatePrescriptionNumber(storeId);

        // Calculate expiry date if not provided (default: 1 year)
        const calculatedExpiryDate = expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        // Create prescription + version + refills in transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Prescription (Master Record)
            const prescriptionData = {
                store: { connect: { id: storeId } },
                prescriptionNumber,
                issueDate: new Date(),
                expiryDate: calculatedExpiryDate,
                totalRefills,
                status, // Use the status from parameter
                type,
                source,
                priority
            };

            // Add patient connection if provided
            if (patientId) {
                prescriptionData.patient = { connect: { id: patientId } };
            }

            if (prescriberId) {
                prescriptionData.prescriber = { connect: { id: prescriberId } };
            }

            // Handle uploaded images (legacy field)
            if (files && files.length > 0) {
                prescriptionData.uploadedImages = files.map(f => f.url);
            }

            const prescription = await tx.prescription.create({
                data: prescriptionData
            });

            // 2. Create PrescriptionVersion v1 (Clinical Snapshot)
            const version = await tx.prescriptionVersion.create({
                data: {
                    prescriptionId: prescription.id,
                    versionNumber: 1,
                    instructions,
                    createdBy: userId,
                    items: {
                        create: items.map(item => ({
                            drugId: item.drugId,
                            batchId: item.batchId || null,
                            quantityPrescribed: item.quantity,
                            sig: item.sig,
                            daysSupply: item.daysSupply,
                            substitutionAllowed: item.substitutionAllowed !== false,
                            isControlled: item.isControlled || false,
                            refillsAllowed: item.refillsAllowed || 0
                        }))
                    }
                }
            });

            // 3. Create Refill records
            const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
            const refills = [];
            for (let i = 0; i <= totalRefills; i++) {
                refills.push({
                    prescriptionId: prescription.id,
                    refillNumber: i,
                    authorizedQty: totalQty,
                    dispensedQty: 0,
                    remainingQty: totalQty,
                    status: 'AVAILABLE',
                    expiresAt: calculatedExpiryDate
                });
            }
            await tx.refill.createMany({ data: refills });

            // 4. Create PrescriptionFile records if files provided
            if (files && files.length > 0) {
                await tx.prescriptionFile.createMany({
                    data: files.map(f => ({
                        prescriptionId: prescription.id,
                        fileUrl: f.url,
                        thumbnailUrl: null, // Can be generated later
                        ocrData: null, // Can be populated via OCR processing
                        uploadedBy: userId
                    }))
                });
            }

            // 5. Audit log
            await tx.auditLog.create({
                data: {
                    storeId,
                    userId,
                    action: 'PRESCRIPTION_CREATED',
                    entityType: 'Prescription',
                    entityId: prescription.id,
                    changes: {
                        prescriptionNumber,
                        type,
                        totalRefills,
                        itemCount: items.length
                    }
                }
            });

            return prescription.id;
        }, { timeout: 30000 }); // Increased to 30s due to multiple nested creates

        // Return complete prescription data
        return await this.getPrescriptionById(result);
    }

    /**
     * Update existing prescription
     * Used when editing drafts - creates a new version
     */
    async updatePrescription(id, data, userId) {
        const { items, files, instructions, ...prescriptionData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update prescription metadata (only fields that are provided)
            logger.info('[updatePrescription] Received data:', {
                totalRefills: prescriptionData.totalRefills,
                status: prescriptionData.status,
                allData: prescriptionData
            });

            const updateData = {};
            if (prescriptionData.patientId) updateData.patient = { connect: { id: prescriptionData.patientId } };
            if (prescriptionData.prescriberId) updateData.prescriber = { connect: { id: prescriptionData.prescriberId } };
            if (prescriptionData.priority) updateData.priority = prescriptionData.priority;
            if (prescriptionData.source) updateData.source = prescriptionData.source;
            if (prescriptionData.status) updateData.status = prescriptionData.status;
            if (prescriptionData.totalRefills !== undefined) updateData.totalRefills = prescriptionData.totalRefills;
            updateData.updatedAt = new Date();

            logger.info('[updatePrescription] Update data:', updateData);

            const prescription = await tx.prescription.update({
                where: { id },
                data: updateData
            });

            logger.info('[updatePrescription] ✅ DATABASE UPDATED - Prescription:', {
                id: prescription.id,
                totalRefills: prescription.totalRefills,
                status: prescription.status
            });

            // Verify by reading back from database
            const verifyFromDB = await tx.prescription.findUnique({
                where: { id },
                select: { id: true, totalRefills: true, status: true }
            });
            logger.info('[updatePrescription] ✅ VERIFIED FROM DB:', verifyFromDB);

            // 2. Get current version number
            const currentVersion = await tx.prescriptionVersion.findFirst({
                where: { prescriptionId: id },
                orderBy: { versionNumber: 'desc' },
                select: { versionNumber: true }
            });

            const newVersionNumber = (currentVersion?.versionNumber || 0) + 1;

            // 3. Create new version with items
            const version = await tx.prescriptionVersion.create({
                data: {
                    prescriptionId: id,
                    versionNumber: newVersionNumber,
                    instructions: instructions || null,
                    createdBy: userId,
                    items: {
                        createMany: {
                            data: items.map(item => ({
                                drugId: item.drugId,
                                batchId: item.batchId || null,
                                quantityPrescribed: item.quantity,
                                daysSupply: item.daysSupply || null,
                                sig: item.sig || null,
                                substitutionAllowed: item.substitutionAllowed ?? true,
                                isControlled: item.isControlled ?? false,
                                refillsAllowed: item.refillsAllowed || 0
                            }))
                        }
                    }
                }
            });

            // 4. Update Refill records if totalRefills changed
            if (updateData.totalRefills !== undefined) {
                // Delete all existing refills
                await tx.refill.deleteMany({
                    where: { prescriptionId: id }
                });

                // Create new refills based on new totalRefills
                const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
                const newTotalRefills = updateData.totalRefills;

                if (newTotalRefills > 0) {
                    const refills = [];
                    const calculatedExpiryDate = new Date();
                    calculatedExpiryDate.setMonth(calculatedExpiryDate.getMonth() + 6);

                    for (let i = 0; i <= newTotalRefills; i++) {
                        refills.push({
                            prescriptionId: id,
                            refillNumber: i,
                            authorizedQty: totalQty,
                            dispensedQty: 0,
                            remainingQty: totalQty,
                            status: 'AVAILABLE',
                            expiresAt: calculatedExpiryDate
                        });
                    }
                    await tx.refill.createMany({ data: refills });
                    logger.info(`[updatePrescription] ✅ Created ${refills.length} refill records`);
                } else {
                    logger.info('[updatePrescription] ✅ No refills created (totalRefills = 0)');
                }
            }

            // 5. Create new PrescriptionFile records if files provided
            if (files && files.length > 0) {
                await tx.prescriptionFile.createMany({
                    data: files.map(f => ({
                        prescriptionId: prescription.id,
                        fileUrl: f.url,
                        thumbnailUrl: null,
                        ocrData: null,
                        uploadedBy: userId
                    }))
                });
            }

            // 5. Audit log
            await tx.auditLog.create({
                data: {
                    userId,
                    storeId: prescription.storeId,
                    action: 'PRESCRIPTION_UPDATE',
                    entityType: 'Prescription',
                    entityId: prescription.id,
                    changes: {
                        versionNumber: newVersionNumber,
                        itemCount: items.length
                    }
                }
            });

            return prescription.id;
        }, { timeout: 30000 }); // Increased to 30s to match createPrescription

        // Return complete prescription data
        return await this.getPrescriptionById(result);
    }

    /**
     * Activate prescription (DRAFT → ACTIVE)
     * Makes prescription ready for dispensing
     */
    async activatePrescription(id, userId) {
        const prescription = await prisma.prescription.findUnique({
            where: { id }
        });

        if (!prescription) {
            throw new Error('Prescription not found');
        }

        if (prescription.status !== 'DRAFT') {
            throw new Error(`Cannot activate prescription in ${prescription.status} status`);
        }

        const updated = await prisma.prescription.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                updatedAt: new Date()
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                storeId: prescription.storeId,
                userId,
                action: 'PRESCRIPTION_ACTIVATED',
                entityType: 'Prescription',
                entityId: id,
                changes: { previousStatus: prescription.status, newStatus: 'ACTIVE' }
            }
        });

        return await this.getPrescriptionById(id);
    }

    /**
     * Update prescription status based on refills
     * Call this after refill changes to auto-manage status
     */
    async updatePrescriptionStatus(prescriptionId, userId = null) {
        console.log('🔴 [PrescriptionService] updatePrescriptionStatus called:', { prescriptionId, userId });
        
        const prescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId },
            include: { refills: true }
        });

        if (!prescription) {
            console.log('❌ [PrescriptionService] Prescription not found');
            return;
        }

        console.log('🔴 [PrescriptionService] Current prescription state:', {
            prescriptionNumber: prescription.prescriptionNumber,
            currentStatus: prescription.status,
            totalRefills: prescription.totalRefills,
            refillsCount: prescription.refills?.length,
            refillsData: prescription.refills?.map(r => ({
                num: r.refillNumber,
                status: r.status,
                dispensed: r.dispensedQty,
                remaining: r.remainingQty
            }))
        });

        let newStatus = prescription.status;
        let statusReason = null;

        // Check if expired
        if (new Date() > prescription.expiryDate) {
            newStatus = 'EXPIRED';
            statusReason = 'Prescription expired';
        }
        // Check if all refills exhausted
        else {
            const exhausted = await refillService.areAllRefillsExhausted(prescriptionId);
            console.log('🔴 [PrescriptionService] areAllRefillsExhausted:', exhausted);
            
            if (exhausted) {
                newStatus = 'COMPLETED';
                statusReason = 'All refills dispensed';
            }
            // If currently VERIFIED and has dispense activity -> ACTIVE
            else if (prescription.status === 'VERIFIED') {
                const hasActivity = prescription.refills?.some(r => Number(r.dispensedQty) > 0);
                console.log('🔴 [PrescriptionService] hasActivity:', hasActivity);
                
                if (hasActivity) {
                    newStatus = 'ACTIVE';
                    statusReason = 'Dispensing started';
                }
            }
        }

        console.log('🔴 [PrescriptionService] Determined new status:', { newStatus, statusReason });

        if (newStatus !== prescription.status) {
            console.log('🟢 [PrescriptionService] Status changed! Updating database...');
            
            await prisma.prescription.update({
                where: { id: prescriptionId },
                data: { status: newStatus }
            });

            // Create audit log for status change (for history display)
            await prisma.auditLog.create({
                data: {
                    storeId: prescription.storeId,
                    userId: userId || prescription.storeId,
                    action: `PRESCRIPTION_${newStatus}`,
                    entityType: 'Prescription',
                    entityId: prescriptionId,
                    changes: {
                        previousStatus: prescription.status,
                        newStatus,
                        reason: statusReason,
                        refillsUsed: prescription.refills?.filter(r => r.status === 'FULLY_USED').length || 0,
                        totalRefills: prescription.refills?.length || 0
                    }
                }
            });

            console.log(`✅ [PrescriptionService] Prescription ${prescriptionId} status changed: ${prescription.status} → ${newStatus} (${statusReason})`);
        } else {
            console.log('⚠️ [PrescriptionService] No status change needed');
        }

        return newStatus;
    }

    /**
     * Edit prescription (creates new version)
     */
    async editPrescription(id, data, userId, reason) {
        const prescription = await prisma.prescription.findUnique({
            where: { id }
        });

        if (!prescription) {
            throw new Error('Prescription not found');
        }

        if (prescription.status === 'COMPLETED' || prescription.status === 'CANCELLED') {
            throw new Error(`Cannot edit prescription in ${prescription.status} status`);
        }

        // Create new version
        const newVersion = await versionService.createNewVersion(id, data, userId, reason);

        // Audit log
        await prisma.auditLog.create({
            data: {
                storeId: prescription.storeId,
                userId,
                action: 'PRESCRIPTION_EDITED',
                entityType: 'Prescription',
                entityId: id,
                changes: {
                    versionNumber: newVersion.versionNumber,
                    reason
                }
            }
        });

        return await this.getPrescriptionById(id);
    }

    /**
     * Get prescription by ID with full details
     */
    async getPrescriptionById(id) {
        logger.info('[getPrescriptionById] 🔍 FETCHING prescription:', id);

        const prescription = await prisma.prescription.findUnique({
            where: { id },
            include: {
                patient: true,
                prescriber: true,
                store: true,
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1,
                    include: {
                        items: {
                            include: {
                                drug: true,
                                batch: true
                            }
                        }
                    }
                },
                refills: {
                    orderBy: { refillNumber: 'asc' },
                    include: {
                        items: {
                            include: {
                                prescriptionItem: {
                                    include: {
                                        drug: true
                                    }
                                }
                            }
                        }
                    }
                },
                files: true
            }
        });

        if (!prescription) return null;

        logger.info('[getPrescriptionById] 📦 RAW FROM DATABASE:', {
            id: prescription.id,
            totalRefills: prescription.totalRefills,
            status: prescription.status
        });

        // Fetch audit logs for prescription AND related refills
        const auditLogs = await prisma.auditLog.findMany({
            where: {
                OR: [
                    {
                        entityType: 'Prescription',
                        entityId: id
                    },
                    {
                        entityType: 'Refill',
                        entityId: {
                            in: prescription.refills.map(r => r.id)
                        }
                    },
                    {
                        entityType: 'PrescriptionRefill', // Legacy action type
                        changes: {
                            path: ['prescriptionId'],
                            equals: id
                        }
                    }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        // Flatten latest version items for easier access
        const latestVersion = prescription.versions[0];
        prescription.items = latestVersion?.items || [];
        prescription.currentVersion = latestVersion?.versionNumber || 1;
        prescription.auditLogs = auditLogs;

        logger.info('[getPrescriptionById] Returning prescription:', {
            id: prescription.id,
            totalRefills: prescription.totalRefills,
            status: prescription.status,
            itemsCount: prescription.items.length,
            refillsCount: prescription.refills?.length || 0,
            refillsData: prescription.refills?.map(r => ({
                id: r.id,
                refillNumber: r.refillNumber,
                status: r.status,
                quantityDispensed: r.quantityDispensed,
                itemsCount: r.items?.length || 0,
                items: r.items?.map(ri => ({
                    id: ri.id,
                    drugId: ri.prescriptionItem?.drugId,
                    dispensedAt: ri.dispensedAt
                }))
            }))
        });

        return prescription;
    }

    /**
     * Get active prescriptions for a store
     * (Used in Prescriptions module with filters)
**
     */
    async getPrescriptionsByStore(storeId, filters = {}, pagination = {}, sorting = {}) {
        const {
            status = 'ALL',
            search = null,
            type = null,
            fromDate = null,
            toDate = null
        } = filters;

        const { page = 1, limit = 10 } = pagination;
        const { sortBy = 'createdAt', sortOrder = 'desc' } = sorting;

        const where = {
            storeId,
            deletedAt: null
        };

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (type) {
            where.type = type;
        }

        if (fromDate || toDate) {
            where.createdAt = {};
            if (fromDate) where.createdAt.gte = new Date(fromDate);
            if (toDate) where.createdAt.lte = new Date(toDate);
        }

        if (search) {
            where.OR = [
                { prescriptionNumber: { contains: search, mode: 'insensitive' } },
                { patient: { firstName: { contains: search, mode: 'insensitive' } } },
                { patient: { lastName: { contains: search, mode: 'insensitive' } } },
                { patient: { phoneNumber: { contains: search } } },
                // Add search by Medication Name (nested relation)
                {
                    versions: {
                        some: {
                            items: {
                                some: {
                                    drug: {
                                        name: { contains: search, mode: 'insensitive' }
                                    }
                                }
                            }
                        }
                    }
                }
            ];
        }

        // Sorting Logic
        let orderByClause = {};
        if (sortBy === 'firstName' || sortBy === 'lastName') {
            // Relational sort on Patient
            orderByClause = {
                patient: {
                    [sortBy]: sortOrder
                }
            };
        } else {
            const validSortFields = ['createdAt', 'issueDate', 'expiryDate'];
            const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
            orderByClause = { [safeSortBy]: sortOrder };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [prescriptions, total] = await Promise.all([
            prisma.prescription.findMany({
                where,
                include: {
                    patient: true,
                    prescriber: true,
                    versions: {
                        orderBy: { versionNumber: 'desc' },
                        take: 1,
                        select: {
                            versionNumber: true,
                            items: {
                                include: {
                                    drug: { select: { name: true, form: true } }
                                }
                            }
                        }
                    },
                    refills: {
                        select: {
                            refillNumber: true,
                            status: true,
                            remainingQty: true
                        }
                    }
                },
                orderBy: orderByClause,
                skip: skip,
                take: parseInt(limit)
            }),
            prisma.prescription.count({ where })
        ]);

        return {
            data: prescriptions,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };
    }

    /**
     * Cancel prescription
     */
    async cancelPrescription(id, userId, reason) {
        const prescription = await prisma.prescription.findUnique({
            where: { id }
        });

        if (!prescription) {
            throw new Error('Prescription not found');
        }

        // Cancel all remaining refills
        await refillService.cancelRemainingRefills(id);

        // Update prescription status
        await prisma.prescription.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                notes: reason
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                storeId: prescription.storeId,
                userId,
                action: 'PRESCRIPTION_CANCELLED',
                entityType: 'Prescription',
                entityId: id,
                changes: { reason }
            }
        });

        return await this.getPrescriptionById(id);
    }

    /**
     * Get version history for a prescription
     */
    async getVersionHistory(id) {
        return await versionService.getVersionHistory(id);
    }

    /**
     * Get refill history for a prescription
     */
    async getRefillHistory(id) {
        return await refillService.getRefillHistory(id);
    }

    /**
     * Create quick dispense for Simple Mode (skips workbench)
     */
    async createQuickDispense(prescriptionId, userId) {
        const prescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1,
                    include: {
                        items: {
                            include: {
                                drug: true,
                                batch: true
                            }
                        }
                    }
                },
                patient: true
            }
        });

        if (!prescription) {
            throw new Error('Prescription not found');
        }

        if (prescription.status !== 'VERIFIED') {
            throw new Error('Prescription must be verified before dispensing');
        }

        // Create dispense event directly (skip INTAKE → FILLING → READY workflow)
        const dispense = await prisma.dispenseEvent.create({
            data: {
                prescriptionId,
                workflowStatus: 'PENDING_DISPENSE', // Ready for POS checkout
                initiatedBy: userId,
                createdAt: new Date()
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                storeId: prescription.storeId,
                entityType: 'Prescription',
                entityId: prescriptionId,
                action: 'QUICK_DISPENSE_CREATED',
                metadata: {
                    dispenseId: dispense.id,
                    mode: 'SIMPLE',
                    patientName: prescription.patient?.name
                }
            }
        });

        return dispense;
    }

    /**
     * Verify prescription (DRAFT → VERIFIED)
     */
    async verifyPrescription(id, userId, reason = null) {
        const prescription = await prisma.prescription.findUnique({
            where: { id }
        });

        if (!prescription) {
            throw new Error('Prescription not found');
        }

        if (prescription.status !== 'DRAFT') {
            throw new Error(`Cannot verify prescription in ${prescription.status} status`);
        }

        const updated = await prisma.prescription.update({
            where: { id },
            data: {
                status: 'VERIFIED',
                updatedAt: new Date()
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                storeId: prescription.storeId,
                userId,
                action: 'PRESCRIPTION_VERIFIED',
                entityType: 'Prescription',
                entityId: id,
                changes: {
                    previousStatus: prescription.status,
                    newStatus: 'VERIFIED',
                    reason
                }
            }
        });

        return await this.getPrescriptionById(id);
    }

    /**
     * Get VERIFIED prescriptions for POS import
     */
    async getVerifiedPrescriptions(storeId, search = '') {
        const where = {
            storeId,
            status: 'VERIFIED',
            deletedAt: null
        };

        // Add search filter if provided
        if (search && search.trim()) {
            where.OR = [
                { prescriptionNumber: { contains: search, mode: 'insensitive' } },
                { patient: { firstName: { contains: search, mode: 'insensitive' } } },
                { patient: { lastName: { contains: search, mode: 'insensitive' } } },
                { patient: { phoneNumber: { contains: search } } },
                { id: { contains: search, mode: 'insensitive' } }
            ];
        }

        const prescriptions = await prisma.prescription.findMany({
            where,
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true
                    }
                },
                prescriber: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1,
                    include: {
                        items: {
                            include: {
                                drug: {
                                    select: {
                                        id: true,
                                        name: true,
                                        form: true,
                                        strength: true
                                    }
                                },
                                batch: {
                                    select: {
                                        id: true,
                                        batchNumber: true,
                                        expiryDate: true,
                                        mrp: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 50
        });

        // Flatten structure (map version.items to prescription.items)
        return prescriptions.map(rx => ({
            ...rx,
            items: rx.versions[0]?.items || []
        }));
    }
}

module.exports = new PrescriptionService();

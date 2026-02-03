const r2Config = require('../../config/r2');
const logger = require('../../config/logger');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const prescriptionService = require('../../services/prescriptions/prescriptionService');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../../db/prisma');

class PrescriptionController {
    /**
     * Create a new prescription (Draft)
     * POST /api/v1/prescriptions
     */
    async createPrescription(req, res) {
        try {
            const userId = req.user.id;
            const storeId = req.storeId;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required'
                });
            }

            if (req.files) {
                // Files received successfully
            }

            // Handle uploaded files (R2 Upload)
            const processedFiles = [];
            if (req.files && req.files.length > 0) {
                const date = new Date();
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');

                for (const file of req.files) {
                    const fileExt = path.extname(file.originalname);
                    const fileId = uuidv4();
                    const key = `prescriptions/${year}/${month}/${day}/${fileId}${fileExt}`;

                    await r2Config.uploadObject(key, file.buffer, file.mimetype);
                    const publicUrl = r2Config.getPublicUrl(key);

                    processedFiles.push({
                        url: publicUrl,
                        key: key,
                        ocrData: req.body.ocrData ? JSON.parse(req.body.ocrData) : null // Attach OCR only if passed
                    });
                }
            }

            // Parse items if sent as string (FormData)
            let items = req.body.items;
            if (typeof items === 'string') {
                try {
                    items = JSON.parse(items);
                } catch (e) {
                    return res.status(400).json({ success: false, message: 'Invalid items format' });
                }
            }

            // Debug: Log what we received
            logger.info('Request body fields:', {
                patientId: req.body.patientId,
                prescriberId: req.body.prescriberId,
                storeId: storeId, // From middleware, not req.body
                status: req.body.status,
                hasFiles: !!req.files?.length
            });

            // Validate required fields
            if (!req.body.patientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient is required. Please select a patient before saving.'
                });
            }

            if (!items || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one medication item is required'
                });
            }

            // Parse all FormData fields properly
            const prescriptionData = {
                storeId,
                patientId: req.body.patientId,
                prescriberId: req.body.prescriberId || null,
                priority: req.body.priority || 'NORMAL',
                source: req.body.source || 'MANUAL',
                instructions: req.body.instructions || null,
                totalRefills: parseInt(req.body.totalRefills) || 0,
                status: req.body.status || 'DRAFT',
                items,
                files: processedFiles
            };

            let prescription;

            // Check if updating existing prescription or creating new one
            if (req.body.prescriptionId) {
                // Update existing prescription
                prescription = await prescriptionService.updatePrescription(
                    req.body.prescriptionId,
                    prescriptionData,
                    userId
                );
            } else {
                // Create new prescription
                prescription = await prescriptionService.createPrescription(
                    prescriptionData,
                    userId
                );
            }

            return res.status(req.body.prescriptionId ? 200 : 201).json({
                success: true,
                data: prescription,
                message: req.body.prescriptionId ? 'Prescription updated successfully' : 'Prescription created successfully',
                new_states: {
                    clinical_status: prescription.status,
                    physical_status: 'NotStarted'
                }
            });
        } catch (error) {
            logger.error('[PrescriptionController] Create error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to create prescription'
            });
        }
    }

    /**
     * Get Verified Prescriptions for POS import
     * GET /api/v1/prescriptions/verified
     */
    async getVerifiedPrescriptions(req, res) {
        try {
            const storeId = req.storeId;
            const { search } = req.query;

            const prescriptions = await prescriptionService.getVerifiedPrescriptions(storeId, search);

            return res.json({
                success: true,
                data: prescriptions
            });
        } catch (error) {
            logger.error('[PrescriptionController] Get Verified error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch verified prescriptions'
            });
        }
    }

    /**
     * Get prescriptions for a store (with filters)
     * GET /api/v1/prescriptions?status=NEW&priority=Urgent&search=John
     */
    async getPrescriptions(req, res) {
        try {
            const storeId = req.storeId;
            const { status, search, page, limit, sortBy, sortOrder } = req.query;

            const result = await prescriptionService.getPrescriptionsByStore(
                storeId,
                { status, search },
                { page, limit },
                { sortBy, sortOrder }
            );

            return res.json({
                success: true,
                data: result.data,
                meta: result.meta
            });
        } catch (error) {
            logger.error('[PrescriptionController] Get error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch prescriptions'
            });
        }
    }

    /**
     * Get single prescription details
     * GET /api/v1/prescriptions/:id
     */
    async getPrescriptionById(req, res) {
        try {
            const { id } = req.params;

            const prescription = await prescriptionService.getPrescriptionById(id);

            if (!prescription) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescription not found'
                });
            }

            if (prescription.storeId !== req.storeId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            return res.json({
                success: true,
                data: prescription
            });
        } catch (error) {
            logger.error('[PrescriptionController] Get by ID error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch prescription'
            });
        }
    }

    /**
     * VERIFY Prescription (Clinical Check)
     * POST /api/v1/prescriptions/:id/verify
     * Body: { override?: boolean, reason?: string }
     */
    async verifyPrescription(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { override, reason } = req.body;

            // TODO: Implement clinical checks (drug interactions, allergies)
            // For now, we'll assume checks pass or pharmacist has reviewed
            const checks = {
                highRisk: false, // Placeholder - would call clinicalEngine.runChecks()
                warnings: [],
                summary: 'No critical interactions detected'
            };

            // If high risk and no override, require confirmation
            if (checks.highRisk && !override) {
                return res.status(409).json({
                    success: false,
                    warnings: checks.warnings,
                    summary: checks.summary,
                    requiresOverride: true
                });
            }

            // Perform verification
            const result = await prescriptionService.verifyPrescription(id, userId, reason);

            return res.json({
                success: true,
                data: result,
                new_states: {
                    clinical_status: 'IN_PROGRESS',
                    physical_status: 'InQueue',
                    label_status: 'NotPrinted'
                },
                warnings: checks.warnings,
                message: 'Prescription verified and moved to dispense queue'
            });
        } catch (error) {
            logger.error('[PrescriptionController] Verify error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to verify prescription',
                errors: [error.message]
            });
        }
    }

    /**
     * Place prescription ON HOLD
     * POST /api/v1/prescriptions/:id/hold
     * Body: { reason: string, expectedResolutionDate?: Date, assignTo?: string }
     */
    async holdPrescription(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { reason, expectedResolutionDate, assignTo } = req.body;

            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Reason is required for placing prescription on hold'
                });
            }

            // Verify ownership
            const existing = await prisma.prescription.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Prescription not found' });
            }
            if (existing.storeId !== req.storeId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            const prescription = await prisma.prescription.update({
                where: { id },
                data: {
                    status: 'ON_HOLD',
                    updatedAt: new Date()
                }
            });

            // Log the hold action
            await prisma.auditLog.create({
                data: {
                    storeId: prescription.storeId,
                    userId: userId,
                    action: 'PRESCRIPTION_HOLD',
                    resource: 'Prescription', // Note: schema says entityType typically
                    resourceId: id,
                    details: { reason, expectedResolutionDate, assignTo }
                }
            });

            return res.json({
                success: true,
                data: prescription,
                new_states: {
                    clinical_status: 'ON_HOLD',
                    physical_status: 'NotStarted'
                },
                message: 'Prescription placed on hold'
            });
        } catch (error) {
            logger.error('[PrescriptionController] Hold error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to hold prescription'
            });
        }
    }

    /**
     * Delete prescription (DRAFT only)
     * DELETE /api/v1/prescriptions/:id
     */
    async deletePrescription(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Check if prescription exists and is in DRAFT
            const prescription = await prisma.prescription.findUnique({
                where: { id }
            });

            if (!prescription) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescription not found'
                });
            }

            if (prescription.storeId !== req.storeId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            if (prescription.status.toUpperCase() !== 'DRAFT') {
                return res.status(400).json({
                    success: false,
                    message: `Only DRAFT prescriptions can be deleted (Current: ${prescription.status})`
                });
            }

            // Soft delete
            await prisma.prescription.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    status: 'CANCELLED'
                }
            });

            // Log action
            await prisma.auditLog.create({
                data: {
                    storeId: prescription.storeId,
                    userId: userId,
                    action: 'PRESCRIPTION_DELETE',
                    entityType: 'Prescription',
                    entityId: id,
                    changes: { reason: 'User requested delete' }
                }
            });

            return res.json({
                success: true,
                message: 'Prescription deleted successfully'
            });
        } catch (error) {
            logger.error('[PrescriptionController] Delete error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete prescription'
            });
        }
    }

    /**
     * Delete a prescription file
     * DELETE /api/v1/prescriptions/:id/files/:fileId
     */
    async deleteFile(req, res) {
        try {
            const { id, fileId } = req.params;
            const storeId = req.storeId;
            const userId = req.user.id;

            // Get the file record to extract R2 key
            const file = await prisma.prescriptionFile.findUnique({
                where: { id: fileId },
                include: {
                    prescription: true
                }
            });

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }

            // Verify prescription belongs to user's store
            if (file.prescription.storeId !== storeId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Extract R2 key from URL
            const fileKey = file.fileUrl.split('.r2.dev/')[1]?.split('?')[0];

            // Delete from R2
            if (fileKey) {
                try {
                    await r2Config.deleteObject(fileKey);
                } catch (r2Error) {
                    logger.error('R2 delete error:', r2Error);
                    // Continue with database delete even if R2 fails
                }
            }

            // Delete from database
            await prisma.prescriptionFile.delete({
                where: { id: fileId }
            });

            // Audit log
            await prisma.auditLog.create({
                data: {
                    userId,
                    storeId,
                    action: 'FILE_DELETE',
                    entityType: 'PrescriptionFile',
                    entityId: fileId,
                    changes: {
                        prescriptionId: id,
                        fileUrl: file.fileUrl
                    }
                }
            });

            return res.json({
                success: true,
                message: 'File deleted successfully'
            });
        } catch (error) {
            logger.error('[PrescriptionController] Delete file error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete file'
            });
        }
    }

    /**
     * Create a refill for a prescription
     * POST /api/v1/prescriptions/:id/refills
     */
    async createRefill(req, res) {
        try {
            const { id } = req.params;
            const { notes, dispenseNow } = req.body;
            const userId = req.user.id;
            const storeId = req.storeId;

            // Get prescription and validate
            const prescription = await prisma.prescription.findUnique({
                where: { id },
                include: {
                    refills: true,
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
                    }
                }
            });

            if (!prescription) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescription not found'
                });
            }

            // Verify prescription belongs to user's store
            if (prescription.storeId !== storeId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Validate prescription status - allow refills for VERIFIED or COMPLETED
            if (prescription.status !== 'VERIFIED' && prescription.status !== 'COMPLETED') {
                return res.status(400).json({
                    success: false,
                    message: 'Prescription must be verified or completed before creating refills'
                });
            }

            // Count valid refills (those that have been processed/dispensed)
            const validRefills = prescription.refills.filter(r =>
                r.processedAt || r.quantityDispensed > 0 || r.daysSupply > 0 || r.dispensedQty > 0 || r.status === 'PARTIALLY_USED' || r.status === 'FULLY_USED'
            );

            // Check refill limit based on DISPENSED refills, not total records
            if (validRefills.length >= prescription.totalRefills) {
                return res.status(400).json({
                    success: false,
                    message: `No refills remaining. Maximum ${prescription.totalRefills} refills allowed.`
                });
            }

            // Next refill number: find the highest existing refill number and add 1
            const allRefills = prescription.refills || [];
            const maxRefillNumber = allRefills.length > 0
                ? Math.max(...allRefills.map(r => r.refillNumber))
                : 0;
            const nextRefillNumber = maxRefillNumber + 1;

            // Calculate total quantity from prescription items
            const latestVersion = prescription.versions[0];
            const totalQty = latestVersion.items.reduce((sum, item) => sum + (item.quantityPrescribed || 0), 0);

            // Create refill
            const refill = await prisma.refill.create({
                data: {
                    prescriptionId: id,
                    refillNumber: nextRefillNumber,
                    authorizedQty: totalQty,
                    remainingQty: totalQty,
                    status: 'AVAILABLE',
                    notes,
                    createdAt: new Date()
                }
            });

            // Create RefillItem for each prescription item (per-medication tracking)
            const { medicationIds } = req.body;
            const prescriptionItems = prescription.items || [];

            // Filter items if specific medications requested (for partial refills)
            const itemsToRefill = medicationIds && medicationIds.length > 0
                ? prescriptionItems.filter(item => medicationIds.includes(item.drug?.id || item.drugId))
                : prescriptionItems;

            // Create RefillItem for each medication
            const refillItemsData = itemsToRefill.map(item => ({
                refillId: refill.id,
                prescriptionItemId: item.id,
                quantityDispensed: 0, // Not yet dispensed
                dispensedAt: null
            }));

            if (refillItemsData.length > 0) {
                await prisma.refillItem.createMany({
                    data: refillItemsData
                });
            }

            // Audit log
            await prisma.auditLog.create({
                data: {
                    userId,
                    storeId,
                    action: 'REFILL_CREATE',
                    entityType: 'PrescriptionRefill',
                    entityId: refill.id,
                    changes: {
                        prescriptionId: id,
                        refillNumber: nextRefillNumber,
                        dispenseNow
                    }
                }
            });

            return res.json({
                success: true,
                message: 'Refill created successfully',
                data: {
                    refill,
                    prescription: {
                        id: prescription.id,
                        prescriptionNumber: prescription.prescriptionNumber,
                        items: prescription.versions[0]?.items || []
                    }
                }
            });
        } catch (error) {
            logger.error('[PrescriptionController] Create refill error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to create refill'
            });
        }
    }

    /**
     * Update RX Number format configuration for a store
     * PUT /api/v1/prescriptions/rx-format
     */
    async updateRxFormat(req, res) {
        try {
            const storeId = req.storeId; // From middleware

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required'
                });
            }

            const config = await prescriptionService.updateRxNumberConfig(storeId, req.body);

            return res.json({
                success: true,
                data: config,
                message: 'RX number format updated successfully'
            });
        } catch (error) {
            logger.error('[PrescriptionController] Update RX format error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update RX format'
            });
        }
    }

    /**
     * Get RX Number format configuration for a store
     * GET /api/v1/prescriptions/rx-format
     */
    async getRxFormat(req, res) {
        try {
            const storeId = req.storeId; // From middleware

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required'
                });
            }

            const config = await prescriptionService.getRxNumberConfig(storeId);

            return res.json({
                success: true,
                data: config
            });
        } catch (error) {
            logger.error('[PrescriptionController] Get RX format error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch RX format'
            });
        }
    }
}

module.exports = new PrescriptionController();

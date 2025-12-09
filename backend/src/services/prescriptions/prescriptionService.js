const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PrescriptionService {
    async createPrescription(data, userId) {
        const { storeId, patientId, prescriberId, source, priority, items } = data;

        // Build the data object conditionally
        const prescriptionData = {
            store: { connect: { id: storeId } },
            patient: { connect: { id: patientId } },
            source: source || 'manual',
            priority: priority || 'Normal',
            status: 'DRAFT',
            items: {
                create: items.map(item => ({
                    drug: { connect: { id: item.drugId } },
                    quantityPrescribed: item.quantity,
                    sig: item.sig,
                    daysSupply: item.daysSupply,
                    isControlled: item.isControlled || false
                }))
            }
        };

        // Only add prescriber if provided
        if (prescriberId) {
            prescriptionData.prescriber = { connect: { id: prescriberId } };
        }

        // Handle uploaded images/files
        if (data.files && data.files.length > 0) {
            // For backward compatibility or easy access
            prescriptionData.uploadedImages = data.files.map(f => f.url);

            // Prepare PrescriptionFile creation
            prescriptionData.files = {
                create: data.files.map(f => ({
                    fileUrl: f.url,
                    thumbnailUrl: f.thumbnailUrl || null,
                    ocrData: f.ocrData || {},
                    uploadedBy: userId
                }))
            };
        } else if (data.uploadedImages && data.uploadedImages.length > 0) {
            // Fallback if only uploadedImages string array is passed
            prescriptionData.uploadedImages = data.uploadedImages;
        }

        // Create prescription with items and files
        const prescription = await prisma.prescription.create({
            data: prescriptionData,
            include: {
                items: {
                    include: {
                        drug: true
                    }
                },
                patient: true,
                prescriber: true,
                files: true
            }
        });

        // Log creation
        await prisma.auditLog.create({
            data: {
                storeId: storeId,
                userId: userId,
                action: 'PRESCRIPTION_CREATED',
                entityType: 'Prescription',
                entityId: prescription.id,
                changes: { itemCount: items.length, priority, source, filesCount: (data.files?.length || 0) }
            }
        });

        return prescription;
    }

    /**
     * Verify a prescription (Clinical Check)
     * Transitions status from DRAFT/AWAITING_AUTH to IN_PROGRESS (Ready for Dispense)
     */
    async verifyPrescription(id, userId, notes) {
        // 1. Get current prescription
        const prescription = await prisma.prescription.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!prescription) {
            throw new Error('Prescription not found');
        }

        if (prescription.status === 'COMPLETED' || prescription.status === 'CANCELLED') {
            throw new Error(`Cannot verify prescription in ${prescription.status} status`);
        }

        // 2. Perform automated checks (Placeholder for now, could integrate with drug interaction API)
        // For now, we assume if the pharmacist clicks "Verify", they have done the checks.

        // 3. Update status and create Dispense Event in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update Rx Status
            const updatedRx = await tx.prescription.update({
                where: { id },
                data: {
                    status: 'IN_PROGRESS', // Ready for dispensing
                    updatedAt: new Date()
                }
            });

            // Create Dispense Event (The "Ticket" for the factory floor)
            const dispenseEvent = await tx.dispenseEvent.create({
                data: {
                    prescriptionId: id,
                    workflowStatus: 'INTAKE', // Starts at Intake -> Verify -> Fill
                    intakeBy: userId,
                    intakeAt: new Date(),
                    verifyBy: userId, // Clinical verification done at this step
                    verifyAt: new Date()
                }
            });

            // Log the action (Audit)
            await tx.auditLog.create({
                data: {
                    storeId: prescription.storeId,
                    userId: userId,
                    action: 'PRESCRIPTION_VERIFIED',
                    entityType: 'Prescription',
                    entityId: id,
                    changes: { notes, dispenseEventId: dispenseEvent.id }
                }
            });

            return { updatedRx, dispenseEvent };
        });

        return result;
    }

    /**
     * Get Verified/In-Progress prescriptions for POS
     * These are active prescriptions not yet converted to a sale
     */
    async getVerifiedPrescriptions(storeId, search) {
        const where = {
            storeId,
            status: 'IN_PROGRESS', // Prescriptions ready for dispensing
            sale: null, // Not yet associated with a sale
            deletedAt: null
        };

        if (search) {
            where.OR = [
                { patient: { firstName: { contains: search, mode: 'insensitive' } } },
                { patient: { lastName: { contains: search, mode: 'insensitive' } } },
                { patient: { phoneNumber: { contains: search, mode: 'insensitive' } } },
                { id: { contains: search, mode: 'insensitive' } }
            ];
        }

        return await prisma.prescription.findMany({
            where,
            include: {
                patient: true,
                prescriber: true,
                items: {
                    include: { drug: true }
                },
                files: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 50 // Limit results
        });
    }

    /**
     * Get prescriptions by status for a store
     */
    async getPrescriptionsByStore(storeId, status, search) {
        const where = {
            storeId,
            deletedAt: null
        };

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { patient: { firstName: { contains: search, mode: 'insensitive' } } },
                { patient: { lastName: { contains: search, mode: 'insensitive' } } },
                { id: { contains: search, mode: 'insensitive' } } // Search by Rx ID
            ];
        }

        return await prisma.prescription.findMany({
            where,
            include: {
                patient: true,
                prescriber: true,
                items: {
                    include: { drug: true }
                },
                files: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}

module.exports = new PrescriptionService();

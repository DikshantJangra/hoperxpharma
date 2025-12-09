const r2Config = require('../../config/r2');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const prescriptionService = require('../../services/prescriptions/prescriptionService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PrescriptionController {
    /**
     * Create a new prescription (Draft)
     * POST /api/v1/prescriptions
     */
    async createPrescription(req, res) {
        try {
            const userId = req.user.id;
            const storeId = req.user.primaryStore?.id || req.user.storeUsers?.[0]?.storeId;

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

            // Allow manual override of images if needed, otherwise use uploaded
            const prescriptionData = {
                ...req.body,
                items,
                storeId,
                files: processedFiles
            };

            const prescription = await prescriptionService.createPrescription(
                prescriptionData,
                userId
            );

            return res.status(201).json({
                success: true,
                data: prescription,
                new_states: {
                    clinical_status: prescription.status,
                    physical_status: 'NotStarted'
                }
            });
        } catch (error) {
            console.error('[PrescriptionController] Create error:', error);
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
            const storeId = req.user.primaryStore?.id || req.user.storeUsers?.[0]?.storeId;
            const { search } = req.query;

            const prescriptions = await prescriptionService.getVerifiedPrescriptions(storeId, search);

            return res.json({
                success: true,
                data: prescriptions
            });
        } catch (error) {
            console.error('[PrescriptionController] Get Verified error:', error);
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
            const storeId = req.user.primaryStore?.id || req.user.storeUsers?.[0]?.storeId;
            const { status, search } = req.query;

            const prescriptions = await prescriptionService.getPrescriptionsByStore(
                storeId,
                status,
                search
            );

            return res.json({
                success: true,
                data: prescriptions,
                count: prescriptions.length
            });
        } catch (error) {
            console.error('[PrescriptionController] Get error:', error);
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

            const prescription = await prisma.prescription.findUnique({
                where: { id },
                include: {
                    patient: true,
                    prescriber: true,
                    items: {
                        include: {
                            drug: true
                        }
                    },
                    files: true,
                    dispenseEvents: {
                        include: {
                            items: {
                                include: {
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

            return res.json({
                success: true,
                data: prescription
            });
        } catch (error) {
            console.error('[PrescriptionController] Get by ID error:', error);
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
            console.error('[PrescriptionController] Verify error:', error);
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
                    resource: 'Prescription',
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
            console.error('[PrescriptionController] Hold error:', error);
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
            console.error('[PrescriptionController] Delete error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete prescription'
            });
        }
    }
}

module.exports = new PrescriptionController();

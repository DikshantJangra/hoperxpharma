const dispenseService = require('../../services/dispense/dispenseService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DispenseController {
    /**
     * Get Dispense Queue (Prescriptions ready to fill)
     * GET /api/v1/dispense/queue
     */
    async getQueue(req, res) {
        try {
            const storeId = req.user.primaryStore?.id || req.user.storeUsers?.[0]?.storeId;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required'
                });
            }

            const queue = await dispenseService.getDispenseQueue(storeId);

            // Calculate time in queue for each item
            const enrichedQueue = queue.map(event => {
                const timeInQueue = Math.floor((Date.now() - new Date(event.createdAt).getTime()) / 60000); // minutes
                return {
                    ...event,
                    timeInQueue: `${timeInQueue} min`,
                    slaStatus: timeInQueue > 30 ? 'red' : timeInQueue > 15 ? 'yellow' : 'green'
                };
            });

            return res.json({
                success: true,
                data: enrichedQueue,
                count: enrichedQueue.length,
                stats: {
                    total: enrichedQueue.length,
                    urgent: enrichedQueue.filter(e => e.prescription.priority === 'Urgent').length,
                    avgWaitTime: enrichedQueue.length > 0
                        ? Math.floor(enrichedQueue.reduce((sum, e) => sum + parseInt(e.timeInQueue), 0) / enrichedQueue.length)
                        : 0
                }
            });
        } catch (error) {
            console.error('[DispenseController] Get queue error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch dispense queue'
            });
        }
    }

    /**
     * Start Fill (Technician starts filling)
     * POST /api/v1/dispense/:prescriptionId/start
     */
    async startFill(req, res) {
        try {
            const { prescriptionId } = req.params;
            const userId = req.user.id;

            // Find or create dispense event
            let dispenseEvent = await prisma.dispenseEvent.findFirst({
                where: { prescriptionId },
                include: { prescription: true }
            });

            if (!dispenseEvent) {
                return res.status(404).json({
                    success: false,
                    message: 'No dispense event found for this prescription'
                });
            }

            // Update to FILL status
            dispenseEvent = await prisma.dispenseEvent.update({
                where: { id: dispenseEvent.id },
                data: {
                    workflowStatus: 'FILL',
                    fillBy: userId,
                    fillAt: new Date()
                }
            });

            return res.json({
                success: true,
                data: dispenseEvent,
                new_states: {
                    physical_status: 'Filling'
                },
                message: 'Fill started - ready for barcode scanning'
            });
        } catch (error) {
            console.error('[DispenseController] Start fill error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to start fill'
            });
        }
    }

    /**
     * SCAN Barcode (Safety-critical endpoint)
     * POST /api/v1/dispense/:dispenseEventId/scan
     * Body: { barcode: string, drugId: string, batchNumber: string, quantity: number }
     */
    async scanBarcode(req, res) {
        try {
            const { dispenseEventId } = req.params;
            const userId = req.user.id;
            const { barcode, drugId, batchNumber, quantity } = req.body;

            // Validate required fields
            if (!drugId || !batchNumber || !quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: drugId, batchNumber, quantity'
                });
            }

            // Call service with safety checks
            const dispenseItem = await dispenseService.fillDispenseItem(
                dispenseEventId,
                userId,
                { drugId, batchNumber, quantity }
            );

            return res.json({
                success: true,
                data: dispenseItem,
                new_states: {
                    physical_status: 'Filled'
                },
                message: 'Item scanned and validated successfully',
                warnings: []
            });
        } catch (error) {
            console.error('[DispenseController] Scan error:', error);

            // Return detailed error for safety violations
            return res.status(400).json({
                success: false,
                message: error.message,
                errors: [error.message],
                isSafetyBlock: error.message.includes('SECURITY') || error.message.includes('SAFETY'),
                requiresPharmacistOverride: error.message.includes('EXPIRED') || error.message.includes('Insufficient')
            });
        }
    }

    /**
     * RELEASE (Final pharmacist check and inventory deduction)
     * POST /api/v1/dispense/:dispenseEventId/release
     * Body: { visualCheckConfirmed: boolean }
     */
    async release(req, res) {
        try {
            const { dispenseEventId } = req.params;
            const userId = req.user.id;
            const { visualCheckConfirmed } = req.body;

            // Non-bypassable check
            if (!visualCheckConfirmed) {
                return res.status(400).json({
                    success: false,
                    message: 'Visual check confirmation is required before release',
                    errors: ['MANDATORY_CHECK_MISSING']
                });
            }

            // Verify user is pharmacist (role check)
            if (req.user.role !== 'PHARMACIST' && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Only pharmacists can release prescriptions',
                    errors: ['INSUFFICIENT_PERMISSIONS']
                });
            }

            // Perform release
            const result = await dispenseService.releaseDispense(dispenseEventId, userId);

            return res.json({
                success: true,
                data: result,
                new_states: {
                    clinical_status: 'COMPLETED',
                    physical_status: 'Dispensed',
                    billing_status: 'ReadyForPayment'
                },
                message: 'Prescription released successfully',
                saleDraftId: result.saleDraft.id,
                warnings: []
            });
        } catch (error) {
            console.error('[DispenseController] Release error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to release prescription',
                errors: [error.message]
            });
        }
    }
}

module.exports = new DispenseController();

const queueService = require('../../services/prescriptions/queueService');
const logger = require('../../config/logger');

class QueueController {
    /**
     * Get prescription queue
     * GET /api/v1/prescriptions/queue
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

            const prescriptions = await queueService.getQueueItems(storeId, req.query);

            return res.json({
                success: true,
                data: prescriptions,
                count: prescriptions.length
            });
        } catch (error) {
            logger.error('[QueueController] Get Queue error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch queue'
            });
        }
    }

    /**
     * Update prescription stage
     * PATCH /api/v1/prescriptions/:id/stage
     * Body: { stage: string }
     */
    async updateStage(req, res) {
        try {
            const { id } = req.params;
            const { stage } = req.body;
            const userId = req.user.id;

            if (!stage) {
                return res.status(400).json({
                    success: false,
                    message: 'Stage is required'
                });
            }

            const prescription = await queueService.updateStage(id, stage, userId);

            return res.json({
                success: true,
                data: prescription,
                message: `Prescription moved to ${stage}`
            });
        } catch (error) {
            logger.error('[QueueController] Update Stage error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update stage'
            });
        }
    }

    /**
     * Bulk update queue items
     * POST /api/v1/prescriptions/queue/bulk
     * Body: { ids: string[], action: string, data: any }
     */
    async bulkUpdate(req, res) {
        try {
            const { ids, action, data } = req.body;
            const userId = req.user.id;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Prescription IDs validation failed'
                });
            }

            if (!action) {
                return res.status(400).json({
                    success: false,
                    message: 'Action is required'
                });
            }

            const results = await queueService.bulkUpdate(ids, action, data, userId);

            return res.json({
                success: true,
                data: results,
                message: `Processed ${ids.length} items`
            });
        } catch (error) {
            logger.error('[QueueController] Bulk Update error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to perform bulk update'
            });
        }
    }
}

module.exports = new QueueController();

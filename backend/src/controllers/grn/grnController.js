const grnService = require('../../services/grn/grnService');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * GRN Controller - HTTP handlers for GRN operations
 */
class GRNController {
    /**
     * Initialize GRN from PO
     * POST /api/v1/grn
     */
    async createGRN(req, res, next) {
        try {
            const { poId, receivedBy } = req.body;
            const userId = req.user.id;

            const grn = await grnService.initializeGRN({
                poId,
                userId,
                receivedBy: receivedBy || userId
            });

            res.status(201).json({
                success: true,
                data: grn,
                message: 'GRN initialized successfully'
            });
        } catch (error) {
            console.error('Error in createGRN:', error);
            next(error);
        }
    }

    /**
     * Get GRN by ID
     * GET /api/v1/grn/:id
     */
    async getGRN(req, res, next) {
        try {
            const { id } = req.params;

            const grn = await grnService.getGRNById(id);

            res.json({
                success: true,
                data: grn
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get GRNs with filters
     * GET /api/v1/grn
     */
    async getGRNs(req, res, next) {
        try {
            const { status, limit, offset } = req.query;
            const storeId = req.storeId; // Use validated store access provided by middleware

            const grns = await grnService.getGRNs({
                storeId,
                status,
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0
            });

            res.json({
                success: true,
                data: grns,
                count: grns.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get GRNs by PO
     * GET /api/v1/grn/po/:poId
     */
    async getGRNsByPO(req, res, next) {
        try {
            const { poId } = req.params;

            const grns = await grnService.getGRNsByPO(poId);

            res.json({
                success: true,
                data: grns,
                count: grns.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update GRN item receiving details
     * PATCH /api/v1/grn/:id/items/:itemId
     */
    async updateGRNItem(req, res, next) {
        try {
            const { id, itemId } = req.params;
            const details = req.body;
            const userId = req.user.id;

            const updatedItem = await grnService.updateReceivingDetails({
                grnId: id,
                itemId,
                details,
                userId
            });

            res.json({
                success: true,
                data: updatedItem,
                message: 'GRN item updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Split batch
     * POST /api/v1/grn/:id/items/:itemId/split
     */
    async splitBatch(req, res, next) {
        try {
            const { id, itemId } = req.params;
            const { splitData } = req.body;
            const userId = req.user.id;

            const newItems = await grnService.splitBatch({
                grnId: id,
                itemId,
                splitData,
                userId
            });

            res.json({
                success: true,
                data: newItems,
                message: 'Batch split successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Record discrepancy
     * POST /api/v1/grn/:id/discrepancies
     */
    async recordDiscrepancy(req, res, next) {
        try {
            const { id } = req.params;
            const { grnItemId, reason, resolution, description, debitNoteValue } = req.body;
            const userId = req.user.id;

            const discrepancy = await grnService.handleDiscrepancy({
                grnId: id,
                grnItemId,
                reason,
                resolution,
                description,
                debitNoteValue,
                userId
            });

            res.status(201).json({
                success: true,
                data: discrepancy,
                message: 'Discrepancy recorded successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Complete GRN
     * POST /api/v1/grn/:id/complete
     */
    async completeGRN(req, res, next) {
        try {
            const { id } = req.params;
            const { supplierInvoiceNo, supplierInvoiceDate, notes } = req.body;
            const userId = req.user.id;

            const completedGRN = await grnService.completeGRN({
                grnId: id,
                userId,
                supplierInvoiceNo,
                supplierInvoiceDate,
                notes
            });

            res.json({
                success: true,
                data: completedGRN,
                message: 'GRN completed successfully. Inventory updated.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update GRN (for draft saving)
     * PATCH /api/v1/grn/:id
     */
    async updateGRN(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const userId = req.user.id;

            const updatedGRN = await grnService.updateGRN({
                grnId: id,
                updates,
                userId
            });

            res.json({
                success: true,
                data: updatedGRN,
                message: 'GRN updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancel GRN
     * DELETE /api/v1/grn/:id
     */
    async cancelGRN(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const cancelledGRN = await grnService.cancelGRN({
                grnId: id,
                userId
            });

            res.json({
                success: true,
                data: cancelledGRN,
                message: 'GRN cancelled successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new GRNController();

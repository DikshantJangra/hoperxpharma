const salesLedgerService = require('../../services/sales/salesLedgerService');
const logger = require('../../config/logger');

/**
 * Sales Ledger Controller
 * HTTP handlers for sales ledger endpoints
 */
class SalesLedgerController {
    /**
     * GET /api/v1/sales/ledger
     * Get sales ledger with filters
     */
    async getLedger(req, res) {
        try {
            const { storeId } = req.user;
            const { from, to, paymentMethod, reconStatus, tags, sortBy, sortDirection, page, limit } = req.query;

            const result = await salesLedgerService.getLedger({
                storeId,
                from,
                to,
                paymentMethod,
                reconStatus,
                tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
                sortBy: sortBy || 'date',
                sortDirection: sortDirection || 'desc',
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 50
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error fetching sales ledger:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sales ledger',
                error: error.message
            });
        }
    }

    /**
     * GET /api/v1/sales/ledger/summary
     * Get sales summary for date range
     */
    async getSummary(req, res) {
        try {
            const { storeId } = req.user;
            const { from, to } = req.query;

            const summary = await salesLedgerService.getSummary({
                storeId,
                from,
                to
            });

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            logger.error('Error fetching sales summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sales summary',
                error: error.message
            });
        }
    }

    /**
     * GET /api/v1/sales/ledger/:id/matches
     * Get potential bank transaction matches for reconciliation
     */
    async getMatchCandidates(req, res) {
        try {
            const { storeId } = req.user;
            const { id } = req.params;

            const candidates = await salesLedgerService.getMatchCandidates({
                ledgerId: id,
                storeId
            });

            res.json({
                success: true,
                data: candidates
            });
        } catch (error) {
            logger.error('Error fetching match candidates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch match candidates',
                error: error.message
            });
        }
    }
}

module.exports = new SalesLedgerController();

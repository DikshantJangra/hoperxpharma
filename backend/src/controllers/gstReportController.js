const gstReportService = require('../services/gstReportService');

class GSTReportController {
    /**
     * Get GST Dashboard data
     * GET /api/v1/gst/dashboard?month=2025-01
     */
    async getDashboard(req, res, next) {
        try {
            const { storeId } = req.user;
            const { month } = req.query;

            const data = await gstReportService.getDashboard(storeId, month);

            res.json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get GSTR-1 Summary
     * GET /api/v1/gst/gstr1-summary?month=2025-01
     */
    async getGSTR1Summary(req, res, next) {
        try {
            const { storeId } = req.user;
            const { month } = req.query;

            const gstFilingService = require('../services/gstFilingService');
            const summary = await gstFilingService.generateGSTR1(storeId, month);

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get GSTR-3B Summary
     * GET /api/v1/gst/gstr3b-summary?month=2025-01
     */
    async getGSTR3BSummary(req, res, next) {
        try {
            const { storeId } = req.user;
            const { month } = req.query;

            const gstFilingService = require('../services/gstFilingService');
            const summary = await gstFilingService.generateGSTR3B(storeId, month);

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get monthly trend for charts
     * GET /api/v1/gst/trends?months=6
     */
    async getMonthlyTrend(req, res, next) {
        try {
            const { storeId } = req.user;
            const months = parseInt(req.query.months) || 6;

            const trends = await gstReportService.getMonthlyTrend(storeId, months);

            res.json({
                success: true,
                data: trends
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Trigger Reconciliation (Simulated)
     * POST /api/v1/gst/reconcile
     */
    async reconcile(req, res, next) {
        try {
            const { storeId } = req.user;
            const { month, gstr2bData } = req.body;

            const gstReconciliationService = require('../services/gstReconciliationService');
            const results = await gstReconciliationService.reconcileGSTR2B(storeId, month, gstr2bData || []);

            res.json({
                success: true,
                data: results
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Raw Ledger Entries
     * GET /api/v1/gst/ledger
     */
    async getLedger(req, res, next) {
        try {
            const { storeId } = req.user;
            const { page, limit, type, startDate, endDate, search } = req.query;

            const gstLedgerService = require('../services/gstLedgerService');
            const result = await gstLedgerService.getLedgerEntries(storeId, {
                page, limit, type, startDate, endDate, search
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Freeze/Finalize Filing
     * POST /api/v1/gst/filing/freeze
     */
    async freezeFiling(req, res, next) {
        try {
            const { storeId } = req.user;
            const { month } = req.body;

            const gstFilingService = require('../services/gstFilingService');
            const snapshot = await gstFilingService.freezePeriod(storeId, month);

            res.json({
                success: true,
                message: 'Filing frozen successfully',
                data: snapshot
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Void an Invoice (Create Credit Note)
     * POST /api/v1/gst/invoices/:id/void
     */
    async voidInvoice(req, res, next) {
        try {
            const { storeId } = req.user;
            const { id } = req.params;
            const { reason } = req.body;

            // In a real scenario, we would fetch the original sale, verify it exists, 
            // and then emit a SALE_RETURN event with the full items list.
            // For this implementation, we assume the 'id' maps to a Sale Event ID.

            const gstEventBus = require('../lib/gst/GSTEventBus');
            const { GSTEventType } = require('../lib/gst/GSTEngine');
            const prisma = require('@prisma/client').PrismaClient; // or import instance

            // Mocking the fetching of original sale to get items
            // const originalSale = await prisma.sale.findUnique(...) 

            // Emitting Return Event
            gstEventBus.emitEvent(GSTEventType.SALE_RETURN, {
                eventId: `CN-${Date.now()}`, // Credit Note ID
                originalInvoiceId: id,
                storeId,
                date: new Date(),
                reason: reason || 'User Requested Void',
                // Items would come from original sale
                items: [],
                customerState: 'Maharashtra' // Mock
            });

            res.json({
                success: true,
                message: 'Invoice Voided (Credit Note Generic Created)'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new GSTReportController();

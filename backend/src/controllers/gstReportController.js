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

            const summary = await gstReportService.getGSTR1Summary(storeId, month);

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

            const summary = await gstReportService.getGSTR3BSummary(storeId, month);

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
}

module.exports = new GSTReportController();

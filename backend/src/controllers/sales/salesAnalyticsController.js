const salesAnalyticsService = require('../../services/sales/salesAnalyticsService');

/**
 * Sales Analytics Controller
 * HTTP handlers for sales reporting endpoints
 */
class SalesAnalyticsController {
    /**
     * GET /api/sales/analytics/kpis
     * Get KPI dashboard
     */
    async getKPIs(req, res) {
        try {
            const { storeId } = req.user;
            const { datePreset, customStart, customEnd, channel, customerType } = req.query;

            const kpis = await salesAnalyticsService.getKPIDashboard({
                storeId,
                datePreset: datePreset || '7d',
                customStart,
                customEnd,
                channel,
                customerType
            });

            res.json({
                success: true,
                data: kpis
            });
        } catch (error) {
            console.error('Error fetching KPIs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch KPI data',
                error: error.message
            });
        }
    }

    /**
     * GET /api/sales/analytics/trends
     * Get sales trends with comparison
     */
    async getTrends(req, res) {
        try {
            const { storeId } = req.user;
            const { datePreset, customStart, customEnd, granularity } = req.query;

            const trends = await salesAnalyticsService.getSalesTrends({
                storeId,
                datePreset: datePreset || '7d',
                customStart,
                customEnd,
                granularity: granularity || 'day'
            });

            res.json({
                success: true,
                data: trends
            });
        } catch (error) {
            console.error('Error fetching trends:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch trend data',
                error: error.message
            });
        }
    }

    /**
     * GET /api/sales/analytics/breakdown
     * Get category and payment method breakdowns
     */
    async getBreakdown(req, res) {
        try {
            const { storeId } = req.user;
            const { datePreset, customStart, customEnd } = req.query;

            const breakdown = await salesAnalyticsService.getSalesBreakdown({
                storeId,
                datePreset: datePreset || '7d',
                customStart,
                customEnd
            });

            res.json({
                success: true,
                data: breakdown
            });
        } catch (error) {
            console.error('Error fetching breakdown:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch breakdown data',
                error: error.message
            });
        }
    }

    /**
     * GET /api/sales/analytics/performance
     * Get top products and customers
     */
    async getPerformance(req, res) {
        try {
            const { storeId } = req.user;
            const { datePreset, customStart, customEnd, limit } = req.query;

            const performance = await salesAnalyticsService.getPerformanceTables({
                storeId,
                datePreset: datePreset || '7d',
                customStart,
                customEnd,
                limit: limit ? parseInt(limit) : 10
            });

            res.json({
                success: true,
                data: performance
            });
        } catch (error) {
            console.error('Error fetching performance data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch performance data',
                error: error.message
            });
        }
    }

    /**
     * GET /api/sales/analytics/insights
     * Get actionable insights
     */
    async getInsights(req, res) {
        try {
            const { storeId } = req.user;
            const { datePreset, customStart, customEnd } = req.query;

            const insights = await salesAnalyticsService.generateInsights({
                storeId,
                datePreset: datePreset || '7d',
                customStart,
                customEnd
            });

            res.json({
                success: true,
                data: insights
            });
        } catch (error) {
            console.error('Error generating insights:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate insights',
                error: error.message
            });
        }
    }

    /**
     * GET /api/sales/analytics/report
     * Get complete sales report
     */
    async getCompleteReport(req, res) {
        try {
            const { storeId } = req.user;
            const { datePreset, customStart, customEnd } = req.query;

            const report = await salesAnalyticsService.getCompleteReport({
                storeId,
                datePreset: datePreset || '7d',
                customStart,
                customEnd
            });

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Error fetching complete report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch complete report',
                error: error.message
            });
        }
    }

    /**
     * POST /api/sales/analytics/export
     * Export sales report
     */
    async exportReport(req, res) {
        try {
            const { storeId } = req.user;
            const { datePreset, customStart, customEnd, format } = req.body;

            const exportData = await salesAnalyticsService.exportReport({
                storeId,
                datePreset: datePreset || '7d',
                customStart,
                customEnd,
                format: format || 'csv'
            });

            res.json({
                success: true,
                data: exportData,
                message: `Report ready for export as ${format}`
            });
        } catch (error) {
            console.error('Error exporting report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export report',
                error: error.message
            });
        }
    }
}

module.exports = new SalesAnalyticsController();

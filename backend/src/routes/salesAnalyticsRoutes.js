const express = require('express');
const salesAnalyticsController = require('../controllers/sales/salesAnalyticsController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/sales/analytics/kpis
 * @desc    Get KPI dashboard (revenue, orders, AOV, customers, refunds)
 * @query   datePreset, customStart, customEnd, channel, customerType
 * @access  Protected
 */
router.get('/kpis', salesAnalyticsController.getKPIs);

/**
 * @route   GET /api/sales/analytics/trends
 * @desc    Get sales trends with period comparison
 * @query   datePreset, customStart, customEnd, granularity
 * @access  Protected
 */
router.get('/trends', salesAnalyticsController.getTrends);

/**
 * @route   GET /api/sales/analytics/breakdown
 * @desc    Get category and payment method breakdowns
 * @query   datePreset, customStart, customEnd
 * @access  Protected
 */
router.get('/breakdown', salesAnalyticsController.getBreakdown);

/**
 * @route   GET /api/sales/analytics/performance
 * @desc    Get top products and customers
 * @query   datePreset, customStart, customEnd, limit
 * @access  Protected
 */
router.get('/performance', salesAnalyticsController.getPerformance);

/**
 * @route   GET /api/sales/analytics/insights
 * @desc    Get actionable insights and anomalies
 * @query   datePreset, customStart, customEnd
 * @access  Protected
 */
router.get('/insights', salesAnalyticsController.getInsights);

/**
 * @route   GET /api/sales/analytics/report
 * @desc    Get complete sales report (all data)
 * @query   datePreset, customStart, customEnd
 * @access  Protected
 */
router.get('/report', salesAnalyticsController.getCompleteReport);

/**
 * @route   POST /api/sales/analytics/export
 * @desc    Export sales report (CSV/PDF)
 * @body    datePreset, customStart, customEnd, format
 * @access  Protected
 */
router.post('/export', salesAnalyticsController.exportReport);

module.exports = router;

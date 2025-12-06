const express = require('express');
const reportsController = require('../../controllers/reports/reportsController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const { reportFiltersSchema, exportReportSchema } = require('../../validators/report.validator');

const router = express.Router();

// All routes require authentication and store access
router.use(authenticate);
router.use(requireStoreAccess);

/**
 * GET /api/v1/reports/sales
 * Get sales report with KPIs, time series, and breakdowns
 */
router.get('/sales', validate(reportFiltersSchema, 'query'), reportsController.getSalesReport);

/**
 * GET /api/v1/reports/purchase
 * Get purchase report with supplier analysis
 */
router.get('/purchase', validate(reportFiltersSchema, 'query'), reportsController.getPurchaseReport);

/**
 * GET /api/v1/reports/inventory
 * Get inventory valuation and turnover report
 */
router.get('/inventory', reportsController.getInventoryReport);

/**
 * GET /api/v1/reports/profit
 * Get profit & loss report
 */
router.get('/profit', validate(reportFiltersSchema, 'query'), reportsController.getProfitReport);

/**
 * GET /api/v1/reports/trends
 * Get trends analysis report
 */
router.get('/trends', validate(reportFiltersSchema, 'query'), reportsController.getTrendsReport);

/**
 * POST /api/v1/reports/:type/export
 * Export report in specified format
 */
router.post('/:type/export', validate(exportReportSchema), reportsController.exportReport);

module.exports = router;

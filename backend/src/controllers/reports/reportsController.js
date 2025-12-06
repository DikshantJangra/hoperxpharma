const reportsService = require('../../services/reports/reportsService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * Get sales report
 */
const getSalesReport = asyncHandler(async (req, res) => {
    const report = await reportsService.generateSalesReport(req.storeId, req.query);

    const response = ApiResponse.success(report, 'Sales report generated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get purchase report
 */
const getPurchaseReport = asyncHandler(async (req, res) => {
    const report = await reportsService.generatePurchaseReport(req.storeId, req.query);

    const response = ApiResponse.success(report, 'Purchase report generated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get inventory report
 */
const getInventoryReport = asyncHandler(async (req, res) => {
    const report = await reportsService.generateInventoryReport(req.storeId);

    const response = ApiResponse.success(report, 'Inventory report generated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get profit report
 */
const getProfitReport = asyncHandler(async (req, res) => {
    const report = await reportsService.generateProfitReport(req.storeId, req.query);

    const response = ApiResponse.success(report, 'Profit report generated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get trends report
 */
const getTrendsReport = asyncHandler(async (req, res) => {
    const report = await reportsService.generateTrendsReport(req.storeId, req.query);

    const response = ApiResponse.success(report, 'Trends report generated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Export report
 */
const exportReport = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { format = 'pdf', ...filters } = req.body;

    // TODO: Implement export functionality with job queue
    const response = ApiResponse.success(
        { jobId: 'export-' + Date.now(), message: 'Export job started' },
        'Export initiated successfully'
    );
    res.status(response.statusCode).json(response);
});

module.exports = {
    getSalesReport,
    getPurchaseReport,
    getInventoryReport,
    getProfitReport,
    getTrendsReport,
    exportReport,
};

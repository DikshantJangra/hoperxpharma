const marginService = require('../../services/margin/marginService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * Get margin for a specific sale.
 * Protected: Owner/Admin only.
 */
const getSaleMargin = asyncHandler(async (req, res) => {
    // Access control check (assuming middleware populates req.user)
    // Extra validation to ensure only Owner or Admin can access
    const { role } = req.user;
    if (!['OWNER', 'ADMIN'].includes(role)) {
        return res.status(403).json(ApiResponse.error('Access denied. Margin visibility restricted.', 403));
    }

    const { saleId } = req.params;
    const marginData = await marginService.getMarginForSale(saleId);

    const response = ApiResponse.success(marginData);
    res.status(response.statusCode).json(response);
});

/**
 * Get aggregated margin statistics.
 * Protected: Owner/Admin only.
 */
const getMarginStats = asyncHandler(async (req, res) => {
    const { role } = req.user;
    if (!['OWNER', 'ADMIN'].includes(role)) {
        return res.status(403).json(ApiResponse.error('Access denied. Margin visibility restricted.', 403));
    }

    const { startDate, endDate } = req.query;

    // Default to today if not provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

    const stats = await marginService.getAggregatedMargin(req.storeId, start, end);

    const response = ApiResponse.success(stats);
    res.status(response.statusCode).json(response);
});

/**
 * Calculate provisional margin for items (e.g. from POS).
 * Protected: Owner/Admin only.
 */
const estimateMargin = asyncHandler(async (req, res) => {
    const { role } = req.user;
    if (!['OWNER', 'ADMIN'].includes(role)) {
        return res.status(403).json(ApiResponse.error('Access denied. Margin visibility restricted.', 403));
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
        return res.status(400).json(ApiResponse.error('Invalid items data', 400));
    }

    const stats = await marginService.calculateProvisionalMargin(items);

    const response = ApiResponse.success(stats);
    res.status(response.statusCode).json(response);
});

module.exports = {
    getSaleMargin,
    getMarginStats,
    estimateMargin
};

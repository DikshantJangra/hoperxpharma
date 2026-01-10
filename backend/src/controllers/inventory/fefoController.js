const fefoService = require('../../services/inventory/fefoService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/ApiError');
const dayjs = require('dayjs');

/**
 * FEFO Controller - HTTP handlers for FEFO operations
 */

/**
 * Get recommended batch using FEFO logic
 */
exports.recommendBatch = asyncHandler(async (req, res) => {
    const { drugId, quantity } = req.body;
    const storeId = req.user.storeId;

    if (!drugId) {
        throw ApiError.badRequest('Drug ID is required');
    }

    const recommendation = await fefoService.recommendBatch(
        drugId,
        storeId,
        quantity || 1
    );

    if (!recommendation) {
        return res.json({
            success: true,
            message: 'No batches available for this drug',
            data: null
        });
    }

    res.json({
        success: true,
        message: 'FEFO batch recommended',
        data: recommendation
    });
});

/**
 * Log FEFO deviation
 */
exports.logDeviation = asyncHandler(async (req, res) => {
    const {
        saleId,
        saleItemId,
        drugId,
        recommendedBatchId,
        actualBatchId,
        reason
    } = req.body;
    const employeeId = req.user.id;
    const storeId = req.user.storeId;

    const deviation = await fefoService.logDeviation({
        saleId,
        saleItemId,
        drugId,
        recommendedBatchId,
        actualBatchId,
        employeeId,
        storeId,
        reason
    });

    res.json({
        success: true,
        message: 'FEFO deviation logged',
        data: deviation
    });
});

/**
 * Get FEFO adherence statistics
 */
exports.getAdherenceStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, employeeId } = req.query;
    const storeId = req.user.storeId;

    const start = startDate ? new Date(startDate) : dayjs().subtract(30, 'days').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await fefoService.getAdherenceStats(
        storeId,
        start,
        end,
        employeeId || null
    );

    res.json({
        success: true,
        data: stats
    });
});

/**
 * Get top FEFO violators
 */
exports.getTopViolators = asyncHandler(async (req, res) => {
    const { days, limit } = req.query;
    const storeId = req.user.storeId;

    const violators = await fefoService.getTopViolators(
        storeId,
        parseInt(days) || 30,
        parseInt(limit) || 10
    );

    res.json({
        success: true,
        data: violators
    });
});

/**
 * Get FEFO violation trends
 */
exports.getViolationTrends = asyncHandler(async (req, res) => {
    const { days } = req.query;
    const storeId = req.user.storeId;

    const trends = await fefoService.getViolationTrends(
        storeId,
        parseInt(days) || 30
    );

    res.json({
        success: true,
        data: trends
    });
});

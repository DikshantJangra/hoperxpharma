const behaviorDetectionService = require('../../services/behavioral/behaviorDetectionService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/ApiError');
const dayjs = require('dayjs');

/**
 * Behavioral Analytics Controller
 */

/**
 * Calculate employee anomaly score (manual trigger)
 */
exports.calculateAnomalyScore = asyncHandler(async (req, res) => {
    const { employeeId, date } = req.body;
    const storeId = req.user.storeId;

    const targetDate = date ? new Date(date) : new Date();

    const metrics = await behaviorDetectionService.calculateEmployeeAnomalyScore(
        employeeId || req.user.id,
        storeId,
        targetDate
    );

    res.json({
        success: true,
        message: 'Anomaly score calculated',
        data: metrics
    });
});

/**
 * Get employee behavioral summary
 */
exports.getEmployeeSummary = asyncHandler(async (req, res) => {
    const { employeeId, days } = req.query;
    const storeId = req.user.storeId;

    const summary = await behaviorDetectionService.getEmployeeBehaviorSummary(
        employeeId || req.user.id,
        storeId,
        parseInt(days) || 30
    );

    if (!summary) {
        return res.json({
            success: true,
            message: 'No behavioral data available',
            data: null
        });
    }

    res.json({
        success: true,
        data: summary
    });
});

/**
 * Get store-wide behavioral insights
 */
exports.getStoreInsights = asyncHandler(async (req, res) => {
    const { days } = req.query;
    const storeId = req.user.storeId;

    const insights = await behaviorDetectionService.getStoreBehavioralInsights(
        storeId,
        parseInt(days) || 7
    );

    res.json({
        success: true,
        data: insights
    });
});

/**
 * Get high-risk employees
 */
exports.getHighRiskEmployees = asyncHandler(async (req, res) => {
    const { threshold, limit } = req.query;
    const storeId = req.user.storeId;

    const behaviorRepository = require('../../repositories/behaviorRepository');
    const highRiskEmployees = await behaviorRepository.getHighAnomalyEmployees(
        storeId,
        parseInt(threshold) || 70,
        parseInt(limit) || 10
    );

    res.json({
        success: true,
        data: highRiskEmployees
    });
});

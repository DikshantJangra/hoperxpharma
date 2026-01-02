const accessLogService = require('../../services/audit/accessLogService');
const logger = require('../../config/logger');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/ApiError');

/**
 * Access Log Controller - HTTP handlers for access log endpoints
 */
class AccessLogController {
    /**
     * Get access logs
     * GET /api/v1/audit/access
     */
    getAccessLogs = asyncHandler(async (req, res) => {
        const {
            userId,
            eventType,
            ipAddress,
            startDate,
            endDate,
            page,
            limit,
            sortBy,
            sortOrder,
        } = req.query;

        logger.info('Fetching Access Logs:', {
            storeId: req.storeId,
            userId: req.user.id,
            role: req.user.role,
            filters: req.query
        });

        const result = await accessLogService.getAccessLogs({
            storeId: req.storeId,
            userId,
            eventType,
            ipAddress,
            startDate,
            endDate,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            sortBy,
            sortOrder,
        });

        // Format logs for frontend
        const formattedLogs = result.logs.map((log) => accessLogService.formatAccessLog(log));

        res.json({
            success: true,
            data: {
                logs: formattedLogs,
                pagination: result.pagination,
            },
        });
    });

    /**
     * Get access log by ID
     * GET /api/v1/audit/access/:id
     */
    getAccessById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const log = await accessLogService.getAccessById(id);

        res.json({
            success: true,
            data: accessLogService.formatAccessLog(log),
        });
    });

    /**
     * Get access statistics
     * GET /api/v1/audit/access/stats
     */
    getAccessStats = asyncHandler(async (req, res) => {
        const { startDate, endDate } = req.query;
        const stats = await accessLogService.getAccessStats(req.storeId, startDate, endDate);

        res.json({
            success: true,
            data: stats,
        });
    });

    /**
     * Get suspicious activities
     * GET /api/v1/audit/access/suspicious
     */
    getSuspiciousActivities = asyncHandler(async (req, res) => {
        const activities = await accessLogService.detectSuspiciousActivity();

        res.json({
            success: true,
            data: activities,
        });
    });

    /**
     * Get failed login attempts for a user
     * GET /api/v1/audit/access/failed/:userId
     */
    getFailedAttempts = asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const { hours } = req.query;

        const attempts = await accessLogService.getFailedAttempts(
            userId,
            hours ? parseInt(hours) : 24
        );

        res.json({
            success: true,
            data: attempts,
        });
    });

    /**
     * Search access logs
     * POST /api/v1/audit/access/search
     */
    searchAccessLogs = asyncHandler(async (req, res) => {
        const { query, limit } = req.body;
        const storeId = req.storeId;

        if (!query) {
            throw ApiError.badRequest('Search query is required');
        }

        const logs = await accessLogService.searchAccessLogs(storeId, query, limit);
        const formattedLogs = logs.map((log) => accessLogService.formatAccessLog(log));

        res.json({
            success: true,
            data: formattedLogs,
        });
    });
}

module.exports = new AccessLogController();

const auditService = require('../../services/audit/auditService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/ApiError');

/**
 * Audit Controller - HTTP handlers for activity log endpoints
 */
class AuditController {
    /**
     * Get activity logs
     * GET /api/v1/audit/activity
     */
    getActivityLogs = asyncHandler(async (req, res) => {
        const { storeId } = req.user;
        const {
            userId,
            entityType,
            entityId,
            action,
            startDate,
            endDate,
            page,
            limit,
            sortBy,
            sortOrder,
        } = req.query;

        const result = await auditService.getActivityLogs({
            storeId,
            userId,
            entityType,
            entityId,
            action,
            startDate,
            endDate,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            sortBy,
            sortOrder,
        });

        // Format logs for frontend
        const formattedLogs = result.logs.map((log) => auditService.formatAuditLog(log));

        res.json({
            success: true,
            data: {
                logs: formattedLogs,
                pagination: result.pagination,
            },
        });
    });

    /**
     * Get activity log by ID
     * GET /api/v1/audit/activity/:id
     */
    getActivityById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const log = await auditService.getActivityById(id);

        res.json({
            success: true,
            data: auditService.formatAuditLog(log),
        });
    });

    /**
     * Get activity statistics
     * GET /api/v1/audit/activity/stats
     */
    getActivityStats = asyncHandler(async (req, res) => {
        const { storeId } = req.user;
        const { startDate, endDate } = req.query;

        const stats = await auditService.getActivityStats(storeId, startDate, endDate);

        res.json({
            success: true,
            data: stats,
        });
    });

    /**
     * Search activity logs
     * POST /api/v1/audit/activity/search
     */
    searchActivities = asyncHandler(async (req, res) => {
        const { storeId } = req.user;
        const { query, limit } = req.body;

        if (!query) {
            throw ApiError.badRequest('Search query is required');
        }

        const logs = await auditService.searchActivities(storeId, query, limit);
        const formattedLogs = logs.map((log) => auditService.formatAuditLog(log));

        res.json({
            success: true,
            data: formattedLogs,
        });
    });

    /**
     * Get activity logs by entity
     * GET /api/v1/audit/activity/entity/:entityType/:entityId
     */
    getActivityByEntity = asyncHandler(async (req, res) => {
        const { storeId } = req.user;
        const { entityType, entityId } = req.params;

        const logs = await auditService.getActivityByEntity(entityType, entityId, storeId);
        const formattedLogs = logs.map((log) => auditService.formatAuditLog(log));

        res.json({
            success: true,
            data: formattedLogs,
        });
    });
}

module.exports = new AuditController();

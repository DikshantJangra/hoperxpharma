const alertService = require('../../services/alertService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * @desc    Get all alerts for store
 * @route   GET /api/v1/alerts
 * @access  Private
 */
const getAlerts = asyncHandler(async (req, res) => {
    const storeId = req.storeId;

    // If user has no store (hasn't completed onboarding), return empty array
    if (!storeId) {
        return res.status(200).json(new ApiResponse(200, []));
    }

    const filters = {
        type: req.query.type,
        severity: req.query.severity,
        search: req.query.search,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
    };

    const alerts = await alertService.getActiveAlerts(storeId, filters);

    return res.status(200).json(new ApiResponse(200, alerts));
});

/**
 * @desc    Get alert counts
 * @route   GET /api/v1/alerts/count
 * @access  Private
 */
const getAlertCounts = asyncHandler(async (req, res) => {
    const storeId = req.storeId;

    // If user has no store, return zero counts
    if (!storeId) {
        return res.status(200).json(new ApiResponse(200, {
            total: 0,
            new: 0,
            acknowledged: 0,
            resolved: 0,
            bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 },
            byType: { inventory: 0, compliance: 0, workflow: 0, system: 0 }
        }));
    }

    const counts = await alertService.getAlertCounts(storeId);

    return res.status(200).json(new ApiResponse(200, counts));
});

/**
 * @desc    Get alert by ID
 * @route   GET /api/v1/alerts/:id
 * @access  Private
 */
const getAlertById = asyncHandler(async (req, res) => {
    const alert = await alertService.getAlertById(req.params.id);

    if (!alert) {
        throw new ApiError(404, 'Alert not found');
    }

    // Verify user has access to this store's alerts
    if (alert.storeId !== req.user.primaryStoreId) {
        throw new ApiError(403, 'Access denied');
    }

    return res.status(200).json(new ApiResponse(200, alert));
});

/**
 * @desc    Create manual alert
 * @route   POST /api/v1/alerts
 * @access  Private
 */
const createAlert = asyncHandler(async (req, res) => {
    const storeId = req.storeId;

    if (!storeId) {
        throw new ApiError(400, 'User has no associated store');
    }

    const { type, severity, title, description, relatedType, relatedId } = req.body;

    if (!type || !severity || !title || !description) {
        throw new ApiError(400, 'Missing required fields');
    }

    const alert = await alertService.createAlert(storeId, {
        type,
        severity,
        title,
        description,
        source: 'manual',
        relatedType,
        relatedId
    });

    return res.status(201).json(new ApiResponse(201, alert, 'Alert created successfully'));
});

/**
 * @desc    Acknowledge alert
 * @route   PATCH /api/v1/alerts/:id/acknowledge
 * @access  Private
 */
const acknowledgeAlert = asyncHandler(async (req, res) => {
    const alert = await alertService.getAlertById(req.params.id);

    if (!alert) {
        throw new ApiError(404, 'Alert not found');
    }

    if (alert.storeId !== req.user.primaryStoreId) {
        throw new ApiError(403, 'Access denied');
    }

    const updatedAlert = await alertService.acknowledgeAlert(req.params.id, req.user.id);

    return res.status(200).json(new ApiResponse(200, updatedAlert, 'Alert acknowledged'));
});

/**
 * @desc    Resolve alert
 * @route   PATCH /api/v1/alerts/:id/resolve
 * @access  Private
 */
const resolveAlert = asyncHandler(async (req, res) => {
    const alert = await alertService.getAlertById(req.params.id);

    if (!alert) {
        throw new ApiError(404, 'Alert not found');
    }

    if (alert.storeId !== req.user.primaryStoreId) {
        throw new ApiError(403, 'Access denied');
    }

    const { resolution } = req.body;
    const updatedAlert = await alertService.resolveAlert(req.params.id, req.user.id, resolution);

    return res.status(200).json(new ApiResponse(200, updatedAlert, 'Alert resolved'));
});

/**
 * @desc    Snooze alert
 * @route   PATCH /api/v1/alerts/:id/snooze
 * @access  Private
 */
const snoozeAlert = asyncHandler(async (req, res) => {
    const alert = await alertService.getAlertById(req.params.id);

    if (!alert) {
        throw new ApiError(404, 'Alert not found');
    }

    if (alert.storeId !== req.user.primaryStoreId) {
        throw new ApiError(403, 'Access denied');
    }

    const { snoozeUntil } = req.body;

    if (!snoozeUntil) {
        throw new ApiError(400, 'snoozeUntil is required');
    }

    const updatedAlert = await alertService.snoozeAlert(req.params.id, snoozeUntil);

    return res.status(200).json(new ApiResponse(200, updatedAlert, 'Alert snoozed'));
});

/**
 * @desc    Dismiss alert
 * @route   PATCH /api/v1/alerts/:id/dismiss
 * @access  Private
 */
const dismissAlert = asyncHandler(async (req, res) => {
    const alert = await alertService.getAlertById(req.params.id);

    if (!alert) {
        throw new ApiError(404, 'Alert not found');
    }

    if (alert.storeId !== req.user.primaryStoreId) {
        throw new ApiError(403, 'Access denied');
    }

    const updatedAlert = await alertService.dismissAlert(req.params.id);

    return res.status(200).json(new ApiResponse(200, updatedAlert, 'Alert dismissed'));
});

/**
 * @desc    Delete alert
 * @route   DELETE /api/v1/alerts/:id
 * @access  Private (Admin only)
 */
const deleteAlert = asyncHandler(async (req, res) => {
    const alert = await alertService.getAlertById(req.params.id);

    if (!alert) {
        throw new ApiError(404, 'Alert not found');
    }

    if (alert.storeId !== req.user.primaryStoreId) {
        throw new ApiError(403, 'Access denied');
    }

    // Only admins can delete alerts
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Only admins can delete alerts');
    }

    await alertService.deleteAlert(req.params.id);

    return res.status(200).json(new ApiResponse(200, null, 'Alert deleted'));
});

module.exports = {
    getAlerts,
    getAlertCounts,
    getAlertById,
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    snoozeAlert,
    dismissAlert,
    deleteAlert
};

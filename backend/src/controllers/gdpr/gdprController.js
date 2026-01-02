const dataExportService = require('../../services/gdpr/dataExportService');
const logger = require('../../config/logger');

/**
 * GDPR Controller
 * Handles GDPR compliance endpoints (data export, deletion, consent)
 */

/**
 * Export user data
 * GET /api/v1/gdpr/export?format=json|csv
 */
const exportUserData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { format = 'json' } = req.query;

        // Collect all user data
        const userData = await dataExportService.collectUserData(userId);

        // Format based on request
        if (format === 'csv') {
            const csv = dataExportService.convertToCSV(userData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="my-data-${Date.now()}.csv"`);
            return res.send(csv);
        }

        // Default: JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="my-data-${Date.now()}.json"`);
        return res.json({
            success: true,
            data: userData,
        });
    } catch (error) {
        logger.error('Data export error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to export data',
            message: error.message,
        });
    }
};

/**
 * Get export status/history
 * GET /api/v1/gdpr/exports
 */
const getExportHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        // For now, return empty array (future: track export history in DB)
        return res.json({
            success: true,
            data: {
                exports: [],
                message: 'Export history tracking coming soon',
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Request account deletion (GDPR Right to be Forgotten)
 * POST /api/v1/gdpr/delete-account
 */
const requestAccountDeletion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reason } = req.body;

        // TODO: Implement account deletion workflow
        // For now, just log the request
        logger.info(`Account deletion requested for user ${userId}. Reason: ${reason}`);

        return res.json({
            success: true,
            message: 'Account deletion request received. This feature is under development.',
            note: 'Please contact support for immediate account deletion',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Update consent preferences
 * POST /api/v1/gdpr/consent
 */
const updateConsent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { purpose, granted } = req.body;

        if (!purpose || typeof granted !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Purpose and granted fields  are required',
            });
        }

        // TODO: Store consent in database
        logger.info(`Consent update: User ${userId}, Purpose: ${purpose}, Granted: ${granted}`);

        return res.json({
            success: true,
            message: 'Consent preferences updated',
            data: { purpose, granted },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

module.exports = {
    exportUserData,
    getExportHistory,
    requestAccountDeletion,
    updateConsent,
};

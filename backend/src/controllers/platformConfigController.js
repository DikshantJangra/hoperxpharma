/**
 * Platform Configuration Controller
 * Handles secret routes for platform-wide settings
 */

const platformConfigService = require('../services/platformConfigService');
const logger = require('../config/logger');

// Setup password (hardcoded for simplicity)
const SETUP_PASSWORD = '2005';

// Rate limiting for password attempts (in-memory)
const attemptTracker = new Map(); // IP -> { attempts: number, resetAt: timestamp }

/**
 * Verify setup password
 * POST /api/v1/platform/setup/:secret/verify-password
 */
const verifyPassword = async (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const { password } = req.body;
    const now = Date.now();

    // Get or create attempt record for this IP
    let record = attemptTracker.get(clientIP);
    if (!record || now > record.resetAt) {
        record = { attempts: 0, resetAt: now + 60000 }; // Reset after 1 minute
        attemptTracker.set(clientIP, record);
    }

    // Check if rate limited
    if (record.attempts >= 3) {
        const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
        logger.warn('Password rate limit exceeded', { ip: clientIP, waitSeconds });
        return res.status(429).json({
            success: false,
            message: `Too many attempts. Try again in ${waitSeconds} seconds.`,
            retryAfter: waitSeconds
        });
    }

    // Increment attempt counter
    record.attempts++;
    attemptTracker.set(clientIP, record);

    // Verify password
    if (password === SETUP_PASSWORD) {
        // Reset attempts on success
        attemptTracker.delete(clientIP);
        logger.info('Setup password verified successfully', { ip: clientIP });
        return res.json({
            success: true,
            message: 'Password verified'
        });
    }

    const remainingAttempts = 3 - record.attempts;
    logger.warn('Invalid setup password attempt', { ip: clientIP, remainingAttempts });
    return res.status(401).json({
        success: false,
        message: `Invalid password. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts
    });
};

/**
 * Get email configuration
 * GET /api/platform/setup/:secret/email
 */
const getEmailConfig = async (req, res) => {
    try {
        const config = await platformConfigService.getEmailConfig();

        return res.json({
            success: true,
            data: config,
            configured: !!config,
            active: config?.isActive || false
        });
    } catch (error) {
        logger.error('Error getting platform email config:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get email configuration'
        });
    }
};

/**
 * Save email configuration
 * POST /api/platform/setup/:secret/email
 */
const saveEmailConfig = async (req, res) => {
    try {
        const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFromName, useTLS } = req.body;

        if (!smtpUser || !smtpPassword) {
            return res.status(400).json({
                success: false,
                message: 'Gmail address and App Password are required'
            });
        }

        const config = await platformConfigService.setEmailConfig({
            smtpHost: smtpHost || 'smtp.gmail.com',
            smtpPort: smtpPort || 587,
            smtpUser,
            smtpPassword,
            smtpFromName: smtpFromName || 'HopeRxPharma',
            useTLS: useTLS !== false
        });

        return res.json({
            success: true,
            message: 'Email configuration saved. Please test the connection.',
            data: config
        });
    } catch (error) {
        logger.error('Error saving platform email config:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to save email configuration'
        });
    }
};

/**
 * Test email connection
 * POST /api/platform/setup/:secret/email/test
 */
const testEmailConnection = async (req, res) => {
    try {
        const result = await platformConfigService.testConnection();

        return res.json({
            success: result.success,
            message: result.message
        });
    } catch (error) {
        logger.error('Error testing platform email connection:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to test connection'
        });
    }
};

/**
 * Delete email configuration
 * DELETE /api/platform/setup/:secret/email
 */
const deleteEmailConfig = async (req, res) => {
    try {
        const deleted = await platformConfigService.deleteEmailConfig();

        return res.json({
            success: true,
            message: deleted ? 'Email configuration deleted' : 'No configuration to delete'
        });
    } catch (error) {
        logger.error('Error deleting platform email config:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete email configuration'
        });
    }
};

/**
 * Get email status (public, for login page)
 * GET /api/platform/email-status
 */
const getEmailStatus = async (req, res) => {
    try {
        const isConfigured = await platformConfigService.isEmailConfigured();

        return res.json({
            success: true,
            configured: isConfigured
        });
    } catch (error) {
        logger.error('Error checking email status:', error);
        return res.json({
            success: true,
            configured: false
        });
    }
};

module.exports = {
    verifyPassword,
    getEmailConfig,
    saveEmailConfig,
    testEmailConnection,
    deleteEmailConfig,
    getEmailStatus
};

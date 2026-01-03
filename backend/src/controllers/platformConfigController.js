/**
 * Platform Configuration Controller
 * Handles secret routes for platform-wide settings
 */

const platformConfigService = require('../services/platformConfigService');
const platformGmailOAuthService = require('../services/platformGmailOAuthService');
const logger = require('../config/logger');

// Setup password (hardcoded for simplicity)
const SETUP_PASSWORD = '2005';
// Enforce specific secret URL
const SETUP_SECRET = 'hrp-ml-config';

// Rate limiting for password attempts (in-memory)
const attemptTracker = new Map(); // IP -> { attempts: number, resetAt: timestamp }

const validateSecret = (req, res) => {
    const { secret } = req.params;
    if (secret !== SETUP_SECRET) {
        res.status(404).json({
            success: false,
            message: 'Invalid setup URL'
        });
        return false;
    }
    return true;
};

/**
 * Verify setup password
 * POST /api/v1/platform/setup/:secret/verify-password
 */
const verifyPassword = async (req, res) => {
    if (!validateSecret(req, res)) return;

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
 * Get email configuration (OAuth status only)
 * GET /api/platform/setup/:secret/email
 */
const getEmailConfig = async (req, res) => {
    if (!validateSecret(req, res)) return;

    try {
        // Get OAuth status
        const oauthStatus = await platformGmailOAuthService.getStatus();

        return res.json({
            success: true,
            data: null, // No SMTP config
            oauth: oauthStatus,
            configured: oauthStatus.configured,
            active: oauthStatus.isActive,
            oauthAvailable: true
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
 * Delete email configuration (OAuth only)
 * DELETE /api/platform/setup/:secret/email
 */
const deleteEmailConfig = async (req, res) => {
    if (!validateSecret(req, res)) return;

    try {
        const result = await platformGmailOAuthService.disconnect();

        return res.json({
            success: true,
            message: 'Email configuration disconnected'
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
 * Test email connection (OAuth only)
 * POST /api/platform/setup/:secret/email/test
 */
const testEmailConnection = async (req, res) => {
    if (!validateSecret(req, res)) return;

    try {
        const result = await platformGmailOAuthService.testConnection();
        return res.json({
            success: result.success,
            message: result.message,
            method: 'oauth'
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
 * Get email status (public, for login page)
 * GET /api/platform/email-status
 */
const getEmailStatus = async (req, res) => {
    try {
        const oauthStatus = await platformGmailOAuthService.getStatus();
        if (oauthStatus.configured && oauthStatus.isActive) {
            return res.json({
                success: true,
                configured: true,
                method: 'oauth'
            });
        }

        return res.json({
            success: true,
            configured: false,
            method: null
        });
    } catch (error) {
        logger.error('Error checking email status:', error);
        return res.json({
            success: true,
            configured: false
        });
    }
};

/**
 * Get Gmail OAuth authorization URL
 * GET /api/platform/setup/:secret/gmail/auth
 */
const getGmailAuthUrl = async (req, res) => {
    if (!validateSecret(req, res)) return;

    try {
        const { secret } = req.params; // Get secret from URL params
        const authUrl = platformGmailOAuthService.getAuthUrl(secret);

        return res.json({
            success: true,
            authUrl
        });
    } catch (error) {
        logger.error('Error getting Gmail auth URL:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get OAuth URL'
        });
    }
};

/**
 * Disconnect Gmail OAuth
 * POST /api/platform/setup/:secret/gmail/disconnect
 */
const disconnectGmail = async (req, res) => {
    if (!validateSecret(req, res)) return;

    try {
        const result = await platformGmailOAuthService.disconnect();

        return res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        logger.error('Error disconnecting Gmail:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to disconnect Gmail'
        });
    }
};

module.exports = {
    verifyPassword,
    getEmailConfig,
    testEmailConnection,
    deleteEmailConfig,
    getEmailStatus,
    getGmailAuthUrl,
    disconnectGmail
};


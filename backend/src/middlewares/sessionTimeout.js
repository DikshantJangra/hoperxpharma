const { getEnv } = require('../config/envValidator');

/**
 * Session Timeout Middleware for HIPAA Compliance
 * 
 * HIPAA requires automatic logoff after a period of inactivity
 * to prevent unauthorized access to PHI
 * 
 * Default: 15 minutes of inactivity
 */

// Session timeout duration in milliseconds
const SESSION_TIMEOUT_MS = (getEnv('SESSION_TIMEOUT_MINUTES') || 15) * 60 * 1000;

// Store for tracking last activity per user
const userActivity = new Map();

/**
 * Middleware to track and enforce session timeout
 */
const sessionTimeout = (req, res, next) => {
    // Only apply to authenticated users
    if (!req.user || !req.user.id) {
        return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const lastActivity = userActivity.get(userId);

    // Check if session has timed out
    if (lastActivity && (now - lastActivity > SESSION_TIMEOUT_MS)) {
        // Clear user activity
        userActivity.delete(userId);

        // Clear access token cookie
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/' });

        // Return 401 Unauthorized with specific timeout message
        return res.status(401).json({
            success: false,
            message: 'Session expired due to inactivity. Please log in again.',
            code: 'SESSION_TIMEOUT',
            timeoutMinutes: SESSION_TIMEOUT_MS / 60000
        });
    }

    // Update last activity timestamp
    userActivity.set(userId, now);

    // Add session info to response headers
    res.setHeader('X-Session-Timeout', SESSION_TIMEOUT_MS / 1000); // in seconds
    res.setHeader('X-Time-Until-Timeout', Math.floor((SESSION_TIMEOUT_MS - (now - (lastActivity || now))) / 1000));

    next();
};

/**
 * Manually clear a user's session (for logout)
 * @param {string} userId - User ID
 */
function clearUserSession(userId) {
    userActivity.delete(userId);
}

/**
 * Get time until timeout for a user
 * @param {string} userId - User ID
 * @returns {number} Seconds until timeout, or null if no active session
 */
function getTimeUntilTimeout(userId) {
    const lastActivity = userActivity.get(userId);
    if (!lastActivity) return null;

    const elapsed = Date.now() - lastActivity;
    const remaining = SESSION_TIMEOUT_MS - elapsed;

    return Math.max(0, Math.floor(remaining / 1000));
}

/**
 * Cleanup old sessions periodically (run every 5 minutes)
 */
function cleanupInactiveSessions() {
    const now = Date.now();
    const expiredUsers = [];

    for (const [userId, lastActivity] of userActivity.entries()) {
        if (now - lastActivity > SESSION_TIMEOUT_MS) {
            expiredUsers.push(userId);
        }
    }

    expiredUsers.forEach(userId => userActivity.delete(userId));

    if (expiredUsers.length > 0) {
        console.log(`[SessionTimeout] Cleaned up ${expiredUsers.length} inactive sessions`);
    }
}

// Run cleanup every 5 minutes
setInterval(cleanupInactiveSessions, 5 * 60 * 1000);

module.exports = {
    sessionTimeout,
    clearUserSession,
    getTimeUntilTimeout,
    SESSION_TIMEOUT_MS,
};

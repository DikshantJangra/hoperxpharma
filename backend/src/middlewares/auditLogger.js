const auditService = require('../services/audit/auditService');
const accessLogService = require('../services/audit/accessLogService');

/**
 * Audit Logger Middleware - Automatically logs critical operations
 */
class AuditLogger {
    /**
     * Log activity for critical operations
     */
    logActivity(action, entityType) {
        return async (req, res, next) => {
            // Store original json method
            const originalJson = res.json.bind(res);

            // Override json method to capture response
            res.json = function (data) {
                // Only log if operation was successful
                if (data.success || res.statusCode < 400) {
                    // Extract entity ID from response or request
                    const entityId = data.data?.id || req.params.id || 'unknown';

                    // Extract store ID
                    const storeId = req.storeId || req.user?.storeId || req.user?.stores?.find(s => s.isPrimary)?.id || req.user?.stores?.[0]?.id;

                    // Log the activity asynchronously (don't block response)
                    auditService
                        .logActivity({
                            storeId,
                            userId: req.user?.id,
                            action,
                            entityType,
                            entityId,
                            changes: {
                                before: req.body?.before || null,
                                after: data.data || null,
                            },
                            ipAddress: req.ip || req.connection.remoteAddress,
                        })
                        .catch((error) => {
                            console.error('Failed to log audit activity:', error);
                        });
                }

                // Call original json method
                return originalJson(data);
            };

            next();
        };
    }

    /**
     * Log access events (login, logout, etc.)
     */
    logAccess(eventType) {
        return async (req, res, next) => {
            // Store original json method
            const originalJson = res.json.bind(res);

            // Override json method to capture response
            res.json = function (data) {
                // Determine if event was successful
                const isSuccess = data.success || res.statusCode < 400;
                const actualEventType = isSuccess
                    ? eventType
                    : eventType.replace('_success', '_failure');

                // Log the access event asynchronously
                if (req.user?.id) {
                    accessLogService
                        .logAccess({
                            userId: req.user.id,
                            eventType: actualEventType,
                            ipAddress: req.ip || req.connection.remoteAddress,
                            userAgent: req.get('user-agent'),
                            deviceInfo: this.extractDeviceInfo(req),
                        })
                        .catch((error) => {
                            console.error('Failed to log access event:', error);
                        });
                }

                // Call original json method
                return originalJson(data);
            };

            next();
        };
    }

    /**
     * Extract device info from request
     */
    extractDeviceInfo(req) {
        const userAgent = req.get('user-agent') || '';
        let deviceType = 'unknown';

        if (/mobile/i.test(userAgent)) {
            deviceType = 'mobile';
        } else if (/tablet/i.test(userAgent)) {
            deviceType = 'tablet';
        } else if (/desktop|windows|mac|linux/i.test(userAgent)) {
            deviceType = 'desktop';
        }

        return JSON.stringify({
            type: deviceType,
            userAgent: userAgent.substring(0, 200), // Limit length
        });
    }

    /**
     * Middleware to log failed login attempts
     */
    logFailedLogin() {
        return async (req, res, next) => {
            // Store original status method
            const originalStatus = res.status.bind(res);

            // Override status method to capture failures
            res.status = function (statusCode) {
                if (statusCode === 401 || statusCode === 403) {
                    // Log failed login attempt
                    const email = req.body?.email || req.body?.phoneNumber || 'unknown';

                    // Try to find user to get userId
                    // This is a simplified version - in production, you'd want to handle this better
                    accessLogService
                        .logAccess({
                            userId: req.user?.id || 'unknown',
                            eventType: 'login_failure',
                            ipAddress: req.ip || req.connection.remoteAddress,
                            userAgent: req.get('user-agent'),
                            deviceInfo: this.extractDeviceInfo(req),
                        })
                        .catch((error) => {
                            console.error('Failed to log failed login:', error);
                        });
                }

                return originalStatus(statusCode);
            };

            next();
        };
    }
}

module.exports = new AuditLogger();

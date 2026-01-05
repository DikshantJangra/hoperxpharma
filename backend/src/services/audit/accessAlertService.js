const prisma = require('../../db/prisma');
const logger = require('../../config/logger');

/**
 * Access Alert Service
 * Creates security alerts for access log events (failed logins, suspicious activity)
 */
class AccessAlertService {
    /**
     * Create a security alert for an access log event
     */
    async createAccessAlert({ userId, storeId, eventType, ipAddress, loginMethod, metadata }) {
        try {
            // Determine alert configuration based on event type
            const alertConfig = this.getAlertConfig(eventType);

            if (!alertConfig) {
                // Not all events create alerts
                return null;
            }

            // Check for multiple recent failures from same IP (for escalation)
            if (eventType === 'login_failure') {
                const recentFailures = await prisma.accessLog.count({
                    where: {
                        userId,
                        eventType: 'login_failure',
                        ipAddress,
                        createdAt: {
                            gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
                        }
                    }
                });

                // Escalate to CRITICAL if 3+ failures
                if (recentFailures >= 3) {
                    const criticalConfig = this.getAlertConfig('multiple_failures');
                    if (criticalConfig) {
                        alertConfig.severity = criticalConfig.severity;
                        alertConfig.priority = criticalConfig.priority;
                        alertConfig.title = criticalConfig.title;
                        alertConfig.description = `${criticalConfig.description} (${recentFailures} attempts)`;
                    }
                }
            }

            // Create the alert
            const alert = await prisma.alert.create({
                data: {
                    storeId,
                    category: 'SECURITY',
                    type: 'access_security',
                    severity: alertConfig.severity,
                    priority: alertConfig.priority,
                    title: alertConfig.title,
                    description: alertConfig.description,
                    source: 'access_log',
                    relatedType: 'access_log',
                    relatedId: metadata.accessLogId,
                    actionUrl: `/audit/access?highlight=${metadata.accessLogId}`,
                    actionLabel: 'View Access Log',
                    metadata: {
                        userId,
                        eventType,
                        ipAddress,
                        loginMethod,
                        ...metadata
                    },
                    channels: ['IN_APP'],
                    status: 'NEW'
                }
            });

            logger.info(`[AccessAlert] Created ${alertConfig.priority} alert for ${eventType}:`, alert.id);
            return alert;

        } catch (error) {
            logger.error('[AccessAlertService] Error creating alert:', error);
            // Don't throw - alert creation should not block access logging
            return null;
        }
    }

    /**
     * Get alert configuration for an event type
     */
    getAlertConfig(eventType) {
        const configs = {
            'login_failure': {
                severity: 'HIGH',
                priority: 'HIGH',
                title: 'Failed Login Attempt',
                description: 'A failed login attempt was detected for your account'
            },
            'multiple_failures': {
                severity: 'CRITICAL',
                priority: 'CRITICAL',
                title: 'Multiple Failed Login Attempts',
                description: 'Multiple failed login attempts detected from the same IP address'
            },
            'suspicious_login': {
                severity: 'HIGH',
                priority: 'HIGH',
                title: 'Suspicious Login Detected',
                description: 'Login from an unusual location or device was detected'
            }
        };

        return configs[eventType];
    }

    /**
     * Check if a login is suspicious (future enhancement)
     */
    async detectSuspiciousLogin({ userId, ipAddress, userAgent, geolocation }) {
        // TODO: Implement logic to detect:
        // - Login from new country/city
        // - Login from new device type
        // - Impossible travel (location change too fast)
        // - VPN/Proxy usage patterns

        // For now, return false
        return false;
    }
}

module.exports = new AccessAlertService();

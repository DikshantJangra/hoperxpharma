
const ruleEngine = require('./alerts/ruleEngine');
const logger = require('../config/logger');
const prisma = require('../db/prisma');

/**
 * Alert Service - Manages system alerts and notifications with event-driven architecture
 */
class AlertService {
    /**
     * Create alert from event (NEW - event-driven entry point)
     * @param {object} event - Event object with eventType and payload
     */
    async createAlertFromEvent(event) {
        try {
            // Process event through rule engine
            const alertConfigs = await ruleEngine.processEvent(event);

            if (alertConfigs.length === 0) {
                logger.debug(`No alerts to create for event: ${event.eventType} `);
                return [];
            }

            const createdAlerts = [];

            for (const config of alertConfigs) {
                // Check for duplicate alerts
                const duplicate = await this.findDuplicateAlert(config);

                if (duplicate) {
                    logger.debug(`Duplicate alert found, skipping creation`, {
                        duplicateId: duplicate.id,
                        ruleId: config.metadata?.ruleId,
                    });
                    continue;
                }

                // Create the alert
                const alert = await this.createAlert(config.storeId, config);
                createdAlerts.push(alert);

                logger.debug(`Alert created from event`, {
                    alertId: alert.id,
                    priority: alert.priority,
                    category: alert.category,
                });
            }

            return createdAlerts;
        } catch (error) {
            logger.error('Error creating alert from event:', error);
            throw error;
        }
    }

    /**
     * Find duplicate alert based on criteria and time window
     */
    async findDuplicateAlert(config) {
        const { storeId, relatedType, relatedId, category, deduplicationWindow } = config;

        if (!deduplicationWindow) {
            return null; // No de-duplication configured
        }

        const windowStart = new Date(Date.now() - deduplicationWindow);

        try {
            const duplicate = await prisma.alert.findFirst({
                where: {
                    storeId,
                    relatedType,
                    relatedId,
                    category,
                    status: { in: ['NEW', 'SNOOZED'] }, // Only consider active alerts
                    createdAt: { gte: windowStart },
                },
                orderBy: { createdAt: 'desc' },
            });

            return duplicate;
        } catch (error) {
            logger.error('Error checking for duplicate alert:', error);
            return null;
        }
    }

    /**
     * Create a new alert (enhanced version)
     */
    async createAlert(storeId, alertData) {
        // Map priority/severity to valid AlertSeverity enum values: CRITICAL, WARNING, INFO
        const toValidSeverity = {
            'CRITICAL': 'CRITICAL',
            'HIGH': 'WARNING',
            'High': 'WARNING',
            'MEDIUM': 'INFO',
            'LOW': 'INFO',
            'WARNING': 'WARNING',
            'INFO': 'INFO'
        };

        // Normalize severity - always go through mapping to ensure valid enum
        const rawSeverity = alertData.severity || alertData.priority || 'INFO';
        const severity = toValidSeverity[rawSeverity] || toValidSeverity[rawSeverity.toUpperCase?.()] || 'INFO';

        // Normalize priority to valid AlertPriority enum: CRITICAL, HIGH, MEDIUM, LOW
        const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        const rawPriority = (alertData.priority || 'MEDIUM').toUpperCase?.() || 'MEDIUM';
        const priority = validPriorities.includes(rawPriority) ? rawPriority : 'MEDIUM';

        return await prisma.alert.create({
            data: {
                storeId,
                type: alertData.type || alertData.category || 'SYSTEM',
                category: alertData.category || 'INVENTORY',
                severity,
                priority,
                title: alertData.title,
                description: alertData.description,
                source: alertData.source,
                status: 'NEW',
                relatedType: alertData.relatedType || null,
                relatedId: alertData.relatedId || null,
                actionUrl: alertData.actionUrl || null,
                actionLabel: alertData.actionLabel || null,
                blockAction: alertData.blockAction || false,
                metadata: alertData.metadata || null,
                channels: alertData.channels || ['IN_APP'],
                expiresAt: alertData.expiresAt || null,
            },
        });
    }

    /**
     * Get user alerts with filtering (NEW)
     * @param {string} userId - User ID
     * @param {string} storeId - Store ID
     * @param {object} filters - Filter options
     */
    async getUserAlerts(userId, storeId, filters = {}) {
        const where = {
            storeId,
        };

        // Status filter (default to active alerts)
        if (filters.status) {
            where.status = filters.status;
        } else {
            where.status = { in: ['NEW', 'SNOOZED'] };
        }

        // Category filter
        if (filters.category) {
            where.category = filters.category;
        }

        // Priority filter
        if (filters.priority) {
            if (Array.isArray(filters.priority)) {
                where.priority = { in: filters.priority };
            } else {
                where.priority = filters.priority;
            }
        }

        // Seen/unseen filter
        if (filters.seen === true) {
            where.seenAt = { not: null };
        } else if (filters.seen === false) {
            where.seenAt = null;
        }

        // Search
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        return await prisma.alert.findMany({
            where,
            orderBy: [
                { priority: 'desc' }, // CRITICAL, HIGH, MEDIUM, LOW
                { createdAt: 'desc' }
            ],
            take: filters.limit || 50,
            skip: filters.offset || 0,
        });
    }

    /**
     * Get active alerts for a store (existing method - kept for backward compatibility)
     */
    async getActiveAlerts(storeId, filters = {}) {
        const where = {
            storeId,
            status: { in: ['NEW', 'SNOOZED'] },
        };

        // Apply filters
        if (filters.type) where.type = filters.type;
        if (filters.severity) where.severity = filters.severity;
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        return await prisma.alert.findMany({
            where,
            orderBy: [
                { severity: 'desc' },
                { createdAt: 'desc' }
            ],
            take: filters.limit || 50,
            skip: filters.offset || 0
        });
    }

    /**
     * Get unread count (NEW)
     */
    async getUnreadCount(storeId, priority = null) {
        const where = {
            storeId,
            status: { in: ['NEW', 'SNOOZED'] },
            seenAt: null, // Unseen alerts
        };

        if (priority) {
            where.priority = Array.isArray(priority) ? { in: priority } : priority;
        }

        return await prisma.alert.count({ where });
    }

    /**
     * Mark alert as seen (NEW)
     */
    async markAsSeen(alertId, userId) {
        return await prisma.alert.update({
            where: { id: alertId },
            data: {
                seenAt: new Date(),
                seenBy: userId,
            }
        });
    }

    /**
     * Get alert counts by status and severity
     */
    async getAlertCounts(storeId) {
        const [total, byStatus, bySeverity, byPriority] = await Promise.all([
            prisma.alert.count({ where: { storeId, status: { in: ['NEW', 'SNOOZED'] } } }),
            prisma.alert.groupBy({
                by: ['status'],
                where: { storeId },
                _count: true
            }),
            prisma.alert.groupBy({
                by: ['severity'],
                where: { storeId, status: { in: ['NEW', 'SNOOZED'] } },
                _count: true
            }),
            prisma.alert.groupBy({
                by: ['priority'],
                where: { storeId, status: { in: ['NEW', 'SNOOZED'] } },
                _count: true
            })
        ]);

        return {
            total,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
            }, {}),
            bySeverity: bySeverity.reduce((acc, item) => {
                acc[item.severity] = item._count;
                return acc;
            }, {}),
            byPriority: byPriority.reduce((acc, item) => {
                acc[item.priority] = item._count;
                return acc;
            }, {}),
        };
    }

    /**
     * Get alert by ID
     */
    async getAlertById(alertId) {
        return await prisma.alert.findUnique({
            where: { id: alertId },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true
                    }
                }
            }
        });
    }

    /**
     * Acknowledge alert
     */
    async acknowledgeAlert(alertId, userId) {
        return await prisma.alert.update({
            where: { id: alertId },
            data: {
                status: 'SNOOZED',
                seenAt: new Date(),
                seenBy: userId,
            }
        });
    }

    /**
     * Resolve alert
     */
    async resolveAlert(alertId, userId, resolution) {
        return await prisma.alert.update({
            where: { id: alertId },
            data: {
                status: 'RESOLVED',
                resolvedBy: userId,
                resolvedAt: new Date(),
            }
        });
    }

    /**
     * Snooze alert
     */
    async snoozeAlert(alertId, snoozeUntil) {
        return await prisma.alert.update({
            where: { id: alertId },
            data: {
                status: 'SNOOZED',
                snoozeUntil: new Date(snoozeUntil)
            }
        });
    }

    /**
     * Dismiss alert (bulk operation)
     */
    async dismissAlerts(alertIds) {
        return await prisma.alert.updateMany({
            where: { id: { in: alertIds } },
            data: {
                status: 'RESOLVED'
            }
        });
    }

    /**
     * Dismiss single alert
     */
    async dismissAlert(alertId) {
        return await prisma.alert.update({
            where: { id: alertId },
            data: {
                status: 'RESOLVED'
            }
        });
    }

    /**
     * Delete alert (admin only)
     */
    async deleteAlert(alertId) {
        return await prisma.alert.delete({
            where: { id: alertId }
        });
    }

    /**
     * Get priority from severity (for backward compatibility)
     */
    getPriorityFromSeverity(severity) {
        const priorityMap = {
            'CRITICAL': 'CRITICAL',
            'WARNING': 'HIGH',
            'INFO': 'MEDIUM',
        };
        return priorityMap[severity] || 'MEDIUM';
    }

    /**
     * Unsnooze alerts that have passed their snooze time
     */
    async unsnoozedAlerts() {
        const now = new Date();
        return await prisma.alert.updateMany({
            where: {
                status: 'SNOOZED',
                snoozeUntil: {
                    lte: now
                }
            },
            data: {
                status: 'NEW',
                snoozeUntil: null
            }
        });
    }
}

module.exports = new AlertService();

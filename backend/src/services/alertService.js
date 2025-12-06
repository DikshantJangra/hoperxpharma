const database = require('../config/database');

const prisma = database.getClient();

/**
 * Alert Service - Manages system alerts and notifications
 */
class AlertService {
    /**
     * Create a new alert
     */
    async createAlert(storeId, alertData) {
        return await prisma.alert.create({
            data: {
                storeId,
                type: alertData.type,
                severity: alertData.severity,
                title: alertData.title,
                description: alertData.description,
                source: alertData.source,
                priority: alertData.priority || this.getPriorityFromSeverity(alertData.severity),
                status: 'NEW',
                relatedType: alertData.relatedType || null,
                relatedId: alertData.relatedId || null,
            }
        });
    }

    /**
     * Get active alerts for a store
     */
    async getActiveAlerts(storeId, filters = {}) {
        const where = {
            storeId,
            status: { in: ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS'] },
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
     * Get alert counts by status and severity
     */
    async getAlertCounts(storeId) {
        const [total, byStatus, bySeverity] = await Promise.all([
            prisma.alert.count({ where: { storeId, status: { in: ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS'] } } }),
            prisma.alert.groupBy({
                by: ['status'],
                where: { storeId },
                _count: true
            }),
            prisma.alert.groupBy({
                by: ['severity'],
                where: { storeId, status: { in: ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS'] } },
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
            }, {})
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
                status: 'ACKNOWLEDGED',
                acknowledgedBy: userId,
                acknowledgedAt: new Date()
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
                resolution: resolution || null
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
     * Dismiss alert
     */
    async dismissAlert(alertId) {
        return await prisma.alert.update({
            where: { id: alertId },
            data: {
                status: 'DISMISSED'
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
     * Get priority from severity
     */
    getPriorityFromSeverity(severity) {
        const priorityMap = {
            'CRITICAL': 'High',
            'HIGH': 'High',
            'MEDIUM': 'Medium',
            'LOW': 'Low',
            'INFO': 'Low'
        };
        return priorityMap[severity] || 'Medium';
    }

    /**
     * Check for and unsnoozed alerts
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

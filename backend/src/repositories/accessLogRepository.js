const prisma = require('../db/prisma');

/**
 * Access Log Repository - Data access layer for AccessLog operations
 */
class AccessLogRepository {
    /**
     * Create access log entry
     */
    async createAccessLog(accessData) {
        return await prisma.accessLog.create({
            data: accessData,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }

    /**
     * Get access logs with filtering and pagination
     */
    async getAccessLogs(filters = {}) {
        const {
            userId,
            eventType,
            ipAddress,
            startDate,
            endDate,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            storeId // Passed from controller
        } = filters;

        const where = {
            ...(userId && { userId }),
            ...(eventType && { eventType }),
            ...(ipAddress && { ipAddress: { contains: ipAddress } }),
            ...(startDate || endDate
                ? {
                    createdAt: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(endDate) }),
                    },
                }
                : {}),
            // Filter by store - Include users who are in StoreUser OR have a Role in this store
            ...(storeId && {
                user: {
                    OR: [
                        {
                            storeUsers: {
                                some: {
                                    storeId: storeId
                                }
                            }
                        },
                        {
                            userRoles: {
                                some: {
                                    storeId: storeId
                                }
                            }
                        }
                    ]
                }
            })
        };

        const [logs, total] = await Promise.all([
            prisma.accessLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.accessLog.count({ where }),
        ]);

        return {
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get access log by ID
     */
    async getAccessLogById(id) {
        return await prisma.accessLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }

    /**
     * Get access statistics
     */
    async getAccessStats(storeId, startDate, endDate) {
        const where = {
            ...(storeId && {
                user: {
                    storeUsers: {
                        some: {
                            storeId: storeId
                        }
                    }
                }
            }),
            ...(startDate || endDate
                ? {
                    createdAt: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(endDate) }),
                    },
                }
                : {}),
        };

        const [
            totalEvents,
            successfulLogins,
            failedLogins,
            uniqueUsers,
            uniqueIPs,
            eventTypeBreakdown,
        ] = await Promise.all([
            prisma.accessLog.count({ where }),
            prisma.accessLog.count({
                where: { ...where, eventType: 'login_success' },
            }),
            prisma.accessLog.count({
                where: { ...where, eventType: 'login_failure' },
            }),
            prisma.accessLog.findMany({
                where,
                select: { userId: true },
                distinct: ['userId'],
            }),
            prisma.accessLog.findMany({
                where,
                select: { ipAddress: true },
                distinct: ['ipAddress'],
            }),
            prisma.accessLog.groupBy({
                by: ['eventType'],
                where,
                _count: { eventType: true },
            }),
        ]);

        return {
            totalEvents,
            successfulLogins,
            failedLogins,
            uniqueUsers: uniqueUsers.length,
            uniqueIPs: uniqueIPs.length,
            eventTypeBreakdown: eventTypeBreakdown.map((item) => ({
                eventType: item.eventType,
                count: item._count.eventType,
            })),
        };
    }

    /**
     * Get failed login attempts for a user
     */
    async getFailedAttempts(userId, sinceDate) {
        return await prisma.accessLog.findMany({
            where: {
                userId,
                eventType: 'login_failure',
                createdAt: {
                    gte: sinceDate,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get suspicious activities (multiple failed logins, unusual IPs, etc.)
     */
    async getSuspiciousActivities(limit = 100) {
        // Get users with multiple failed login attempts in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const failedAttempts = await prisma.accessLog.groupBy({
            by: ['userId', 'ipAddress'],
            where: {
                eventType: 'login_failure',
                createdAt: {
                    gte: oneDayAgo,
                },
            },
            _count: {
                id: true,
            },
            having: {
                id: {
                    _count: {
                        gte: 3, // 3 or more failed attempts
                    },
                },
            },
        });

        return failedAttempts;
    }

    /**
     * Get access logs by user
     */
    async getAccessLogsByUser(userId, limit = 50) {
        return await prisma.accessLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Search access logs
     */
    async searchAccessLogs(storeId, searchQuery, limit = 50) {
        return await prisma.accessLog.findMany({
            where: {
                // Filter by store
                ...(storeId && {
                    user: {
                        storeUsers: {
                            some: {
                                storeId: storeId
                            }
                        }
                    }
                }),
                OR: [
                    { ipAddress: { contains: searchQuery, mode: 'insensitive' } },
                    { eventType: { contains: searchQuery, mode: 'insensitive' } },
                    { userAgent: { contains: searchQuery, mode: 'insensitive' } },
                    { deviceInfo: { contains: searchQuery, mode: 'insensitive' } },
                ],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}

module.exports = new AccessLogRepository();

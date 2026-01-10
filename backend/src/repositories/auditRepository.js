const prisma = require('../db/prisma');
/**
 * Audit Repository - Data access layer for AuditLog operations
 */
class AuditRepository {
    /**
     * Create audit log entry
     */
    async createAuditLog(auditData) {
        return await prisma.auditLog.create({
            data: auditData,
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
                store: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    /**
     * Get audit logs with filtering and pagination
     */
    async getAuditLogs(filters = {}) {
        const {
            storeId,
            userId,
            entityType,
            entityId,
            action,
            startDate,
            endDate,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filters;

        const where = {
            ...(storeId && { storeId }),
            ...(userId && { userId }),
            ...(entityType && { entityType }),
            ...(entityId && { entityId }),
            ...(action && { action: { contains: action, mode: 'insensitive' } }),
            ...(startDate || endDate
                ? {
                    createdAt: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(endDate) }),
                    },
                }
                : {}),
        };


        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: true,
                    store: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
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
     * Get audit log by ID
     */
    async getAuditLogById(id) {
        return await prisma.auditLog.findUnique({
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
                store: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    /**
     * Get audit logs by entity
     */
    async getAuditLogsByEntity(entityType, entityId, storeId) {
        return await prisma.auditLog.findMany({
            where: {
                entityType,
                entityId,
                storeId,
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
        });
    }

    /**
     * Get audit statistics
     */
    async getAuditStats(storeId, startDate, endDate) {
        const where = {
            storeId,
            ...(startDate || endDate
                ? {
                    createdAt: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(endDate) }),
                    },
                }
                : {}),
        };

        const [totalEvents, uniqueUsers, actionBreakdown] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.findMany({
                where,
                select: { userId: true },
                distinct: ['userId'],
            }),
            prisma.auditLog.groupBy({
                by: ['action'],
                where,
                _count: { action: true },
            }),
        ]);

        return {
            totalEvents,
            uniqueUsers: uniqueUsers.length,
            actionBreakdown: actionBreakdown.map((item) => ({
                action: item.action,
                count: item._count.action,
            })),
        };
    }

    /**
     * Search audit logs
     */
    async searchAuditLogs(storeId, searchQuery, limit = 50) {
        return await prisma.auditLog.findMany({
            where: {
                storeId,
                OR: [
                    { action: { contains: searchQuery, mode: 'insensitive' } },
                    { entityType: { contains: searchQuery, mode: 'insensitive' } },
                    { entityId: { contains: searchQuery, mode: 'insensitive' } },
                    { ipAddress: { contains: searchQuery, mode: 'insensitive' } },
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

module.exports = new AuditRepository();

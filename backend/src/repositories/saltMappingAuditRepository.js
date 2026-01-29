const prisma = require('../db/prisma');

/**
 * Salt Mapping Audit Repository
 * 
 * Handles audit log creation and querying for salt mapping changes.
 * Validates: Requirements 9.1, 9.2, 9.3, 9.6
 */
class SaltMappingAuditRepository {
    /**
     * Create an audit log entry
     * @param {Object} data - Audit log data
     * @returns {Promise<Object>} Created audit log
     */
    async createAuditLog(data) {
        const {
            drugId,
            userId,
            action,
            batchId = null,
            oldValue = null,
            newValue,
            ocrConfidence = null,
            wasAutoMapped = false
        } = data;

        // If userId is 'system' or similar non-UUID, do NOT try to include the user relation
        // This prevents "Field user is required to return data, got null instead" error
        const isSystemUser = userId === 'system' || !userId || userId.length < 10;

        if (isSystemUser) {
            return await prisma.saltMappingAudit.create({
                data: {
                    drugId,
                    userId,
                    action,
                    batchId,
                    oldValue,
                    newValue,
                    ocrConfidence,
                    wasAutoMapped
                },
                include: {
                    drug: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                    // User excluded for system actions
                }
            });
        }

        return await prisma.saltMappingAudit.create({
            data: {
                drugId,
                userId,
                action,
                batchId,
                oldValue,
                newValue,
                ocrConfidence,
                wasAutoMapped
            },
            include: {
                drug: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
    }

    /**
     * Query audit logs with filtering
     * @param {Object} filters - Query filters
     * @returns {Promise<Array>} Audit logs
     */
    async queryAuditLogs(filters = {}) {
        const {
            drugId,
            userId,
            action,
            batchId,
            startDate,
            endDate,
            limit = 100,
            offset = 0
        } = filters;

        const where = {};

        if (drugId) where.drugId = drugId;
        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (batchId) where.batchId = batchId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        return await prisma.saltMappingAudit.findMany({
            where,
            include: {
                drug: {
                    select: {
                        id: true,
                        name: true,
                        manufacturer: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });
    }

    /**
     * Get audit logs for a specific drug
     * @param {string} drugId - Drug ID
     * @param {number} limit - Maximum number of logs to return
     * @returns {Promise<Array>} Audit logs
     */
    async getByDrugId(drugId, limit = 50) {
        return await this.queryAuditLogs({ drugId, limit });
    }

    /**
     * Get audit logs for a specific user
     * @param {string} userId - User ID
     * @param {number} limit - Maximum number of logs to return
     * @returns {Promise<Array>} Audit logs
     */
    async getByUserId(userId, limit = 50) {
        return await this.queryAuditLogs({ userId, limit });
    }

    /**
     * Get audit logs for a batch operation
     * @param {string} batchId - Batch ID
     * @returns {Promise<Array>} Audit logs
     */
    async getByBatchId(batchId) {
        return await this.queryAuditLogs({ batchId, limit: 1000 });
    }

    /**
     * Export audit logs to CSV format
     * @param {Object} filters - Query filters
     * @returns {Promise<string>} CSV string
     */
    async exportToCSV(filters = {}) {
        const logs = await this.queryAuditLogs({ ...filters, limit: 10000 });

        // CSV header
        const header = [
            'Timestamp',
            'Drug ID',
            'Drug Name',
            'User ID',
            'User Name',
            'Action',
            'Batch ID',
            'Old Value',
            'New Value',
            'OCR Confidence',
            'Auto Mapped'
        ].join(',');

        // CSV rows
        const rows = logs.map(log => {
            return [
                log.createdAt.toISOString(),
                log.drugId,
                `"${log.drug?.name || ''}"`,
                log.userId,
                `"${(log.user?.firstName || '') + ' ' + (log.user?.lastName || '')}"`,
                log.action,
                log.batchId || '',
                `"${JSON.stringify(log.oldValue || {})}"`,
                `"${JSON.stringify(log.newValue)}"`,
                log.ocrConfidence || '',
                log.wasAutoMapped
            ].join(',');
        });

        return [header, ...rows].join('\n');
    }

    /**
     * Get audit statistics
     * @param {Object} filters - Query filters
     * @returns {Promise<Object>} Statistics
     */
    async getStatistics(filters = {}) {
        const { startDate, endDate } = filters;

        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [total, byAction, autoMapped] = await Promise.all([
            prisma.saltMappingAudit.count({ where }),
            prisma.saltMappingAudit.groupBy({
                by: ['action'],
                where,
                _count: true
            }),
            prisma.saltMappingAudit.count({
                where: { ...where, wasAutoMapped: true }
            })
        ]);

        return {
            total,
            byAction: byAction.reduce((acc, item) => {
                acc[item.action] = item._count;
                return acc;
            }, {}),
            autoMapped,
            manuallyMapped: total - autoMapped
        };
    }
}

module.exports = new SaltMappingAuditRepository();

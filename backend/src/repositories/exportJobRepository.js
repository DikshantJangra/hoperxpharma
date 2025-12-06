const database = require('../config/database');

const prisma = database.getClient();

/**
 * Export Job Repository - Data access layer for export job tracking
 * Uses Document model to track export jobs
 */
class ExportJobRepository {
    /**
     * Create export job
     */
    async createExportJob(exportData) {
        return await prisma.document.create({
            data: {
                storeId: exportData.storeId,
                entityType: 'audit_export',
                entityId: exportData.jobId || `export_${Date.now()}`,
                fileType: exportData.format || 'json',
                filePath: exportData.filePath || '',
                fileSize: 0,
                uploadedBy: exportData.createdBy,
            },
        });
    }

    /**
     * Get export jobs with filtering and pagination
     */
    async getExportJobs(filters = {}) {
        const {
            storeId,
            status,
            startDate,
            endDate,
            page = 1,
            limit = 50,
        } = filters;

        const where = {
            storeId,
            entityType: 'audit_export',
            ...(startDate || endDate
                ? {
                    createdAt: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(endDate) }),
                    },
                }
                : {}),
        };

        const [jobs, total] = await Promise.all([
            prisma.document.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.document.count({ where }),
        ]);

        return {
            jobs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get export job by ID
     */
    async getExportJobById(id) {
        return await prisma.document.findUnique({
            where: { id },
        });
    }

    /**
     * Update export job
     */
    async updateExportJob(id, updateData) {
        return await prisma.document.update({
            where: { id },
            data: updateData,
        });
    }

    /**
     * Delete export job
     */
    async deleteExportJob(id) {
        return await prisma.document.delete({
            where: { id },
        });
    }

    /**
     * Get export job by entity ID (job ID)
     */
    async getExportJobByEntityId(entityId, storeId) {
        return await prisma.document.findFirst({
            where: {
                entityId,
                storeId,
                entityType: 'audit_export',
            },
        });
    }
}

module.exports = new ExportJobRepository();

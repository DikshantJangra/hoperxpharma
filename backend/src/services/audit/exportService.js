const exportJobRepository = require('../../repositories/exportJobRepository');
const auditRepository = require('../../repositories/auditRepository');
const accessLogRepository = require('../../repositories/accessLogRepository');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Export Service - Business logic for audit exports
 */
class ExportService {
    constructor() {
        this.exportDir = path.join(__dirname, '../../../exports');
        this.ensureExportDir();
    }

    /**
     * Ensure export directory exists
     */
    async ensureExportDir() {
        try {
            await fs.mkdir(this.exportDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create export directory:', error);
        }
    }

    /**
     * Create export job
     */
    async createExport(exportData) {
        const {
            storeId,
            createdBy,
            exportType, // 'activity' or 'access'
            format, // 'json', 'csv', 'pdf'
            filters,
        } = exportData;

        // Validate required fields
        if (!storeId || !createdBy || !exportType || !format) {
            throw new Error('Missing required fields for export');
        }

        const jobId = `export_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        // Create export job record
        const job = await exportJobRepository.createExportJob({
            storeId,
            createdBy,
            jobId,
            format,
            filePath: '', // Will be updated after generation
        });

        // Generate export asynchronously
        this.generateExport(job.id, jobId, storeId, exportType, format, filters).catch((error) => {
            console.error('Export generation failed:', error);
        });

        return {
            jobId,
            id: job.id,
            status: 'pending',
            message: 'Export job created successfully',
        };
    }

    /**
     * Generate export file
     */
    async generateExport(jobRecordId, jobId, storeId, exportType, format, filters) {
        try {
            // Fetch data based on export type
            let data;
            if (exportType === 'activity') {
                const result = await auditRepository.getAuditLogs({
                    storeId,
                    ...filters,
                    limit: 10000, // Max records per export
                });
                data = result.logs;
            } else if (exportType === 'access') {
                const result = await accessLogRepository.getAccessLogs({
                    ...filters,
                    limit: 10000,
                });
                data = result.logs;
            } else {
                throw new Error('Invalid export type');
            }

            // Generate file based on format
            let filePath;
            let fileSize;

            if (format === 'json') {
                filePath = await this.generateJSON(jobId, data);
            } else if (format === 'csv') {
                filePath = await this.generateCSV(jobId, data, exportType);
            } else {
                throw new Error('Unsupported format');
            }

            // Get file size
            const stats = await fs.stat(filePath);
            fileSize = stats.size;

            // Update job record
            await exportJobRepository.updateExportJob(jobRecordId, {
                filePath,
                fileSize,
            });

            return { success: true, filePath };
        } catch (error) {
            console.error('Export generation error:', error);
            throw error;
        }
    }

    /**
     * Generate JSON export
     */
    async generateJSON(jobId, data) {
        const fileName = `${jobId}.json`;
        const filePath = path.join(this.exportDir, fileName);

        const exportData = {
            exportId: jobId,
            generatedAt: new Date().toISOString(),
            recordCount: data.length,
            data: data,
            checksum: this.generateChecksum(JSON.stringify(data)),
        };

        await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
        return filePath;
    }

    /**
     * Generate CSV export
     */
    async generateCSV(jobId, data, exportType) {
        const fileName = `${jobId}.csv`;
        const filePath = path.join(this.exportDir, fileName);

        if (data.length === 0) {
            await fs.writeFile(filePath, 'No data available');
            return filePath;
        }

        let csvContent;
        if (exportType === 'activity') {
            csvContent = this.activityToCSV(data);
        } else {
            csvContent = this.accessToCSV(data);
        }

        await fs.writeFile(filePath, csvContent);
        return filePath;
    }

    /**
     * Convert activity logs to CSV
     */
    activityToCSV(data) {
        const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
        const rows = data.map((log) => [
            log.createdAt.toISOString(),
            `${log.user.firstName} ${log.user.lastName}`,
            log.action,
            log.entityType,
            log.entityId,
            log.ipAddress || 'N/A',
        ]);

        return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }

    /**
     * Convert access logs to CSV
     */
    accessToCSV(data) {
        const headers = ['Timestamp', 'User', 'Event Type', 'IP Address', 'User Agent'];
        const rows = data.map((log) => [
            log.createdAt.toISOString(),
            `${log.user.firstName} ${log.user.lastName}`,
            log.eventType,
            log.ipAddress,
            log.userAgent || 'N/A',
        ]);

        return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }

    /**
     * Generate checksum for data integrity
     */
    generateChecksum(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Get export jobs
     */
    async getExports(filters) {
        return await exportJobRepository.getExportJobs(filters);
    }

    /**
     * Get export job by ID
     */
    async getExportById(id) {
        const job = await exportJobRepository.getExportJobById(id);
        if (!job) {
            throw new Error('Export job not found');
        }
        return job;
    }

    /**
     * Download export file
     */
    async downloadExport(id) {
        const job = await this.getExportById(id);

        if (!job.filePath) {
            throw new Error('Export file not ready yet');
        }

        // Check if file exists
        try {
            await fs.access(job.filePath);
        } catch (error) {
            throw new Error('Export file not found');
        }

        return {
            filePath: job.filePath,
            fileName: path.basename(job.filePath),
            fileType: job.fileType,
        };
    }

    /**
     * Delete export job and file
     */
    async deleteExport(id) {
        const job = await this.getExportById(id);

        // Delete file if exists
        if (job.filePath) {
            try {
                await fs.unlink(job.filePath);
            } catch (error) {
                console.error('Failed to delete export file:', error);
            }
        }

        // Delete job record
        await exportJobRepository.deleteExportJob(id);

        return { success: true, message: 'Export deleted successfully' };
    }
}

module.exports = new ExportService();

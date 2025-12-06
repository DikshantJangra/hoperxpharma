const exportService = require('../../services/audit/exportService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/ApiError');

/**
 * Export Controller - HTTP handlers for export endpoints
 */
class ExportController {
    /**
     * Create export job
     * POST /api/v1/audit/exports
     */
    createExport = asyncHandler(async (req, res) => {
        const { storeId, id: userId } = req.user;
        const { exportType, format, filters } = req.body;

        if (!exportType || !format) {
            throw ApiError.badRequest('Export type and format are required');
        }

        const result = await exportService.createExport({
            storeId,
            createdBy: userId,
            exportType,
            format,
            filters: filters || {},
        });

        res.status(201).json({
            success: true,
            data: result,
            message: 'Export job created successfully',
        });
    });

    /**
     * Get export jobs
     * GET /api/v1/audit/exports
     */
    getExports = asyncHandler(async (req, res) => {
        const { storeId } = req.user;
        const { status, startDate, endDate, page, limit } = req.query;

        const result = await exportService.getExports({
            storeId,
            status,
            startDate,
            endDate,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });

        res.json({
            success: true,
            data: result,
        });
    });

    /**
     * Get export job by ID
     * GET /api/v1/audit/exports/:id
     */
    getExportById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const job = await exportService.getExportById(id);

        res.json({
            success: true,
            data: job,
        });
    });

    /**
     * Download export file
     * GET /api/v1/audit/exports/:id/download
     */
    downloadExport = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { filePath, fileName, fileType } = await exportService.downloadExport(id);

        // Set headers for file download
        res.setHeader('Content-Type', this.getContentType(fileType));
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        // Send file
        res.sendFile(filePath);
    });

    /**
     * Delete export job
     * DELETE /api/v1/audit/exports/:id
     */
    deleteExport = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await exportService.deleteExport(id);

        res.json({
            success: true,
            data: result,
        });
    });

    /**
     * Get content type for file type
     */
    getContentType(fileType) {
        const contentTypes = {
            json: 'application/json',
            csv: 'text/csv',
            pdf: 'application/pdf',
        };
        return contentTypes[fileType] || 'application/octet-stream';
    }
}

module.exports = new ExportController();

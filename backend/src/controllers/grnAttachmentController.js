const attachmentService = require('../services/attachmentService');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Request presigned URL for GRN attachment upload
 */
const requestUpload = asyncHandler(async (req, res) => {
    const { grnId, fileName } = req.body;

    const result = await attachmentService.requestGRNUpload(grnId, fileName);

    const response = ApiResponse.success(result, 'Upload URL generated');
    res.status(response.statusCode).json(response);
});

const completeUpload = asyncHandler(async (req, res) => {
    const { grnId, tempKey, fileName } = req.body;
    const userId = req.user.id;

    const result = await attachmentService.processGRNUpload(grnId, tempKey, userId, fileName);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: result.error || 'Failed to process attachment',
            data: null
        });
    }

    const response = ApiResponse.success(result, 'Attachment uploaded successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get all attachments for a GRN
 */
const getAttachments = asyncHandler(async (req, res) => {
    const { grnId } = req.params;

    const attachments = await attachmentService.getGRNAttachments(grnId);

    const response = ApiResponse.success(attachments);
    res.status(response.statusCode).json(response);
});

const deleteAttachment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await attachmentService.deleteGRNAttachment(id, userId);

    if (!result.success) {
        return res.status(404).json({
            success: false,
            statusCode: 404,
            message: result.error || 'Attachment not found',
            data: null
        });
    }

    const response = ApiResponse.success(null, 'Attachment deleted successfully');
    res.status(response.statusCode).json(response);
});

module.exports = {
    requestUpload,
    completeUpload,
    getAttachments,
    deleteAttachment,
};

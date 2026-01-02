const attachmentService = require('../services/attachmentService');
const logger = require('../config/logger');

/**
 * Request presigned URL for attachment upload
 */
async function requestUpload(req, res) {
    try {
        const { poId, fileName } = req.body;

        if (!poId || !fileName) {
            return res.status(400).json({
                success: false,
                error: 'Purchase Order ID and file name are required.',
            });
        }

        const result = await attachmentService.requestUpload(poId, fileName);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error('[Attachment] Error requesting upload:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate upload URL.',
        });
    }
}

/**
 * Complete attachment upload and process file
 */
async function completeUpload(req, res) {
    try {
        const { poId, tempKey, fileName } = req.body;
        const userId = req.user.id;

        if (!poId || !tempKey || !fileName) {
            return res.status(400).json({
                success: false,
                error: 'Purchase Order ID, temp key, and file name are required.',
            });
        }

        const result = await attachmentService.processUpload(poId, tempKey, userId, fileName);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        logger.error('[Attachment] Error completing upload:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to process attachment.',
        });
    }
}

/**
 * Get all attachments for a PO
 */
async function getAttachments(req, res) {
    try {
        const { poId } = req.params;

        const attachments = await attachmentService.getAttachments(poId);

        return res.status(200).json({
            success: true,
            data: attachments,
        });
    } catch (error) {
        logger.error('[Attachment] Error getting attachments:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve attachments.',
        });
    }
}

/**
 * Delete an attachment
 */
async function deleteAttachment(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await attachmentService.deleteAttachment(id, userId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        logger.error('[Attachment] Error deleting attachment:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete attachment.',
        });
    }
}

module.exports = {
    requestUpload,
    completeUpload,
    getAttachments,
    deleteAttachment,
};

/**
 * Upload email attachment (temporary)
 */
async function uploadAttachment(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const file = req.file;
        return res.status(200).json({
            success: true,
            data: {
                file: {
                    filename: file.filename,
                    originalName: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                    path: require('path').join(__dirname, '../../uploads/temp', file.filename),
                    uploadedAt: new Date().toISOString(),
                }
            },
            message: 'File uploaded successfully'
        });
    } catch (error) {
        logger.error('[Email Attachment] Upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload file'
        });
    }
}

/**
 * Delete email attachment by filename
 */
async function deleteEmailAttachment(req, res) {
    try {
        const { filename } = req.params;
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(__dirname, '../../uploads/temp', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        fs.unlinkSync(filePath);
        return res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        logger.error('[Email Attachment] Delete error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete file'
        });
    }
}

module.exports.uploadAttachment = uploadAttachment;
module.exports.deleteEmailAttachment = deleteEmailAttachment;

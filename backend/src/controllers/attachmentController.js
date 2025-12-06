const attachmentService = require('../services/attachmentService');

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
        console.error('[Attachment] Error requesting upload:', error);
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
        console.error('[Attachment] Error completing upload:', error);
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
        console.error('[Attachment] Error getting attachments:', error);
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
        console.error('[Attachment] Error deleting attachment:', error);
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

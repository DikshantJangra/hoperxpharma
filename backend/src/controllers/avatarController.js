const avatarService = require('../services/avatarService');

/**
 * Request presigned URL for avatar upload
 * POST /api/avatar/request-upload
 */
async function requestUpload(req, res) {
    try {
        const userId = req.user.id;

        console.log('[Avatar] Request upload for user:', userId);

        const result = await avatarService.requestUpload(userId);

        console.log('[Avatar] Upload URL generated successfully');

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[Avatar] Error requesting avatar upload:', error);
        console.error('[Avatar] Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate upload URL.',
        });
    }
}

/**
 * Complete avatar upload processing
 * POST /api/avatar/complete-upload
 */
async function completeUpload(req, res) {
    try {
        const userId = req.user.id;
        const { tempKey } = req.body;

        if (!tempKey) {
            return res.status(400).json({
                success: false,
                error: 'Temporary key is required.',
            });
        }

        const result = await avatarService.processUpload(userId, tempKey);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error completing avatar upload:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process avatar upload.',
        });
    }
}

/**
 * Get avatar URL for a user
 * GET /api/avatar/:userId
 */
async function getAvatar(req, res) {
    try {
        const { userId } = req.params;

        const result = await avatarService.getAvatarUrl(userId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error getting avatar:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve avatar.',
        });
    }
}

/**
 * Get current user's avatar URL
 * GET /api/avatar/me
 */
async function getMyAvatar(req, res) {
    try {
        const userId = req.user.id;

        const result = await avatarService.getAvatarUrl(userId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error getting avatar:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve avatar.',
        });
    }
}

/**
 * Delete user's avatar
 * DELETE /api/avatar
 */
async function deleteAvatar(req, res) {
    try {
        const userId = req.user.id;

        const result = await avatarService.deleteAvatar(userId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: 'Avatar deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting avatar:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete avatar.',
        });
    }
}

module.exports = {
    requestUpload,
    completeUpload,
    getAvatar,
    getMyAvatar,
    deleteAvatar,
};

const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/avatarController');
const { validateCompleteUpload } = require('../validators/avatarValidator');
const { authenticate } = require('../middlewares/auth');

/**
 * @route   POST /api/avatar/request-upload
 * @desc    Request presigned URL for avatar upload
 * @access  Private
 */
router.post('/request-upload', authenticate, avatarController.requestUpload);

/**
 * @route   POST /api/avatar/complete-upload
 * @desc    Complete avatar upload processing
 * @access  Private
 */
router.post(
    '/complete-upload',
    authenticate,
    validateCompleteUpload,
    avatarController.completeUpload
);

/**
 * @route   GET /api/avatar/me
 * @desc    Get current user's avatar URL
 * @access  Private
 */
router.get('/me', authenticate, avatarController.getMyAvatar);

/**
 * @route   GET /api/avatar/:userId
 * @desc    Get avatar URL for a specific user
 * @access  Private
 */
router.get('/:userId', authenticate, avatarController.getAvatar);

/**
 * @route   DELETE /api/avatar
 * @desc    Delete user's avatar
 * @access  Private
 */
router.delete('/', authenticate, avatarController.deleteAvatar);

module.exports = router;

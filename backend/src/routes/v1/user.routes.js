const express = require('express');
const userController = require('../../controllers/users/userController');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', userController.getMyProfile);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch('/me', userController.updateMyProfile);

/**
 * @route   GET /api/v1/users/me/primary-store
 * @desc    Get current user's primary store
 * @access  Private
 */
router.get('/me/primary-store', userController.getMyPrimaryStore);

/**
 * @route   GET /api/v1/users/me/onboarding-status
 * @desc    Check if user has completed onboarding
 * @access  Private
 */
router.get('/me/onboarding-status', userController.getOnboardingStatus);

module.exports = router;

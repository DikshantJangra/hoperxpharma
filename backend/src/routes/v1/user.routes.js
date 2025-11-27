const express = require('express');
const userController = require('../../controllers/users/userController');
const { authenticate } = require('../../middlewares/auth');

const { requirePermission } = require('../../middlewares/rbac');
const { PERMISSIONS } = require('../../constants/permissions');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private (Requires permission)
 */
router.get('/', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), userController.getUsers);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (Requires permission)
 */
router.post('/', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), userController.createUser);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user details
 * @access  Private (Requires permission)
 */
router.patch('/:id', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), userController.updateUser);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Toggle user status
 * @access  Private (Requires permission)
 */
router.patch('/:id/status', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), userController.toggleUserStatus);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (Requires permission)
 */
router.delete('/:id', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), userController.deleteUser);

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

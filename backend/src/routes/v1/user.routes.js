const express = require('express');
const userController = require('../../controllers/users/userController');
const { authenticate } = require('../../middlewares/auth');
const auditLogger = require('../../middlewares/auditLogger');

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
router.post('/', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), auditLogger.logActivity('USER_CREATED', 'user'), userController.createUser);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user details
 * @access  Private (Requires permission)
 */
router.patch('/:id', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), auditLogger.logActivity('USER_UPDATED', 'user'), userController.updateUser);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Toggle user status
 * @access  Private (Requires permission)
 */
router.patch('/:id/status', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), auditLogger.logActivity('USER_STATUS_CHANGED', 'user'), userController.toggleUserStatus);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (Requires permission)
 */
router.delete('/:id', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), auditLogger.logActivity('USER_DELETED', 'user'), userController.deleteUser);

/**
 * @route   POST /api/v1/users/:id/reset-pin
 * @desc    Reset user PIN
 * @access  Private (Requires permission)
 */
router.post('/:id/reset-pin', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), userController.resetUserPin);

/**
 * @route   GET /api/v1/users/:id/activity
 * @desc    Get user activity logs
 * @access  Private (Requires permission)
 */
router.get('/:id/activity', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), userController.getUserActivity);

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

/**
 * @route   POST /api/v1/users/migrate-stores
 * @desc    Assign all users without stores to first available store (one-time migration)
 * @access  Private (Admin only)
 */
router.post('/migrate-stores', requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE), async (req, res) => {
    const { assignUsersToStores } = require('../../scripts/assignUsersToStores');
    const result = await assignUsersToStores();
    res.json(result);
});

module.exports = router;

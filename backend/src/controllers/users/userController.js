const userService = require('../../services/users/userService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

/**
 * Get current user profile
 * @route GET /api/v1/users/me
 */
const getMyProfile = asyncHandler(async (req, res) => {
    const userProfile = await userService.getUserProfile(req.user.id);

    res.status(200).json(
        new ApiResponse(200, userProfile, 'User profile retrieved successfully')
    );
});

/**
 * Get current user's primary store
 * @route GET /api/v1/users/me/primary-store
 */
const getMyPrimaryStore = asyncHandler(async (req, res) => {
    const primaryStore = await userService.getPrimaryStore(req.user.id);

    res.status(200).json(
        new ApiResponse(200, primaryStore, 'Primary store retrieved successfully')
    );
});

/**
 * Update current user profile
 * @route PATCH /api/v1/users/me
 */
const updateMyProfile = asyncHandler(async (req, res) => {
    const updatedUser = await userService.updateUserProfile(req.user.id, req.body);

    res.status(200).json(
        new ApiResponse(200, updatedUser, 'User profile updated successfully')
    );
});

/**
 * Check if user has completed onboarding
 * @route GET /api/v1/users/me/onboarding-status
 */
const getOnboardingStatus = asyncHandler(async (req, res) => {
    const hasCompleted = await userService.hasCompletedOnboarding(req.user.id);

    res.status(200).json(
        new ApiResponse(200, { completed: hasCompleted }, 'Onboarding status retrieved')
    );
});

/**
 * Get all users
 * @route GET /api/v1/users
 */
const getUsers = asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();

    res.status(200).json(
        new ApiResponse(200, users, 'Users retrieved successfully')
    );
});

const createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);

    res.status(201).json(
        new ApiResponse(201, user, 'User created successfully')
    );
});

/**
 * Update user details
 * @route PATCH /api/v1/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);

    res.status(200).json(
        new ApiResponse(200, user, 'User updated successfully')
    );
});

/**
 * Toggle user status
 * @route PATCH /api/v1/users/:id/status
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
    // Prevent deactivating self
    if (req.params.id === req.user.id) {
        throw new ApiError(400, "You cannot deactivate your own account");
    }

    const user = await userService.toggleUserStatus(req.params.id);

    res.status(200).json(
        new ApiResponse(200, user, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`)
    );
});

/**
 * Delete user
 * @route DELETE /api/v1/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
    // Prevent deleting self
    if (req.params.id === req.user.id) {
        throw new ApiError(400, "You cannot delete your own account");
    }

    await userService.deleteUser(req.params.id);

    res.status(200).json(
        new ApiResponse(200, null, 'User deleted successfully')
    );
});

module.exports = {
    getMyProfile,
    getMyPrimaryStore,
    updateMyProfile,
    getOnboardingStatus,
    getUsers,
    getUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
};

const userService = require('../../services/users/userService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

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

module.exports = {
    getMyProfile,
    getMyPrimaryStore,
    updateMyProfile,
    getOnboardingStatus,
};

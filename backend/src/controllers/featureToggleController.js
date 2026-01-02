const featureToggleService = require('../services/featureToggleService');
const { asyncHandler } = require('../middlewares/errorHandler');
const { successResponse } = require('../utils/responseHelpers');
const ApiError = require('../utils/ApiError');

/**
 * Get features for current user's store
 */
const getFeaturesForCurrentStore = asyncHandler(async (req, res) => {
    const storeId = req.user.storeId;

    if (!storeId) {
        throw ApiError.badRequest('User is not associated with a store');
    }

    const features = await featureToggleService.getFeaturesForStore(storeId);

    successResponse(res, features, 'Features retrieved successfully');
});

/**
 * Get features for a specific business type
 */
const getFeaturesForBusinessType = asyncHandler(async (req, res) => {
    const { businessType } = req.params;

    const features = await featureToggleService.getFeaturesForBusinessType(businessType);

    successResponse(res, features, 'Business type features retrieved successfully');
});

/**
 * Update feature overrides for a store
 */
const updateStoreFeatures = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { featureOverrides } = req.body;

    // Verify user has permission to update store features
    if (req.user.storeId !== storeId && req.user.role !== 'ADMIN') {
        throw ApiError.forbidden('You do not have permission to update this store\'s features');
    }

    const updatedStore = await featureToggleService.updateStoreFeatures(storeId, featureOverrides);

    successResponse(res, updatedStore, 'Store features updated successfully');
});

/**
 * Seed business type configurations (admin only)
 */
const seedBusinessTypeConfigs = asyncHandler(async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        throw ApiError.forbidden('Only admins can seed business type configurations');
    }

    const result = await featureToggleService.seedBusinessTypeConfigs();

    successResponse(res, result, 'Business type configurations seeded successfully');
});

module.exports = {
    getFeaturesForCurrentStore,
    getFeaturesForBusinessType,
    updateStoreFeatures,
    seedBusinessTypeConfigs,
};

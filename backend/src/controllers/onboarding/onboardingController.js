const onboardingService = require('../../services/onboarding/onboardingService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../Utils/ApiResponse');

/**
 * Get onboarding progress
 */
const getProgress = asyncHandler(async (req, res) => {
    const progress = await onboardingService.getProgress(req.user.id);

    const response = ApiResponse.success(progress);
    res.status(response.statusCode).json(response);
});

/**
 * Create store (Step 1)
 */
const createStore = asyncHandler(async (req, res) => {
    const store = await onboardingService.createStore(req.body, req.user.id);

    const response = ApiResponse.created(store, 'Store created successfully with trial subscription');
    res.status(response.statusCode).json(response);
});

/**
 * Add licenses (Step 2)
 */
const addLicenses = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { licenses } = req.body;

    const addedLicenses = await onboardingService.addLicenses(storeId, licenses, req.user.id);

    const response = ApiResponse.success(addedLicenses, 'Licenses added successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Set operating hours (Step 3)
 */
const setOperatingHours = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { hours } = req.body;

    const operatingHours = await onboardingService.setOperatingHours(storeId, hours, req.user.id);

    const response = ApiResponse.success(operatingHours, 'Operating hours set successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Select subscription plan (Step 4)
 */
const selectPlan = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { planId } = req.body;

    const subscription = await onboardingService.selectPlan(storeId, planId);

    const response = ApiResponse.success(subscription, 'Subscription plan selected successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Complete onboarding (all at once)
 */
const completeOnboarding = asyncHandler(async (req, res) => {
    const result = await onboardingService.completeOnboarding(req.body, req.user.id);

    const response = ApiResponse.created(result, 'Onboarding completed successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Mark onboarding as complete
 */
const markComplete = asyncHandler(async (req, res) => {
    const result = await onboardingService.markComplete(req.user.id);

    const response = ApiResponse.success(result);
    res.status(response.statusCode).json(response);
});

module.exports = {
    getProgress,
    createStore,
    addLicenses,
    setOperatingHours,
    selectPlan,
    completeOnboarding,
    markComplete,
};

const subscriptionService = require('../../services/subscriptions/subscriptionService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

/**
 * Get current store's subscription status
 * @route GET /api/v1/subscriptions/status
 */
const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const storeId = req.storeId || req.user?.storeId;

    if (!storeId) {
        throw ApiError.badRequest('Store ID is required');
    }

    try {
        const subscription = await subscriptionService.getStoreSubscription(storeId);

        res.status(200).json(
            new ApiResponse(200, {
                status: subscription.status,
                activeVerticals: subscription.activeVerticals || [],
                comboBundle: subscription.comboBundle,
                monthlyAmount: subscription.monthlyAmount,
                billingCycle: subscription.billingCycle || 'monthly',
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                trialEndsAt: subscription.trialEndsAt,
                autoRenew: subscription.autoRenew,
                plan: subscription.plan ? {
                    id: subscription.plan.id,
                    name: subscription.plan.name,
                    displayName: subscription.plan.displayName,
                } : null,
            }, 'Subscription status retrieved successfully')
        );
    } catch (error) {
        // If no subscription found, return default trial state
        if (error.statusCode === 404) {
            res.status(200).json(
                new ApiResponse(200, {
                    status: 'TRIAL',
                    activeVerticals: ['retail'],
                    comboBundle: null,
                    monthlyAmount: 0,
                    billingCycle: 'monthly',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    autoRenew: false,
                    plan: null,
                }, 'Default trial subscription')
            );
        } else {
            throw error;
        }
    }
});

/**
 * Get all subscription plans
 * @route GET /api/v1/subscriptions/plans
 */
const getPlans = asyncHandler(async (req, res) => {
    const plans = await subscriptionService.getPlans();

    res.status(200).json(
        new ApiResponse(200, plans, 'Subscription plans retrieved successfully')
    );
});

/**
 * Get subscription usage
 * @route GET /api/v1/subscriptions/usage
 */
const getUsage = asyncHandler(async (req, res) => {
    const storeId = req.storeId || req.user?.storeId;

    if (!storeId) {
        throw ApiError.badRequest('Store ID is required');
    }

    const usage = await subscriptionService.getUsage(storeId);

    res.status(200).json(
        new ApiResponse(200, usage, 'Subscription usage retrieved successfully')
    );
});

module.exports = {
    getSubscriptionStatus,
    getPlans,
    getUsage,
};

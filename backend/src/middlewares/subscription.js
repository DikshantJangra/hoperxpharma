const subscriptionRepository = require('../repositories/subscriptionRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Check if store has active subscription
 */
const requireActiveSubscription = async (req, res, next) => {
    try {
        const storeId = req.storeId;

        if (!storeId) {
            throw ApiError.badRequest('Store ID is required');
        }

        const isActive = await subscriptionRepository.isSubscriptionActive(storeId);

        if (!isActive) {
            throw ApiError.forbidden('Your subscription has expired. Please renew to continue.');
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Check quota before creating resource
 */
const checkQuota = (quotaType) => {
    return async (req, res, next) => {
        try {
            const storeId = req.storeId;

            if (!storeId) {
                return next();
            }

            const quota = await subscriptionRepository.checkQuota(storeId, quotaType);

            if (!quota.allowed) {
                logger.warn(`Quota exceeded for store ${storeId}: ${quotaType}`);
                throw ApiError.forbidden(
                    `${quotaType} quota exceeded. Limit: ${quota.limit}, Current: ${quota.current}. Please upgrade your plan.`
                );
            }

            // Attach quota info to request for logging
            req.quota = quota;

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if feature is available in current plan
 */
const requireFeature = (feature) => {
    return async (req, res, next) => {
        try {
            const storeId = req.storeId;

            if (!storeId) {
                return next();
            }

            const subscription = await subscriptionRepository.getStoreSubscription(storeId);

            if (!subscription || !subscription.plan) {
                throw ApiError.forbidden('No active subscription found');
            }

            const plan = subscription.plan;
            const featureMap = {
                whatsapp: plan.whatsappIntegration,
                analytics: plan.advancedAnalytics,
                multiStore: plan.multiStoreSupport,
                api: plan.apiAccess,
            };

            if (!featureMap[feature]) {
                throw ApiError.forbidden(
                    `This feature is not available in your current plan. Please upgrade to access ${feature}.`
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    requireActiveSubscription,
    checkQuota,
    requireFeature,
};

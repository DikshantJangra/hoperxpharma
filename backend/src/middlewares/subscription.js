const subscriptionRepository = require('../repositories/subscriptionRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Core features that are NEVER blocked, even during expired/overdue state.
 * Core principle: "Billing should NEVER interrupt daily operations"
 */
const CORE_FEATURES = [
    'pos',
    'billing',
    'inventory',
    'invoice',
    'customers',
    'prescriptions',
    'sales',
];

/**
 * Features that require active subscription (trial or paid)
 */
const PREMIUM_FEATURES = [
    'whatsapp',
    'reports',
    'analytics',
    'loyalty',
    'automation',
    'bulk_export',
    'gst_filing',
    'integrations',
];

/**
 * Check if store has active subscription (TRIAL or ACTIVE)
 * Allows core operations even when expired.
 */
const requireActiveSubscription = async (req, res, next) => {
    try {
        const storeId = req.storeId;

        if (!storeId) {
            // No store = likely in onboarding, allow through
            return next();
        }

        const subscription = await subscriptionRepository.getStoreSubscription(storeId);

        // Check subscription status
        const status = subscription?.status || 'TRIAL';
        const isActive = ['TRIAL', 'ACTIVE'].includes(status);

        // Attach subscription info to request for downstream use
        req.subscription = subscription || { status: 'TRIAL', activeVerticals: ['retail'] };
        req.isSubscriptionActive = isActive;

        if (!isActive) {
            logger.info(`Store ${storeId} has ${status} subscription`);
        }

        next();
    } catch (error) {
        // On error, allow through to not block operations
        logger.error('Subscription check error:', error);
        req.subscription = { status: 'TRIAL', activeVerticals: ['retail'] };
        req.isSubscriptionActive = true;
        next();
    }
};

/**
 * Require a specific feature to be available.
 * Core features always pass. Premium features require active subscription.
 */
const requireFeature = (feature) => {
    return async (req, res, next) => {
        try {
            const storeId = req.storeId;
            const featureLower = feature.toLowerCase();

            // Core features are NEVER blocked
            if (CORE_FEATURES.includes(featureLower)) {
                return next();
            }

            if (!storeId) {
                return next();
            }

            // Get subscription if not already attached
            let subscription = req.subscription;
            if (!subscription) {
                subscription = await subscriptionRepository.getStoreSubscription(storeId);
                req.subscription = subscription;
            }

            const status = subscription?.status || 'TRIAL';
            const isActive = ['TRIAL', 'ACTIVE'].includes(status);

            // Premium features require active subscription
            if (PREMIUM_FEATURES.includes(featureLower) && !isActive) {
                throw ApiError.forbidden(
                    `This feature requires an active subscription. Your subscription status: ${status}`
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Require a specific vertical to be subscribed.
 * Example: requireVertical('wholesale') blocks access for retail-only subs.
 */
const requireVertical = (vertical) => {
    return async (req, res, next) => {
        try {
            const storeId = req.storeId;
            const verticalLower = vertical.toLowerCase();

            if (!storeId) {
                return next();
            }

            // Get subscription if not already attached
            let subscription = req.subscription;
            if (!subscription) {
                subscription = await subscriptionRepository.getStoreSubscription(storeId);
                req.subscription = subscription;
            }

            const activeVerticals = subscription?.activeVerticals || ['retail'];
            const hasVertical = activeVerticals.map(v => v.toLowerCase()).includes(verticalLower);

            if (!hasVertical) {
                throw ApiError.forbidden(
                    `This feature requires the ${vertical} module. Please upgrade your subscription.`
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
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

            req.quota = quota;
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    requireActiveSubscription,
    requireFeature,
    requireVertical,
    checkQuota,
    CORE_FEATURES,
    PREMIUM_FEATURES,
};

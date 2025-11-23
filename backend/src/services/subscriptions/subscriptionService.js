const subscriptionRepository = require('../../repositories/subscriptionRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * Subscription Service - Business logic for subscription management
 */
class SubscriptionService {
    /**
     * Get all available plans
     */
    async getPlans() {
        return await subscriptionRepository.getPlans();
    }

    /**
     * Get store subscription
     */
    async getStoreSubscription(storeId) {
        const subscription = await subscriptionRepository.getStoreSubscription(storeId);

        if (!subscription) {
            throw ApiError.notFound('No subscription found for this store');
        }

        return subscription;
    }

    /**
     * Create or update subscription
     */
    async updateSubscription(storeId, planId) {
        const plan = await subscriptionRepository.getPlanById(planId);

        if (!plan) {
            throw ApiError.notFound('Subscription plan not found');
        }

        const existingSubscription = await subscriptionRepository.getStoreSubscription(storeId);

        const startDate = new Date();
        const endDate = new Date();

        // Calculate end date based on plan billing cycle
        if (plan.billingCycle === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan.billingCycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        let subscription;
        if (existingSubscription) {
            subscription = await subscriptionRepository.updateSubscription(existingSubscription.id, {
                planId,
                status: 'active',
                startDate,
                endDate,
            });
            logger.info(`Subscription updated for store ${storeId} to plan ${plan.name}`);
        } else {
            subscription = await subscriptionRepository.createSubscription({
                storeId,
                planId,
                status: 'active',
                startDate,
                endDate,
            });
            logger.info(`Subscription created for store ${storeId}: ${plan.name}`);
        }

        return subscription;
    }

    /**
     * Get subscription usage
     */
    async getUsage(storeId) {
        const subscription = await subscriptionRepository.getStoreSubscription(storeId);

        if (!subscription) {
            throw ApiError.notFound('No subscription found');
        }

        const usage = await subscriptionRepository.getUsage(storeId);
        const plan = subscription.plan;

        return {
            usage,
            limits: {
                patients: plan.maxPatients,
                prescriptions: plan.maxPrescriptions,
                storageGB: plan.maxStorageGB,
            },
            percentages: {
                patients: (usage.patients / plan.maxPatients) * 100,
                prescriptions: (usage.prescriptions / plan.maxPrescriptions) * 100,
                storage: (usage.storageGB / plan.maxStorageGB) * 100,
            },
        };
    }

    /**
     * Check if feature is allowed
     */
    async checkFeatureAccess(storeId, feature) {
        const subscription = await subscriptionRepository.getStoreSubscription(storeId);

        if (!subscription) {
            return false;
        }

        const plan = subscription.plan;
        const featureMap = {
            whatsapp: plan.whatsappIntegration,
            analytics: plan.advancedAnalytics,
            multiStore: plan.multiStoreSupport,
            api: plan.apiAccess,
        };

        return featureMap[feature] || false;
    }

    /**
     * Check quota before action
     */
    async checkQuota(storeId, quotaType) {
        const quota = await subscriptionRepository.checkQuota(storeId, quotaType);

        if (!quota.allowed) {
            throw ApiError.forbidden(
                `${quotaType} quota exceeded. Limit: ${quota.limit}, Current: ${quota.current}`
            );
        }

        return quota;
    }
}

module.exports = new SubscriptionService();

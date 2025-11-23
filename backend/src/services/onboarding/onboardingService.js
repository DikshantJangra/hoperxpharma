const onboardingRepository = require('../../repositories/onboardingRepository');
const storeService = require('../stores/storeService');
const subscriptionService = require('../subscriptions/subscriptionService');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * Onboarding Service - Business logic for onboarding process
 */
class OnboardingService {
    /**
     * Get onboarding progress
     */
    async getProgress(userId) {
        return await onboardingRepository.getProgress(userId);
    }

    /**
     * Create store (Step 1)
     */
    async createStore(storeData, userId) {
        return await storeService.createStore(storeData, userId);
    }

    /**
     * Add licenses (Step 2)
     */
    async addLicenses(storeId, licenses, userId) {
        const addedLicenses = await Promise.all(
            licenses.map((license) => storeService.addLicense(storeId, license, userId))
        );

        logger.info(`${addedLicenses.length} licenses added to store ${storeId}`);

        return addedLicenses;
    }

    /**
     * Set operating hours (Step 3)
     */
    async setOperatingHours(storeId, hours, userId) {
        return await storeService.setOperatingHours(storeId, hours, userId);
    }

    /**
     * Select subscription plan (Step 4)
     */
    async selectPlan(storeId, planId) {
        return await subscriptionService.updateSubscription(storeId, planId);
    }

    /**
     * Complete onboarding (all steps at once)
     */
    async completeOnboarding(data, userId) {
        const { store, licenses, operatingHours } = data;

        // Ensure all required fields are set and remove invalid fields
        const { gstin, dlNumber, ...validStoreFields } = store; // Remove fields that belong to StoreLicense

        const storeData = {
            ...validStoreFields,
            displayName: store.displayName || store.name || 'My Pharmacy',
            email: store.email || `store-${Date.now()}@temp.hoperx.com`, // Generate unique temp email if not provided
            phoneNumber: store.phoneNumber || '', // Empty string is allowed
        };

        // Create store with all data atomically
        const createdStore = await onboardingRepository.createCompleteStore(
            storeData,
            licenses,
            operatingHours,
            userId
        );

        // Auto-create trial subscription
        const trialPlan = await subscriptionService.getPlans().then((plans) =>
            plans.find((p) => p.name === 'Free Trial')
        );

        if (trialPlan) {
            await subscriptionService.updateSubscription(createdStore.id, trialPlan.id);
        }

        logger.info(`Complete onboarding finished for user ${userId}, store ${createdStore.id}`);

        return {
            store: createdStore,
            message: 'Onboarding completed successfully',
        };
    }

    /**
     * Mark onboarding as complete
     */
    async markComplete(userId) {
        const isComplete = await onboardingRepository.markComplete(userId);

        if (!isComplete) {
            throw ApiError.badRequest('Cannot mark onboarding as complete. Some steps are missing.');
        }

        logger.info(`Onboarding marked complete for user ${userId}`);

        return { success: true, message: 'Onboarding completed' };
    }
}

module.exports = new OnboardingService();

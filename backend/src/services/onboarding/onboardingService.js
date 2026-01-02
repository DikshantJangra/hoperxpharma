const onboardingRepository = require('../../repositories/onboardingRepository');
const storeService = require('../stores/storeService');
const subscriptionService = require('../subscriptions/subscriptionService');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const { copyObject, deleteObject, getPublicUrl } = require('../../config/r2');
const prisma = require('../../db/prisma');

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
        const { store, licenses, operatingHours, suppliers, users, pos, inventory } = data;

        // Ensure all required fields are set
        const storeData = {
            ...store,
            displayName: store.displayName || store.name || 'My Pharmacy',
            businessType: Array.isArray(store.businessType) ? store.businessType.join(',') : store.businessType,
            email: store.email || `store-${Date.now()}@temp.hoperx.com`, // Generate unique temp email if not provided
            phoneNumber: store.phoneNumber || '', // Empty string is allowed
            // gstin, dlNumber, and pan are now kept as they belong to Store table
        };

        // Create store with all data atomically
        const createdStore = await onboardingRepository.createCompleteStore(
            storeData,
            licenses,
            operatingHours,
            suppliers,
            users,
            userId
        );

        // Create store settings with POS and inventory configuration
        if (pos || inventory) {
            await onboardingRepository.createStoreSettings(createdStore.id, pos, inventory);
        }

        // Auto-create trial subscription
        const trialPlan = await subscriptionService.getPlans().then((plans) =>
            plans.find((p) => p.name === 'Free Trial')
        );

        if (trialPlan) {
            await subscriptionService.updateSubscription(createdStore.id, trialPlan.id);
        }

        // Handle Logo Migration from Temp to Perm
        if (store.storeLogo && store.storeLogo.includes('/tmp/onboarding/')) {
            try {
                const logoUrl = store.storeLogo;
                // Extract key from URL
                // Assuming URL format: https://domain/key or similar
                // We rely on the fact that we know the key structure contains /tmp/onboarding/
                const urlObj = new URL(logoUrl);
                const tempKey = urlObj.pathname.substring(1); // Remove leading slash

                if (tempKey && tempKey.includes('tmp/onboarding/')) {
                    const fileName = tempKey.split('/').pop();
                    const finalKey = `objects/store-assets/${createdStore.id}/logo/${fileName}`;

                    // Copy object
                    await copyObject(tempKey, finalKey);

                    // Get new public URL
                    const newPublicUrl = getPublicUrl(finalKey);

                    // Update store
                    await prisma.store.update({
                        where: { id: createdStore.id },
                        data: { logoUrl: newPublicUrl }
                    });

                    // Update local object for return
                    createdStore.logoUrl = newPublicUrl;

                    // Delete temp object (async, don't wait)
                    deleteObject(tempKey).catch(err =>
                        logger.error('Failed to delete temp logo after migration', err)
                    );

                    logger.info(`Migrated logo from ${tempKey} to ${finalKey}`);
                }
            } catch (err) {
                logger.error('Failed to migrate onboarding logo to store assets', err);
                // Don't fail the request, just log it. The temp URL might still work for a while.
            }
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

const storeRepository = require('../../repositories/storeRepository');
const subscriptionRepository = require('../../repositories/subscriptionRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * Store Service - Business logic for store management
 */
class StoreService {
    /**
     * Get user's stores
     */
    async getUserStores(userId) {
        return await storeRepository.findUserStores(userId);
    }

    /**
     * Get store by ID
     */
    async getStoreById(id) {
        const store = await storeRepository.findById(id);

        if (!store) {
            throw ApiError.notFound('Store not found');
        }

        return store;
    }

    /**
     * Create store
     */
    async createStore(storeData, userId) {
        const store = await storeRepository.createStore(storeData, userId, 'OWNER');

        // Auto-create trial subscription
        const trialPlan = await subscriptionRepository.getPlanByName('Free Trial');

        if (trialPlan) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // 30-day trial

            await subscriptionRepository.createSubscription({
                storeId: store.id,
                planId: trialPlan.id,
                status: 'active',
                startDate,
                endDate,
            });
        }

        logger.info(`Store created: ${store.name} (ID: ${store.id}) by user ${userId}`);

        return store;
    }

    /**
     * Update store
     */
    async updateStore(id, storeData, userId) {
        const store = await storeRepository.findById(id);

        if (!store) {
            throw ApiError.notFound('Store not found');
        }

        // Check user access
        const hasAccess = await storeRepository.checkUserAccess(userId, id);
        if (!hasAccess) {
            throw ApiError.forbidden('You do not have access to this store');
        }

        const updatedStore = await storeRepository.updateStore(id, storeData);
        logger.info(`Store updated: ${updatedStore.name} (ID: ${id})`);

        return updatedStore;
    }

    /**
     * Add license to store
     */
    async addLicense(storeId, licenseData, userId) {
        // Check user access
        const hasAccess = await storeRepository.checkUserAccess(userId, storeId);
        if (!hasAccess) {
            throw ApiError.forbidden('You do not have access to this store');
        }

        const license = await storeRepository.addLicense({
            ...licenseData,
            storeId,
        });

        logger.info(`License added to store ${storeId}: ${license.type}`);

        return license;
    }

    /**
     * Set operating hours
     */
    async setOperatingHours(storeId, hoursData, userId) {
        // Check user access
        const hasAccess = await storeRepository.checkUserAccess(userId, storeId);
        if (!hasAccess) {
            throw ApiError.forbidden('You do not have access to this store');
        }

        const hours = await storeRepository.setOperatingHours(storeId, hoursData);
        logger.info(`Operating hours set for store ${storeId}`);

        return hours;
    }

    /**
     * Add device
     */
    async addDevice(storeId, deviceData, userId) {
        // Check user access
        const hasAccess = await storeRepository.checkUserAccess(userId, storeId);
        if (!hasAccess) {
            throw ApiError.forbidden('You do not have access to this store');
        }

        const device = await storeRepository.addDevice({
            ...deviceData,
            storeId,
        });

        logger.info(`Device added to store ${storeId}: ${device.name}`);

        return device;
    }

    /**
     * Get store statistics
     */
    async getStoreStats(storeId) {
        return await storeRepository.getStoreStats(storeId);
    }
}

module.exports = new StoreService();

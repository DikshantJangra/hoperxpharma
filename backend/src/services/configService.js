const prisma = require('../db/prisma');
const logger = require('../config/logger');
const cacheService = require('./cacheService');

/**
 * Centralized Configuration Service
 * Manages store-specific settings and provides fallback defaults
 */
class ConfigService {
    constructor() {
        this.CACHE_TTL = 300; // 5 minutes in seconds
    }

    /**
     * Get store settings with caching
     * @param {string} storeId - Store ID
     * @returns {Promise<Object>} Store settings
     */
    async getStoreSettings(storeId) {
        const cacheKey = cacheService.keys.storeSettings(storeId);

        // Try to get from cache first
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            logger.debug('Cache hit for store settings', { storeId });
            return cached;
        }

        try {
            let settings = await prisma.storeSettings.findUnique({
                where: { storeId }
            });

            // CRITICAL FIX: Auto-create settings if missing
            if (!settings) {
                logger.warn(`StoreSettings not found for store ${storeId}, creating default settings`);

                try {
                    settings = await prisma.storeSettings.create({
                        data: {
                            storeId,
                            ...this.getDefaultSettings()
                        }
                    });
                    logger.info(`Created default storeSettings for store ${storeId}`);
                } catch (createError) {
                    logger.error('Failed to create store settings', { storeId, error: createError.message });
                    // Fall back to default settings if creation fails
                    settings = this.getDefaultSettings();
                }
            }

            // Cache the result
            await cacheService.set(cacheKey, settings, this.CACHE_TTL);

            return settings;
        } catch (error) {
            logger.error('Failed to fetch store settings', { storeId, error: error.message });
            return this.getDefaultSettings();
        }
    }

    /**
     * Get default settings when store settings not configured
     * @returns {Object} Default settings
     */
    getDefaultSettings() {
        return {
            defaultGSTSlab: '5',
            defaultUoM: 'Units',
            batchTracking: true,
            autoGenerateCodes: true,
            purchaseRounding: true,
            allowNegativeStock: false,
            invoiceFormat: 'INV/{YYYY}/{NNNN}',
            workbenchMode: 'SIMPLE'
        };
    }

    /**
     * Get default GST rate for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<number>} Default GST rate as number
     */
    async getDefaultGSTRate(storeId) {
        const settings = await this.getStoreSettings(storeId);
        return parseFloat(settings.defaultGSTSlab || '5');
    }

    /**
     * Get invoice format pattern for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<string>} Invoice format pattern
     */
    async getInvoiceFormat(storeId) {
        const settings = await this.getStoreSettings(storeId);
        return settings.invoiceFormat || 'INV/{YYYY}/{NNNN}';
    }

    /**
     * Get business type for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<string>} Business type (RETAIL, WHOLESALE, HOSPITAL, CHAIN)
     */
    async getBusinessType(storeId) {
        const settings = await this.getStoreSettings(storeId);
        return settings.businessType || 'RETAIL';
    }

    /**
     * Get auto-rounding setting for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<boolean>} Whether auto-rounding is enabled
     */
    async getAutoRounding(storeId) {
        const settings = await this.getStoreSettings(storeId);
        return settings.autoRounding !== false; // Default to true if undefined
    }

    /**
     * Get GST billing setting for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<boolean>} Whether GST billing is enabled
     */
    async getEnableGSTBilling(storeId) {
        const settings = await this.getStoreSettings(storeId);
        return settings.enableGSTBilling !== false; // Default to true if undefined
    }

    /**
     * Get workflow mode for prescriptions
     * @param {string} storeId - Store ID
     * @returns {Promise<string>} Workflow mode (SIMPLE, ADVANCED)
     */
    async getWorkflowMode(storeId) {
        const settings = await this.getStoreSettings(storeId);
        return settings.workbenchMode || 'SIMPLE';
    }

    /**
     * Invalidate cache for a store
     * @param {string} storeId - Store ID
     */
    async invalidateCache(storeId) {
        await cacheService.invalidate.storeData(storeId);
        logger.debug('Cache invalidated for store', { storeId });
    }

    /**
     * Clear all cache
     */
    async clearCache() {
        await cacheService.flush();
        logger.debug('All settings cache cleared');
    }
}

module.exports = new ConfigService();

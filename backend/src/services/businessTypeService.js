const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BusinessTypeService {
    /**
     * Get all business type configurations
     * @returns {Promise<Array>} List of all business type configs
     */
    async getAllConfigs() {
        return await prisma.businessTypeConfig.findMany({
            orderBy: { businessType: 'asc' }
        });
    }

    /**
     * Get configuration for a specific business type
     * @param {string} businessType - Business type name
     * @returns {Promise<Object|null>} Business type configuration
     */
    async getConfig(businessType) {
        return await prisma.businessTypeConfig.findUnique({
            where: { businessType }
        });
    }

    /**
     * Get sidebar configuration for a business type
     * Filters sidebar sections and items based on feature availability
     * @param {string} businessType - Business type name
     * @param {Object} storeOverrides - Optional store-specific feature overrides
     * @returns {Promise<Object>} Sidebar configuration
     */
    async getSidebarConfig(businessType, storeOverrides = null) {
        const config = await this.getConfig(businessType);

        if (!config) {
            throw new Error(`Business type configuration not found: ${businessType}`);
        }

        // Merge business type config with store overrides
        const effectiveConfig = {
            ...config.featureConfig,
            ...(storeOverrides || {})
        };

        return {
            businessType,
            enabledSections: config.enabledSections,
            featureConfig: effectiveConfig
        };
    }

    /**
     * Get enabled features for a business type
     * @param {string} businessType - Business type name
     * @param {Object} storeOverrides - Optional store-specific feature overrides
     * @returns {Promise<Object>} Feature configuration
     */
    async getEnabledFeatures(businessType, storeOverrides = null) {
        const config = await this.getConfig(businessType);

        if (!config) {
            throw new Error(`Business type configuration not found: ${businessType}`);
        }

        // Merge business type config with store overrides
        const effectiveConfig = {
            ...config.featureConfig,
            ...(storeOverrides || {})
        };

        return effectiveConfig;
    }

    /**
     * Check if a feature is enabled for a business type
     * @param {string} businessType - Business type name
     * @param {string} featureCode - Feature code (e.g., 'prescriptions', 'pos')
     * @param {Object} storeOverrides - Optional store-specific feature overrides
     * @returns {Promise<boolean>} True if feature is enabled (essential or optional)
     */
    async isFeatureEnabled(businessType, featureCode, storeOverrides = null) {
        const features = await this.getEnabledFeatures(businessType, storeOverrides);
        const availability = features[featureCode];

        // Feature is enabled if it's 'essential' or 'optional', hidden if 'hidden' or undefined
        return availability === 'essential' || availability === 'optional';
    }

    /**
     * Check if a feature is essential for a business type
     * @param {string} businessType - Business type name
     * @param {string} featureCode - Feature code
     * @param {Object} storeOverrides - Optional store-specific feature overrides
     * @returns {Promise<boolean>} True if feature is essential
     */
    async isFeatureEssential(businessType, featureCode, storeOverrides = null) {
        const features = await this.getEnabledFeatures(businessType, storeOverrides);
        return features[featureCode] === 'essential';
    }

    /**
     * Get default permissions for a business type
     * @param {string} businessType - Business type name
     * @returns {Promise<Array<string>>} Array of permission codes
     */
    async getDefaultPermissions(businessType) {
        const config = await this.getConfig(businessType);

        if (!config) {
            throw new Error(`Business type configuration not found: ${businessType}`);
        }

        return config.defaultPermissions;
    }

    /**
     * Get feature configuration for a store
     * Includes business type defaults + store-specific overrides
     * @param {string} storeId - Store ID
     * @returns {Promise<Object>} Complete feature configuration
     */
    async getStoreFeatureConfig(storeId) {
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: {
                businessType: true,
                featureOverrides: true
            }
        });

        if (!store) {
            throw new Error(`Store not found: ${storeId}`);
        }

        if (!store.businessType) {
            throw new Error(`Store ${storeId} has no business type configured`);
        }

        const config = await this.getConfig(store.businessType);

        if (!config) {
            throw new Error(`Business type configuration not found: ${store.businessType}`);
        }

        // Merge business type config with store overrides
        const effectiveConfig = {
            ...config.featureConfig,
            ...(store.featureOverrides || {})
        };

        return {
            businessType: store.businessType,
            enabledSections: config.enabledSections,
            featureConfig: effectiveConfig,
            defaultPermissions: config.defaultPermissions
        };
    }

    /**
     * Update store feature overrides
     * @param {string} storeId - Store ID
     * @param {Object} overrides - Feature overrides object
     * @param {string} userId - User ID making the change (for audit)
     * @returns {Promise<Object>} Updated store
     */
    async updateStoreFeatureOverrides(storeId, overrides, userId) {
        // Validate that the store exists
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });

        if (!store) {
            throw new Error(`Store not found: ${storeId}`);
        }

        // Update the store with new overrides
        const updatedStore = await prisma.store.update({
            where: { id: storeId },
            data: {
                featureOverrides: overrides
            }
        });

        // Log the change in audit log
        await prisma.auditLog.create({
            data: {
                userId,
                storeId,
                action: 'FEATURE_OVERRIDES_UPDATED',
                entityType: 'store',
                entityId: storeId,
                changes: {
                    before: store.featureOverrides,
                    after: overrides
                }
            }
        });

        return updatedStore;
    }

    /**
     * Get business type summary (for dropdowns/selection)
     * @returns {Promise<Array>} Simplified list of business types
     */
    async getBusinessTypeSummary() {
        const configs = await prisma.businessTypeConfig.findMany({
            select: {
                businessType: true,
                description: true,
                icon: true
            },
            orderBy: { businessType: 'asc' }
        });

        return configs;
    }
}

module.exports = new BusinessTypeService();

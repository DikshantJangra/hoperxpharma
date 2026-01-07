const prisma = require('../db/prisma');
const logger = require('../config/logger');
const cacheService = require('./cacheService');

/**
 * Feature Toggle Service
 * Manages feature visibility based on business type and store-specific overrides
 */
class FeatureToggleService {
    /**
     * Get feature configuration for a business type
     */
    async getFeaturesForBusinessType(businessType) {
        try {
            const cacheKey = cacheService.keys.businessTypeFeatures(businessType);

            // Try cache first
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }

            const config = await prisma.businessTypeConfig.findUnique({
                where: { businessType },
                select: {
                    featureConfig: true,
                    enabledSections: true,
                    defaultPermissions: true,
                },
            });

            const result = config || this.getDefaultFeatures();

            // Cache for 10 minutes
            await cacheService.set(cacheKey, result, 600);

            return result;
        } catch (error) {
            logger.error('Error fetching business type features:', error);
            return this.getDefaultFeatures();
        }
    }

    /**
     * Get feature configuration for a specific store (with overrides)
     */
    async getFeaturesForStore(storeId) {
        try {
            const cacheKey = cacheService.keys.storeFeatures(storeId);

            // Try cache first
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }

            const store = await prisma.store.findUnique({
                where: { id: storeId },
                select: {
                    businessType: true,
                    featureOverrides: true,
                },
            });

            if (!store) {
                throw new Error(`Store not found: ${storeId}`);
            }

            // Get base features from business type
            const businessType = store.businessType || 'Retail Pharmacy';
            const baseFeatures = await this.getFeaturesForBusinessType(businessType);

            // Apply store-specific overrides
            let result;
            if (store.featureOverrides && typeof store.featureOverrides === 'object') {
                const mergedFeatures = {
                    ...baseFeatures.featureConfig,
                    ...store.featureOverrides,
                };

                result = {
                    ...baseFeatures,
                    featureConfig: mergedFeatures,
                };
            } else {
                result = baseFeatures;
            }

            // Cache for 5 minutes
            await cacheService.set(cacheKey, result, 300);

            return result;
        } catch (error) {
            logger.error('Error fetching store features:', error);
            return this.getDefaultFeatures();
        }
    }

    /**
     * Check if a specific feature is enabled
     */
    isFeatureEnabled(features, featureName) {
        if (!features || !features.featureConfig) {
            return true; // Default to enabled if no config
        }

        const level = features.featureConfig[featureName];
        return level === 'essential' || level === 'optional';
    }

    /**
     * Get visibility level for a feature
     */
    getVisibilityLevel(features, featureName) {
        if (!features || !features.featureConfig) {
            return 'optional';
        }

        return features.featureConfig[featureName] || 'optional';
    }

    /**
     * Filter navigation items based on features
     */
    filterNavigation(navigationItems, features) {
        return navigationItems.filter(item => {
            if (!item.feature) return true; // No feature requirement
            return this.isFeatureEnabled(features, item.feature);
        });
    }

    /**
     * Update store feature overrides
     */
    async updateStoreFeatures(storeId, featureOverrides) {
        try {
            const updatedStore = await prisma.store.update({
                where: { id: storeId },
                data: {
                    featureOverrides,
                },
                select: {
                    id: true,
                    businessType: true,
                    featureOverrides: true,
                },
            });

            // Invalidate cache
            await cacheService.invalidate.storeData(storeId);

            logger.info(`Updated feature overrides for store: ${storeId}`);
            return updatedStore;
        } catch (error) {
            logger.error('Error updating store features:', error);
            throw error;
        }
    }

    /**
     * Default features (fallback)
     */
    getDefaultFeatures() {
        return {
            featureConfig: {
                pos: 'essential',
                inventory: 'essential',
                customers: 'essential',
                prescriptions: 'essential',
                engage: 'optional',
                reports: 'essential',
                dispensing: 'hidden',
                ipd: 'hidden',
                opd: 'hidden',
                'whatsapp-campaigns': 'hidden',
                'email-marketing': 'hidden',
            },
            enabledSections: [
                'Operations',
                'Inventory & Supply',
                'Customers',
                'Engage',
                'Reports & Analytics',
                'Settings',
            ],
            defaultPermissions: [
                'sale.create',
                'sale.view',
                'inventory.view',
                'patient.create',
                'prescription.view',
                'reports.view',
            ],
        };
    }

    /**
     * Seed default business type configurations
     */
    async seedBusinessTypeConfigs() {
        try {
            const configs = [
                {
                    businessType: 'Retail Pharmacy',
                    featureConfig: {
                        pos: 'essential',
                        inventory: 'essential',
                        customers: 'essential',
                        prescriptions: 'essential',
                        engage: 'optional',
                        reports: 'essential',
                        dispensing: 'hidden',
                        ipd: 'hidden',
                        opd: 'hidden',
                        'whatsapp-campaigns': 'hidden',
                        'email-marketing': 'hidden',
                        'analytics-advanced': 'optional',
                    },
                    enabledSections: [
                        'Operations',
                        'Inventory & Supply',
                        'Customers',
                        'Engage',
                        'Reports & Analytics',
                        'Settings',
                    ],
                    defaultPermissions: [
                        'sale.create',
                        'sale.view',
                        'inventory.view',
                        'inventory.create',
                        'patient.create',
                        'patient.view',
                        'prescription.create',
                        'prescription.view',
                        'reports.view',
                    ],
                    description: 'Focused retail pharmacy with POS, inventory, and basic prescription management',
                    icon: 'Store',
                },
                {
                    businessType: 'Wholesale Pharmacy',
                    featureConfig: {
                        pos: 'hidden',
                        inventory: 'essential',
                        customers: 'essential',
                        prescriptions: 'hidden',
                        engage: 'hidden',
                        reports: 'essential',
                        dispensing: 'hidden',
                        ipd: 'hidden',
                        opd: 'hidden',
                        'bulk-orders': 'essential',
                        'supplier-management': 'essential',
                    },
                    enabledSections: [
                        'Operations',
                        'Inventory & Supply',
                        'Customers',
                        'Reports & Analytics',
                        'Settings',
                    ],
                    defaultPermissions: [
                        'purchase.create',
                        'purchase.view',
                        'inventory.view',
                        'inventory.create',
                        'supplier.create',
                        'supplier.view',
                        'reports.view',
                    ],
                    description: 'Wholesale distribution with bulk order management',
                    icon: 'Warehouse',
                },
                {
                    businessType: 'Hospital-based Pharmacy',
                    featureConfig: {
                        pos: 'optional',
                        inventory: 'essential',
                        customers: 'essential',
                        prescriptions: 'essential',
                        engage: 'hidden',
                        reports: 'essential',
                        dispensing: 'essential',
                        ipd: 'essential',
                        opd: 'essential',
                        'pharmacy-workflow': 'essential',
                    },
                    enabledSections: [
                        'Operations',
                        'Dispensing Workflow',
                        'IPD/OPD',
                        'Inventory & Supply',
                        'Patients',
                        'Reports & Analytics',
                        'Settings',
                    ],
                    defaultPermissions: [
                        'dispense.create',
                        'dispense.verify',
                        'dispense.fill',
                        'dispense.check',
                        'prescription.create',
                        'prescription.view',
                        'inventory.view',
                        'patient.view',
                        'reports.view',
                    ],
                    description: 'Full hospital pharmacy with multi-step dispensing workflow',
                    icon: 'Hospital',
                },
            ];

            for (const config of configs) {
                await prisma.businessTypeConfig.upsert({
                    where: { businessType: config.businessType },
                    update: config,
                    create: config,
                });
            }

            logger.info('Business type configurations seeded successfully');
            return { success: true, count: configs.length };
        } catch (error) {
            logger.error('Error seeding business type configs:', error);
            throw error;
        }
    }
}

module.exports = new FeatureToggleService();

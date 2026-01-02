const database = require('../config/database');
const logger = require('../config/logger');

const prisma = database.getClient();

/**
 * Store Repository - Data access layer for store operations
 */
class StoreRepository {
    /**
     * Find stores for a user
     */
    async findUserStores(userId) {
        logger.info('findUserStores called for user:', userId);
        const stores = await prisma.store.findMany({
            where: {
                users: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                licenses: true,
                operatingHours: true,
                devices: true,
                subscription: true,
                settings: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        logger.info('findUserStores found:', stores.length, 'stores');
        if (stores.length > 0) {
            logger.info('Primary store settings:', JSON.stringify(stores[0].settings, null, 2));
            logger.info('Primary store bankDetails:', JSON.stringify(stores[0].bankDetails, null, 2));
            logger.info('Primary store logoUrl:', stores[0].logoUrl);
            logger.info('Primary store signatureUrl:', stores[0].signatureUrl);
        }
        return stores;
    }

    /**
     * Find store by ID
     */
    async findById(id) {
        return await prisma.store.findUnique({
            where: { id },
            include: {
                licenses: true,
                operatingHours: true,
                devices: true,
                subscription: true,
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                            },
                        },
                    },
                },
                settings: true,
            },
        });
    }

    /**
     * Create store with user association
     */
    async createStore(storeData, userId, role = 'OWNER') {
        return await prisma.$transaction(async (tx) => {
            const store = await tx.store.create({
                data: storeData,
            });

            // Associate user with store
            await tx.storeUser.create({
                data: {
                    storeId: store.id,
                    userId,
                    role,
                    isPrimary: true, // Creator is primary user by default
                },
            });

            return store;
        });
    }

    /**
     * Update store
     */
    async updateStore(id, storeData) {
        logger.info('UpdateStore Repository Input:', JSON.stringify(storeData, null, 2));
        const { settings, ...rest } = storeData;

        // Handle settings separately
        if (settings) {
            logger.info('Upserting settings directly:', settings);
            try {
                const upserted = await prisma.storeSettings.upsert({
                    where: { storeId: id },
                    create: {
                        ...settings,
                        storeId: id
                    },
                    update: settings
                });
                logger.info('Upsert Success:', upserted);
            } catch (upsertError) {
                logger.error('Upsert Failed Detailed Error:', upsertError);
                throw upsertError;
            }
        } else {
            logger.info('WARNING: No settings object found in update payload. Keys:', Object.keys(storeData));
        }

        // Update store fields (including bankDetails JSON field)
        logger.info('Updating store with data:', JSON.stringify(rest, null, 2));
        await prisma.store.update({
            where: { id },
            data: rest
        });

        // Explicitly fetch the complete store with settings to ensure fresh data
        const result = await this.findById(id);

        logger.info('UpdateStore Result (Refetched):', JSON.stringify(result, null, 2));
        return result;
    }

    /**
     * Add license to store
     */
    async addLicense(licenseData) {
        return await prisma.storeLicense.create({
            data: licenseData,
        });
    }

    /**
     * Update license
     */
    async updateLicense(id, licenseData) {
        return await prisma.storeLicense.update({
            where: { id },
            data: licenseData,
        });
    }

    /**
     * Get store licenses
     */
    async getLicenses(storeId) {
        return await prisma.storeLicense.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Set operating hours (batch)
     */
    async setOperatingHours(storeId, hoursData) {
        return await prisma.$transaction(async (tx) => {
            // Delete existing hours
            await tx.storeOperatingHours.deleteMany({
                where: { storeId },
            });

            // Create new hours
            const hours = await Promise.all(
                hoursData.map((hour) =>
                    tx.storeOperatingHours.create({
                        data: {
                            ...hour,
                            storeId,
                        },
                    })
                )
            );

            return hours;
        });
    }

    /**
     * Add device
     */
    async addDevice(deviceData) {
        return await prisma.storeDevice.create({
            data: deviceData,
        });
    }

    /**
     * Get store statistics
     */
    async getStoreStats(storeId) {
        const [patients, sales, inventory, pos] = await Promise.all([
            prisma.patient.count({ where: { storeId } }),
            prisma.sale.count({ where: { storeId } }),
            prisma.inventoryBatch.count({ where: { storeId } }),
            prisma.purchaseOrder.count({ where: { storeId } }),
        ]);

        return {
            totalPatients: patients,
            totalSales: sales,
            totalInventoryBatches: inventory,
            totalPurchaseOrders: pos,
        };
    }

    /**
     * Check if user has access to store
     */
    async checkUserAccess(userId, storeId) {
        const storeUser = await prisma.storeUser.findFirst({
            where: {
                userId,
                storeId,
            },
        });

        return !!storeUser;
    }
}

module.exports = new StoreRepository();

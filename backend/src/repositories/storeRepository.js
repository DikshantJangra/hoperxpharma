const database = require('../config/database');

const prisma = database.getClient();

/**
 * Store Repository - Data access layer for store operations
 */
class StoreRepository {
    /**
     * Find stores for a user
     */
    async findUserStores(userId) {
        return await prisma.store.findMany({
            where: {
                users: {
                    some: {
                        userId,
                        deletedAt: null,
                    },
                },
                deletedAt: null,
            },
            include: {
                licenses: true,
                operatingHours: true,
                devices: true,
                subscription: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Find store by ID
     */
    async findById(id) {
        return await prisma.store.findUnique({
            where: { id, deletedAt: null },
            include: {
                licenses: true,
                operatingHours: true,
                devices: true,
                subscription: true,
                users: {
                    where: { deletedAt: null },
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
                },
            });

            return store;
        });
    }

    /**
     * Update store
     */
    async updateStore(id, storeData) {
        return await prisma.store.update({
            where: { id },
            data: storeData,
        });
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
            prisma.patient.count({ where: { storeId, deletedAt: null } }),
            prisma.sale.count({ where: { storeId, deletedAt: null } }),
            prisma.inventoryBatch.count({ where: { storeId, deletedAt: null } }),
            prisma.purchaseOrder.count({ where: { storeId, deletedAt: null } }),
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
                deletedAt: null,
            },
        });

        return !!storeUser;
    }
}

module.exports = new StoreRepository();

const database = require('../config/database');

const prisma = database.getClient();

/**
 * Inventory Repository - Data access layer for inventory operations
 */
class InventoryRepository {
    /**
     * Find all drugs with pagination and search
     */
    async findDrugs({ page = 1, limit = 20, search = '', storeId }) {
        const skip = (page - 1) * limit;

        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { manufacturer: { contains: search, mode: 'insensitive' } },
                    { hsnCode: { contains: search } },
                ],
            }),
        };

        const [drugs, total] = await Promise.all([
            prisma.drug.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.drug.count({ where }),
        ]);

        return { drugs, total };
    }

    /**
     * Find drug by ID
     */
    async findDrugById(id) {
        return await prisma.drug.findUnique({
            where: { id },
            include: {
                inventory: {
                    where: { deletedAt: null },
                    orderBy: { expiryDate: 'asc' },
                },
            },
        });
    }

    /**
     * Create drug
     */
    async createDrug(drugData) {
        return await prisma.drug.create({
            data: drugData,
        });
    }

    /**
     * Update drug
     */
    async updateDrug(id, drugData) {
        return await prisma.drug.update({
            where: { id },
            data: drugData,
        });
    }

    /**
     * Find inventory batches for a store
     */
    async findBatches({ storeId, page = 1, limit = 20, drugId, expiringBefore }) {
        const skip = (page - 1) * limit;

        const where = {
            storeId,
            deletedAt: null,
            ...(drugId && { drugId }),
            ...(expiringBefore && { expiryDate: { lte: expiringBefore } }),
        };

        const [batches, total] = await Promise.all([
            prisma.inventoryBatch.findMany({
                where,
                skip,
                take: limit,
                include: {
                    drug: true,
                },
                orderBy: { expiryDate: 'asc' },
            }),
            prisma.inventoryBatch.count({ where }),
        ]);

        return { batches, total };
    }

    /**
     * Find batch by ID
     */
    async findBatchById(id) {
        return await prisma.inventoryBatch.findUnique({
            where: { id, deletedAt: null },
            include: {
                drug: true,
                movements: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
    }

    /**
     * Create inventory batch
     */
    async createBatch(batchData) {
        return await prisma.inventoryBatch.create({
            data: batchData,
            include: {
                drug: true,
            },
        });
    }

    /**
     * Update batch quantity
     */
    async updateBatchQuantity(id, quantity) {
        return await prisma.inventoryBatch.update({
            where: { id },
            data: { quantityInStock: quantity },
        });
    }

    /**
     * Create stock movement
     */
    async createStockMovement(movementData) {
        return await prisma.stockMovement.create({
            data: movementData,
        });
    }

    /**
     * Get low stock items
     */
    async getLowStockItems(storeId) {
        return await prisma.$queryRaw`
      SELECT 
        d.id as "drugId",
        d.name,
        d."lowStockThreshold",
        SUM(ib."quantityInStock") as "totalStock"
      FROM "Drug" d
      INNER JOIN "InventoryBatch" ib ON ib."drugId" = d.id
      WHERE ib."storeId" = ${storeId}
        AND ib."deletedAt" IS NULL
      GROUP BY d.id, d.name, d."lowStockThreshold"
      HAVING SUM(ib."quantityInStock") <= COALESCE(d."lowStockThreshold", 10)
      ORDER BY "totalStock" ASC
    `;
    }

    /**
     * Get expiring items
     */
    async getExpiringItems(storeId, daysAhead = 90) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + daysAhead);

        return await prisma.inventoryBatch.findMany({
            where: {
                storeId,
                deletedAt: null,
                expiryDate: {
                    lte: expiryDate,
                    gte: new Date(),
                },
                quantityInStock: { gt: 0 },
            },
            include: {
                drug: true,
            },
            orderBy: { expiryDate: 'asc' },
        });
    }

    /**
     * Get inventory value
     */
    async getInventoryValue(storeId) {
        const result = await prisma.$queryRaw`
      SELECT 
        SUM(ib."quantityInStock" * ib."purchasePrice") as "totalValue",
        COUNT(DISTINCT ib."drugId") as "uniqueDrugs",
        SUM(ib."quantityInStock") as "totalUnits"
      FROM "InventoryBatch" ib
      WHERE ib."storeId" = ${storeId}
        AND ib."deletedAt" IS NULL
    `;

        return result[0];
    }

    /**
     * Find batches by drug for FIFO/FEFO
     */
    async findBatchesForDispense(storeId, drugId, quantity) {
        return await prisma.inventoryBatch.findMany({
            where: {
                storeId,
                drugId,
                deletedAt: null,
                quantityInStock: { gt: 0 },
            },
            orderBy: [
                { expiryDate: 'asc' }, // FEFO - First Expiry First Out
                { createdAt: 'asc' },  // FIFO - First In First Out
            ],
        });
    }

    /**
     * Search drugs with stock availability for POS
     */
    async searchDrugsWithStock(storeId, searchTerm) {
        // Search drugs that have inventory in this store
        return await prisma.drug.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { name: { contains: searchTerm, mode: 'insensitive' } },
                            { manufacturer: { contains: searchTerm, mode: 'insensitive' } },
                        ],
                    },
                    {
                        inventory: {
                            some: {
                                storeId,
                                deletedAt: null,
                                quantityInStock: { gt: 0 },
                            },
                        },
                    },
                ],
            },
            take: 20, // Limit results for performance
            orderBy: { name: 'asc' },
        });
    }
}

module.exports = new InventoryRepository();

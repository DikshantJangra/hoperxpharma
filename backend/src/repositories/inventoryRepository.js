const database = require('../config/database');
const logger = require('../config/logger');
const { buildOrderBy } = require('../utils/queryParser');

const prisma = database.getClient();

/**
 * Inventory Repository - Data access layer for inventory operations
 */
class InventoryRepository {
    async findDrugs({
        page = 1,
        limit = 20,
        search = '',
        storeId,
        sortConfig,
        stockStatus = [],
        expiryWindow = [],
        storage = []
    }) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const where = {
            storeId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { manufacturer: { contains: search, mode: 'insensitive' } },
                    { hsnCode: { contains: search } },
                    {
                        inventory: {
                            some: {
                                batchNumber: { contains: search, mode: 'insensitive' },
                                storeId,
                                deletedAt: null
                            }
                        }
                    }
                ],
            }),
        };

        // Add storage filters based on schedule field
        if (storage && storage.length > 0) {
            const scheduleConditions = [];
            if (storage.includes('schedule_h')) {
                scheduleConditions.push({ schedule: 'H' });
            }
            if (storage.includes('controlled')) {
                scheduleConditions.push({ schedule: { in: ['H1', 'X'] } });
            }
            // Note: cold_chain and ambient filters are not supported as the Drug model
            // doesn't have a requiresColdStorage field
            if (scheduleConditions.length > 0) {
                where.OR = where.OR || [];
                where.OR.push(...scheduleConditions);
            }
        }


        // Build dynamic orderBy
        const orderBy = buildOrderBy(sortConfig, { name: 'asc' });

        const [drugs, total] = await Promise.all([
            prisma.drug.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
                include: {
                    inventory: {
                        where: {
                            storeId,
                            deletedAt: null // Exclude soft-deleted batches
                        },
                        select: {
                            id: true,
                            batchNumber: true,
                            quantityInStock: true,
                            mrp: true,
                            purchasePrice: true,
                            expiryDate: true,
                            location: true,
                            supplierId: true
                        },
                        orderBy: { expiryDate: 'asc' }
                    },
                },
            }),
            prisma.drug.count({ where }),
        ]);

        // Post-process for stock status and expiry filters
        let filteredDrugs = drugs;

        // Apply stock status filters
        if (stockStatus && stockStatus.length > 0) {
            filteredDrugs = filteredDrugs.filter(drug => {
                const totalStock = drug.inventory?.reduce((sum, batch) => sum + batch.quantityInStock, 0) || 0;
                const lowStockThreshold = drug.lowStockThreshold || 10;

                return stockStatus.some(status => {
                    if (status === 'in_stock') return totalStock > lowStockThreshold;
                    if (status === 'out_of_stock') return totalStock === 0;
                    if (status === 'low_stock') return totalStock > 0 && totalStock <= lowStockThreshold;
                    if (status === 'overstocked') return totalStock > lowStockThreshold * 3;
                    return false;
                });
            });
        }

        // Apply expiry window filters
        if (expiryWindow && expiryWindow.length > 0) {
            filteredDrugs = filteredDrugs.filter(drug => {
                if (!drug.inventory || drug.inventory.length === 0) return false;

                return drug.inventory.some(batch => {
                    const daysToExpiry = Math.floor(
                        (new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return expiryWindow.some(window => {
                        if (window === '<7days') return daysToExpiry < 7 && daysToExpiry >= 0;
                        if (window === '<30days') return daysToExpiry < 30 && daysToExpiry >= 0;
                        if (window === '30-90days') return daysToExpiry >= 30 && daysToExpiry <= 90;
                        if (window === '>90days') return daysToExpiry > 90;
                        return false;
                    });
                });
            });
        }

        // IMPORTANT: Filter out drugs with no active batches (all batches deleted)
        // This ensures drugs with all batches soft-deleted don't appear
        filteredDrugs = filteredDrugs.filter(drug => {
            return drug.inventory && drug.inventory.length > 0;
        });

        return {
            drugs: filteredDrugs,
            total: filteredDrugs.length
        };
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
                    include: {
                        movements: {
                            orderBy: { createdAt: 'desc' },
                            take: 10, // Last 10 movements per batch
                        },
                    },
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
    async findBatches({ storeId, page = 1, limit = 20, drugId, expiringBefore, search, minQuantity }) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const where = {
            storeId,
            deletedAt: null,
            ...(drugId && { drugId }),
            ...(expiringBefore && { expiryDate: { lte: expiringBefore } }),
            ...(minQuantity && { quantityInStock: { gte: parseInt(minQuantity) } }),
            ...(search && {
                OR: [
                    { batchNumber: { contains: search, mode: 'insensitive' } },
                    { drug: { name: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };

        const [batches, total] = await Promise.all([
            prisma.inventoryBatch.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    drug: true,
                    movements: {
                        orderBy: { createdAt: 'desc' },
                        take: 10, // Last 10 movements
                    },
                },
                orderBy: { expiryDate: 'asc' },
            }),
            prisma.inventoryBatch.count({ where }),
        ]);

        // Fetch suppliers for batches
        const batchesWithSuppliers = await Promise.all(
            batches.map(async (batch) => {
                if (batch.supplierId) {
                    const supplier = await prisma.supplier.findUnique({
                        where: { id: batch.supplierId },
                        select: {
                            id: true,
                            name: true,
                            contactName: true,
                            phoneNumber: true,
                        },
                    });
                    return { ...batch, supplier };
                }
                return { ...batch, supplier: null };
            })
        );

        return { batches: batchesWithSuppliers, total };
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
        if (quantity < 0) {
            throw new Error('Batch quantity cannot be negative');
        }

        return await prisma.inventoryBatch.update({
            where: { id },
            data: { quantityInStock: quantity },
        });
    }

    /**
     * Update batch location
     */
    async updateBatchLocation(id, location) {
        return await prisma.inventoryBatch.update({
            where: { id },
            data: { location },
        });
    }

    /**
     * Delete batch (soft delete)
     */
    async deleteBatch(id, userId) {
        return await prisma.inventoryBatch.update({
            where: { id },
            data: {
                deletedAt: new Date()
            },
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
        logger.info('🔍 Repository: fetching low stock items for store:', storeId);
        try {
            const result = await prisma.$queryRaw`
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
            logger.info(`🔍 Repository: Found ${result.length} low stock items`);

            return result.map(item => ({
                ...item,
                totalStock: Number(item.totalStock)
            }));
        } catch (error) {
            logger.error('❌ Repository: Error fetching low stock items:', error);
            throw error;
        }
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

        const data = result[0];
        return {
            totalValue: data.totalValue ? Number(data.totalValue) : 0,
            uniqueDrugs: data.uniqueDrugs ? Number(data.uniqueDrugs) : 0,
            totalUnits: data.totalUnits ? Number(data.totalUnits) : 0
        };
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
        logger.info('🔍 POS Search - StoreId:', storeId, 'SearchTerm:', searchTerm);

        // Search drugs that belong to this store and have inventory
        const drugs = await prisma.drug.findMany({
            where: {
                storeId,
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
            take: 20,
            orderBy: { name: 'asc' },
        });

        logger.info('🔍 POS Search - Found drugs:', drugs.length);
        if (drugs.length > 0) {
            logger.info('🔍 First result:', drugs[0].name);
        }
        return drugs;
    }

    /**
     * Get batches with supplier information for a drug
     */
    async getBatchesWithSuppliers(drugId) {
        const batches = await prisma.inventoryBatch.findMany({
            where: {
                drugId,
                deletedAt: null,
            },
            include: {
                movements: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { expiryDate: 'asc' },
        });

        // Fetch suppliers for batches that have supplierId
        const batchesWithSuppliers = await Promise.all(
            batches.map(async (batch) => {
                if (batch.supplierId) {
                    const supplier = await prisma.supplier.findUnique({
                        where: { id: batch.supplierId },
                        select: {
                            id: true,
                            name: true,
                            contactName: true,
                            phoneNumber: true,
                        },
                    });
                    return { ...batch, supplier };
                }
                return { ...batch, supplier: null };
            })
        );

        return batchesWithSuppliers;
    }
}

module.exports = new InventoryRepository();

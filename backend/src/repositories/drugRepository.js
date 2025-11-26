const database = require('../config/database');

const prisma = database.getClient();

/**
 * Drug Repository - Data access layer for drug operations
 */
class DrugRepository {
    /**
     * Search drugs with fuzzy matching
     * Uses Prisma's contains for partial matching (MVP approach)
     */
    async searchDrugs(query, limit = 20) {
        const searchQuery = query.toLowerCase();

        // Use raw SQL for better ranking control
        // Priority: 1 = exact match, 2 = starts with, 3 = contains
        const results = await prisma.$queryRaw`
            SELECT 
                id,
                name,
                strength,
                form,
                manufacturer,
                "hsnCode",
                "gstRate",
                "requiresPrescription",
                "defaultUnit",
                "lowStockThreshold",
                CASE 
                    WHEN LOWER(name) = ${searchQuery} THEN 1
                    WHEN LOWER(name) LIKE ${searchQuery + '%'} THEN 2
                    ELSE 3
                END as priority
            FROM "Drug"
            WHERE 
                LOWER(name) LIKE ${`%${searchQuery}%`}
                OR LOWER(manufacturer) LIKE ${`%${searchQuery}%`}
                OR LOWER(form) LIKE ${`%${searchQuery}%`}
            ORDER BY priority ASC, name ASC
            LIMIT ${limit}
        `;

        // Remove the priority field from results
        return results.map(({ priority, ...drug }) => drug);
    }

    /**
     * Find drug by ID
     */
    async findDrugById(id) {
        return await prisma.drug.findUnique({
            where: { id },
            include: {
                inventory: {
                    select: {
                        id: true,
                        storeId: true,
                        batchNumber: true,
                        quantityInStock: true,
                        mrp: true,
                        purchasePrice: true,
                        expiryDate: true
                    }
                }
            }
        });
    }

    /**
     * Find drug by name and strength (for deduplication during import)
     */
    async findDrugByNameAndStrength(name, strength) {
        return await prisma.drug.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                },
                strength: strength || null
            }
        });
    }

    /**
     * Get inventory for a specific drug at a store
     */
    async getInventoryForDrug(drugId, storeId) {
        const batches = await prisma.inventoryBatch.findMany({
            where: {
                drugId,
                storeId,
                deletedAt: null
            },
            select: {
                id: true,
                batchNumber: true,
                quantityInStock: true,
                mrp: true,
                purchasePrice: true,
                expiryDate: true,
                location: true
            },
            orderBy: {
                expiryDate: 'asc' // FEFO - First Expiry First Out
            }
        });

        const totalStock = batches.reduce((sum, batch) => sum + batch.quantityInStock, 0);

        return {
            totalStock,
            batches
        };
    }

    /**
     * Create new drug
     */
    async createDrug(drugData) {
        return await prisma.drug.create({
            data: drugData
        });
    }

    /**
     * Update drug
     */
    async updateDrug(id, drugData) {
        return await prisma.drug.update({
            where: { id },
            data: drugData
        });
    }

    /**
     * Find all drugs with pagination
     */
    async findAllDrugs({ page = 1, limit = 20, search = '' }) {
        const skip = (page - 1) * limit;

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { manufacturer: { contains: search, mode: 'insensitive' } }
                ]
            }
            : {};

        const [drugs, total] = await Promise.all([
            prisma.drug.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.drug.count({ where })
        ]);

        return { drugs, total };
    }

    /**
     * Get drugs below stock threshold (for inventory suggestions)
     * Optimized to handle large drug databases
     */
    async getDrugsNeedingReorder(storeId) {
        // Use raw SQL for better performance with large datasets
        const suggestions = await prisma.$queryRaw`
            SELECT 
                d.id as "drugId",
                d.name,
                d.strength,
                d.form,
                d.manufacturer,
                d."lowStockThreshold" as threshold,
                d."gstRate" as "gstPercent",
                d."defaultUnit" as "defaultUnit",
                COALESCE(SUM(ib."quantityInStock"), 0)::int as "currentStock",
                (
                    SELECT poi."unitPrice"
                    FROM "PurchaseOrderItem" poi
                    INNER JOIN "PurchaseOrder" po ON poi."poId" = po.id
                    WHERE poi."drugId" = d.id 
                        AND po."storeId" = ${storeId}
                        AND po."deletedAt" IS NULL
                    ORDER BY po."createdAt" DESC
                    LIMIT 1
                ) as "lastPurchasePrice"
            FROM "Drug" d
            LEFT JOIN "InventoryBatch" ib ON ib."drugId" = d.id 
                AND ib."storeId" = ${storeId}
                AND ib."deletedAt" IS NULL
            WHERE d."lowStockThreshold" IS NOT NULL
            GROUP BY d.id, d.name, d.strength, d.form, d.manufacturer, d."lowStockThreshold", d."gstRate", d."defaultUnit"
            HAVING COALESCE(SUM(ib."quantityInStock"), 0) < d."lowStockThreshold"
            ORDER BY 
                CASE WHEN COALESCE(SUM(ib."quantityInStock"), 0) = 0 THEN 0 ELSE 1 END,
                COALESCE(SUM(ib."quantityInStock"), 0)::float / NULLIF(d."lowStockThreshold", 0)
            LIMIT 100
        `;

        // Format the results
        return suggestions.map(item => ({
            drugId: item.drugId,
            name: item.name,
            strength: item.strength,
            form: item.form,
            manufacturer: item.manufacturer,
            currentStock: item.currentStock,
            threshold: item.threshold,
            suggestedQty: Math.max(0, item.threshold - item.currentStock),
            lastPurchasePrice: item.lastPurchasePrice,
            gstPercent: item.gstPercent,
            defaultUnit: item.defaultUnit,
            reason: item.currentStock === 0 ? 'Out of stock' : 'Low stock'
        }));
    }

    /**
     * Get current stock for a drug at a specific store
     */
    async getCurrentStock(drugId, storeId) {
        const result = await prisma.inventoryBatch.aggregate({
            where: {
                drugId,
                storeId,
                deletedAt: null
            },
            _sum: {
                quantityInStock: true
            }
        });

        return result._sum.quantityInStock || 0;
    }
}

module.exports = new DrugRepository();

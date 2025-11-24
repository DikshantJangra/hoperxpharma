const inventoryRepository = require('../../repositories/inventoryRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * Inventory Service - Business logic for inventory management
 */
class InventoryService {
    /**
     * Get all drugs with pagination
     */
    async getDrugs(filters) {
        return await inventoryRepository.findDrugs(filters);
    }

    /**
     * Get drug by ID
     */
    async getDrugById(id) {
        const drug = await inventoryRepository.findDrugById(id);

        if (!drug) {
            throw ApiError.notFound('Drug not found');
        }

        return drug;
    }

    /**
     * Create new drug
     */
    async createDrug(drugData) {
        const drug = await inventoryRepository.createDrug(drugData);
        logger.info(`Drug created: ${drug.name} (ID: ${drug.id})`);
        return drug;
    }

    /**
     * Update drug
     */
    async updateDrug(id, drugData) {
        const existingDrug = await inventoryRepository.findDrugById(id);

        if (!existingDrug) {
            throw ApiError.notFound('Drug not found');
        }

        const drug = await inventoryRepository.updateDrug(id, drugData);
        logger.info(`Drug updated: ${drug.name} (ID: ${drug.id})`);
        return drug;
    }

    /**
     * Get inventory batches
     */
    async getBatches(filters) {
        return await inventoryRepository.findBatches(filters);
    }

    /**
     * Get batch by ID
     */
    async getBatchById(id) {
        const batch = await inventoryRepository.findBatchById(id);

        if (!batch) {
            throw ApiError.notFound('Batch not found');
        }

        return batch;
    }

    /**
     * Create inventory batch
     */
    async createBatch(batchData) {
        const batch = await inventoryRepository.createBatch(batchData);

        // Create stock movement record
        await inventoryRepository.createStockMovement({
            batchId: batch.id,
            movementType: 'IN',
            quantity: batch.quantityInStock,
            reason: 'Initial stock',
            referenceType: 'purchase',
        });

        logger.info(`Batch created: ${batch.batchNumber} for drug ${batch.drug.name}`);
        return batch;
    }

    /**
     * Update batch
     */
    async updateBatch(id, updateData) {
        const existingBatch = await inventoryRepository.findBatchById(id);

        if (!existingBatch) {
            throw ApiError.notFound('Batch not found');
        }

        // If quantity is being updated, create stock movement
        if (updateData.quantityInStock !== undefined) {
            const quantityDiff = updateData.quantityInStock - existingBatch.quantityInStock;

            await inventoryRepository.createStockMovement({
                batchId: id,
                movementType: quantityDiff > 0 ? 'IN' : 'OUT',
                quantity: Math.abs(quantityDiff),
                reason: 'Manual adjustment',
                referenceType: 'adjustment',
            });
        }

        const batch = await inventoryRepository.updateBatchQuantity(id, updateData.quantityInStock);
        logger.info(`Batch updated: ${batch.batchNumber}`);
        return batch;
    }

    /**
     * Adjust stock
     */
    async adjustStock(adjustmentData) {
        const { batchId, quantityAdjusted, reason, userId } = adjustmentData;

        const batch = await inventoryRepository.findBatchById(batchId);

        if (!batch) {
            throw ApiError.notFound('Batch not found');
        }

        const newQuantity = batch.quantityInStock + quantityAdjusted;

        if (newQuantity < 0) {
            throw ApiError.badRequest('Adjustment would result in negative stock');
        }

        // Update batch quantity
        await inventoryRepository.updateBatchQuantity(batchId, newQuantity);

        // Create stock movement
        await inventoryRepository.createStockMovement({
            batchId,
            movementType: quantityAdjusted > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(quantityAdjusted),
            reason,
            referenceType: 'adjustment',
            userId,
        });

        logger.info(`Stock adjusted for batch ${batch.batchNumber}: ${quantityAdjusted}`);

        return { success: true, newQuantity };
    }

    /**
     * Get low stock alerts
     */
    async getLowStockAlerts(storeId) {
        return await inventoryRepository.getLowStockItems(storeId);
    }

    /**
     * Get expiring items
     */
    async getExpiringItems(storeId, daysAhead = 90) {
        return await inventoryRepository.getExpiringItems(storeId, daysAhead);
    }

    /**
     * Get inventory summary
     */
    async getInventorySummary(storeId) {
        const [value, lowStock, expiring] = await Promise.all([
            inventoryRepository.getInventoryValue(storeId),
            inventoryRepository.getLowStockItems(storeId),
            inventoryRepository.getExpiringItems(storeId, 30),
        ]);

        return {
            totalValue: value.totalValue || 0,
            uniqueDrugs: value.uniqueDrugs || 0,
            totalUnits: value.totalUnits || 0,
            lowStockCount: lowStock.length,
            expiringCount: expiring.length,
        };
    }

    /**
     * Allocate stock for sale (FIFO/FEFO)
     */
    async allocateStock(storeId, drugId, quantity) {
        const batches = await inventoryRepository.findBatchesForDispense(storeId, drugId, quantity);

        if (batches.length === 0) {
            throw ApiError.notFound('No stock available for this drug');
        }

        const allocations = [];
        let remainingQuantity = quantity;

        for (const batch of batches) {
            if (remainingQuantity <= 0) break;

            const allocatedQuantity = Math.min(batch.quantityInStock, remainingQuantity);

            allocations.push({
                batchId: batch.id,
                batchNumber: batch.batchNumber,
                quantity: allocatedQuantity,
                mrp: batch.mrp,
                expiryDate: batch.expiryDate,
            });

            remainingQuantity -= allocatedQuantity;
        }

        if (remainingQuantity > 0) {
            throw ApiError.badRequest(`Insufficient stock. Available: ${quantity - remainingQuantity}, Required: ${quantity}`);
        }

        return allocations;
    }

    /**
     * Search drugs for POS with stock availability
     */
    async searchDrugsForPOS(storeId, searchTerm) {
        const drugs = await inventoryRepository.searchDrugsWithStock(storeId, searchTerm);

        // Enhance with batch information
        const drugsWithBatches = await Promise.all(
            drugs.map(async (drug) => {
                const batches = await inventoryRepository.findBatchesForDispense(storeId, drug.id, 1000);

                const totalStock = batches.reduce((sum, b) => sum + b.quantityInStock, 0);
                const batchCount = batches.length;

                // Get the batch with nearest expiry (FEFO)
                const primaryBatch = batches[0];

                return {
                    id: drug.id,
                    name: drug.name,
                    strength: drug.strength,
                    form: drug.form,
                    manufacturer: drug.manufacturer,
                    totalStock,
                    batchCount,
                    mrp: primaryBatch?.mrp || 0,
                    batchId: primaryBatch?.id,
                    batchNumber: primaryBatch?.batchNumber,
                    expiryDate: primaryBatch?.expiryDate,
                    gstRate: drug.gstRate,
                };
            })
        );

        // Filter out drugs with no stock
        return drugsWithBatches.filter(d => d.totalStock > 0);
    }
}

module.exports = new InventoryService();

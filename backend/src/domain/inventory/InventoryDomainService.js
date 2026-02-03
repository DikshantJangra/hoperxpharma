/**
 * Inventory Domain Service
 * Orchestrates complex inventory operations across multiple batches
 */

const Batch = require('./Batch');
const Drug = require('./Drug');
const { StockMovement, MovementType } = require('./StockMovement');
const { Quantity, Unit } = require('../shared/valueObjects/Quantity');
const { InsufficientStockError } = require('../shared/errors/DomainErrors');
const logger = require('../../config/logger');

const AllocationStrategy = {
    FIFO: 'FIFO',   // First In First Out
    FEFO: 'FEFO',   // First Expiry First Out
    LIFO: 'LIFO'    // Last In First Out
};

class InventoryDomainService {
    constructor(inventoryRepository) {
        this.inventoryRepo = inventoryRepository;
    }

    /**
     * Allocate stock from multiple batches using specified strategy
     * Returns array of { batch, allocatedQty } objects
     */
    async allocateStock(storeId, drugId, requestedQtyInBaseUnits, strategy = AllocationStrategy.FEFO) {
        // Get all available batches for this drug
        const batches = await this.inventoryRepo.findBatches({
            storeId,
            drugId,
            minQuantity: 1 // min base unit quantity
        });

        if (!batches.batches || batches.batches.length === 0) {
            throw new InsufficientStockError('No batches available', 0, requestedQtyInBaseUnits);
        }

        // Convert to domain objects
        const batchEntities = batches.batches.map(b => Batch.fromPrisma(b));

        // Filter expired batches
        const validBatches = batchEntities.filter(b => !b.isExpired());

        if (validBatches.length === 0) {
            throw new InsufficientStockError('All batches expired', 0, requestedQtyInBaseUnits);
        }

        // Sort based on strategy
        const sortedBatches = this.sortBatchesByStrategy(validBatches, strategy);

        // Allocate from batches
        const allocations = [];
        let remaining = requestedQtyInBaseUnits;

        for (const batch of sortedBatches) {
            if (remaining <= 0) break;

            const available = batch.baseUnitQuantity;
            const toAllocate = Math.min(available, remaining);

            allocations.push({
                batch,
                allocatedQtyInBaseUnits: toAllocate
            });

            remaining -= toAllocate;
        }

        // Check if we could fulfill the request
        if (remaining > 0) {
            const totalAvailable = validBatches.reduce(
                (sum, b) => sum + b.baseUnitQuantity,
                0
            );
            throw new InsufficientStockError(
                `Insufficient stock`,
                totalAvailable,
                requestedQtyInBaseUnits
            );
        }

        logger.info('[InventoryDomain] Stock allocated', {
            drugId,
            requestedInBaseUnits: requestedQtyInBaseUnits,
            batches: allocations.length,
            strategy
        });

        return allocations;
    }

    /**
     * Deduct stock from allocated batches and create movements
     */
    async deductAllocatedStock(allocations, reason, userId, referenceType, referenceId, tx) {
        const movements = [];

        for (const allocation of allocations) {
            const { batch, allocatedQtyInBaseUnits } = allocation;

            // Deduct from batch (this validates and creates domain event)
            batch.deduct(allocatedQtyInBaseUnits, reason, userId);

            // Persist batch update
            await this.inventoryRepo.updateBatchQuantity(
                batch.id,
                batch.baseUnitQuantity,
                tx
            );

            // Create stock movement
            const movement = StockMovement.createForSale(
                batch.id,
                allocatedQtyInBaseUnits,
                referenceId,
                userId
            );

            // Set balance snapshots
            const balanceBefore = batch.baseUnitQuantity + allocatedQtyInBaseUnits;
            movement.setBalances(balanceBefore, batch.baseUnitQuantity);

            movements.push(movement);

            // Persist movement
            await this.inventoryRepo.createStockMovement(movement.toPrisma(), tx);
        }

        return movements;
    }

    /**
     * Sort batches by allocation strategy
     */
    sortBatchesByStrategy(batches, strategy) {
        switch (strategy) {
            case AllocationStrategy.FEFO:
                // First Expiry First Out
                return batches.sort((a, b) => a.expiryDate - b.expiryDate);

            case AllocationStrategy.FIFO:
                // First In First Out (by created date if available)
                return batches.sort((a, b) => a.createdAt - b.createdAt);

            case AllocationStrategy.LIFO:
                // Last In First Out
                return batches.sort((a, b) => b.createdAt - a.createdAt);

            default:
                return batches;
        }
    }

    /**
     * Get expiring batches for a store
     */
    async getExpiringBatches(storeId, daysAhead = 90) {
        const batches = await this.inventoryRepo.findAllBatches(storeId);
        const batchEntities = batches.map(b => Batch.fromPrisma(b));

        return batchEntities.filter(b => b.isExpiringSoon(daysAhead));
    }

    /**
     * Get low stock items
     */
    async getLowStockItems(storeId) {
        // This would aggregate stock across all batches per drug
        // and compare against drug.lowStockThreshold
        const lowStockData = await this.inventoryRepo.getLowStockItems(storeId);
        return lowStockData;
    }
}

module.exports = { InventoryDomainService, AllocationStrategy };

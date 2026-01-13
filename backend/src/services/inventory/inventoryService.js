const inventoryRepository = require('../../repositories/inventoryRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const eventBus = require('../../events/eventBus');
const { INVENTORY_EVENTS } = require('../../events/eventTypes');

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
        // Extract initial stock data if present
        const { initialStock, ...drugDetails } = drugData;

        // Create the drug
        const drug = await inventoryRepository.createDrug(drugDetails);
        logger.info(`Drug created: ${drug.name} (ID: ${drug.id})`);

        // If initial stock is provided, create the batch immediately
        if (initialStock && initialStock.quantity > 0) {
            try {
                await this.createBatch({
                    drugId: drug.id,
                    storeId: drugDetails.storeId, // Ensure storeId is passed from controller
                    batchNumber: initialStock.batchNumber,
                    quantityInStock: parseFloat(initialStock.quantity),
                    expiryDate: new Date(initialStock.expiryDate),
                    mrp: parseFloat(initialStock.mrp),
                    purchaseRate: parseFloat(initialStock.purchaseRate || 0),
                    supplierId: initialStock.supplierId // Optional
                });
                logger.info(`Initial stock added for drug: ${drug.name}`);
            } catch (error) {
                logger.error(`Failed to add initial stock for drug ${drug.id}:`, error);
                // We don't fail the drug creation if stock fails, but we should probably alert
            }
        }

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

        // Check for expiry alerts on batch creation
        this.checkBatchExpiry(batch);

        return batch;
    }

    /**
     * Check batch expiry and emit events
     */
    checkBatchExpiry(batch) {
        const now = new Date();
        const expiryDate = new Date(batch.expiryDate);
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        // Use base unit quantity for accurate reporting
        const stockQuantity = batch.baseUnitQuantity || batch.quantityInStock;

        // Emit expired event
        if (daysLeft <= 0) {
            eventBus.emitEvent(INVENTORY_EVENTS.EXPIRED, {
                storeId: batch.storeId,
                entityType: 'batch',
                entityId: batch.id,
                drugId: batch.drugId,
                drugName: batch.drug?.name || 'Unknown',
                batchNumber: batch.batchNumber,
                expiryDate: batch.expiryDate,
                quantityInStock: stockQuantity, // Base unit quantity
                baseUnit: batch.drug?.baseUnit,
                mrp: batch.mrp,
            });
        }
        // Emit near expiry event (within 90 days)
        else if (daysLeft <= 90) {
            eventBus.emitEvent(INVENTORY_EVENTS.EXPIRY_NEAR, {
                storeId: batch.storeId,
                entityType: 'batch',
                entityId: batch.id,
                drugId: batch.drugId,
                drugName: batch.drug?.name || 'Unknown',
                batchNumber: batch.batchNumber,
                expiryDate: batch.expiryDate,
                daysLeft,
                quantityInStock: stockQuantity, // Base unit quantity
                baseUnit: batch.drug?.baseUnit,
                mrp: batch.mrp,
            });
        }
    }

    /**
     * Update batch
     */
    async updateBatch(id, updateData) {
        const batch = await inventoryRepository.findBatchById(id);

        if (!batch) {
            throw ApiError.notFound('Batch not found');
        }

        const updatedBatch = await inventoryRepository.updateBatchQuantity(id, updateData.quantityInStock || batch.quantityInStock);
        logger.info(`Batch updated: ${updatedBatch.batchNumber}`);
        return updatedBatch;
    }

    /**
     * Delete batch (soft delete)
     */
    async deleteBatch(id, userId) {
        const batch = await inventoryRepository.findBatchById(id);

        if (!batch) {
            throw ApiError.notFound('Batch not found');
        }

        if (batch.deletedAt) {
            throw ApiError.badRequest('Batch is already deleted');
        }

        const deletedBatch = await inventoryRepository.deleteBatch(id, userId);
        logger.info(`Batch soft deleted: ${batch.batchNumber} by user: ${userId}`);
        return deletedBatch;
    }

    /**
     * Delete drug and all its batches (soft delete)
     */
    async deleteDrug(id, userId) {
        try {
            const drug = await inventoryRepository.findDrugById(id);

            if (!drug) {
                throw ApiError.notFound('Drug not found');
            }

            // Get all batches for this drug
            const batches = await inventoryRepository.getBatchesWithSuppliers(id);
            logger.info(`Found ${batches.length} batches for drug ${drug.name}`);

            // Delete all batches
            if (batches.length > 0) {
                const deletePromises = batches.map(batch =>
                    inventoryRepository.deleteBatch(batch.id, userId)
                );
                await Promise.all(deletePromises);
            }

            logger.info(`Drug deleted: ${drug.name} with ${batches.length} batches by user: ${userId}`);

            return {
                drug,
                deletedBatchCount: batches.length
            };
        } catch (error) {
            logger.error('Delete drug error:', error);
            throw error;
        }
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
        try {
            logger.info('🔍 Service: Searching drugs for POS:', { storeId, searchTerm });

            // Search drugs that belong to this store
            const drugs = await inventoryRepository.searchDrugsWithStock(storeId, searchTerm);
            logger.info('🔍 Service: Found drugs count:', drugs.length);

            // Process drugs to flatten structure and add conversion factor
            const results = drugs.map(drug => {
                try {
                    // Find conversion factor for displayUnit -> baseUnit
                    let conversion = 1;
                    if (drug.unitConfigurations && drug.unitConfigurations.length > 0) {
                        const config = drug.unitConfigurations.find(
                            c => c.parentUnit === drug.displayUnit && c.childUnit === drug.baseUnit
                        );
                        if (config) {
                            conversion = Number(config.conversion);
                        }
                    }

                    // Calculate total stock
                    const totalStock = drug.inventory ? drug.inventory.reduce((sum, batch) => sum + batch.quantityInStock, 0) : 0;

                    // Identify primary batch (FEFO) - Repo returns sorted by expiry
                    const primaryBatch = drug.inventory && drug.inventory.length > 0 ? drug.inventory[0] : null;

                    return {
                        id: drug.id,
                        name: drug.name,
                        strength: drug.strength,
                        form: drug.form,
                        manufacturer: drug.manufacturer,
                        mrp: primaryBatch ? Number(primaryBatch.mrp) : 0,
                        totalStock,
                        batchCount: drug.inventory ? drug.inventory.length : 0,
                        gstRate: Number(drug.gstRate),
                        requiresPrescription: drug.requiresPrescription,
                        baseUnit: drug.baseUnit,
                        displayUnit: drug.displayUnit,
                        unitConfigurations: drug.unitConfigurations,
                        conversionFactor: conversion,
                        // Primary Batch Details (for FEFO auto-selection)
                        batchId: primaryBatch ? primaryBatch.id : null,
                        batchNumber: primaryBatch ? primaryBatch.batchNumber : null,
                        expiryDate: primaryBatch ? primaryBatch.expiryDate : null,
                        location: primaryBatch ? primaryBatch.location : null
                    };
                } catch (innerError) {
                    logger.error('❌ Error processing drug:', { drugId: drug.id, error: innerError.message });
                    return null;
                }
            }).filter(item => item !== null);

            return results;
        } catch (error) {
            logger.error('❌ Service: Error in searchDrugsForPOS:', error);
            throw error; // Re-throw so controller sends 500
        }
    }

    /**
     * Update batch location
     */
    async updateBatchLocation(batchId, location) {
        const batch = await inventoryRepository.findBatchById(batchId);

        if (!batch) {
            throw ApiError.notFound('Batch not found');
        }

        return await inventoryRepository.updateBatchLocation(batchId, location);
    }

    /**
     * Get batches with suppliers for a drug
     */
    async getBatchesWithSuppliers(drugId) {
        return await inventoryRepository.getBatchesWithSuppliers(drugId);
    }

    /**
     * Get batch history for smart suggest
     */
    async getBatchHistory(storeId, drugIds) {
        return await inventoryRepository.getBatchHistoryForDrugs(storeId, drugIds);
    }

    /**
     * Check if a batch exists for a drug in a store
     */
    async checkBatchExists(storeId, drugId, batchNumber) {
        const batch = await inventoryRepository.findBatchByDrugAndNumber(storeId, drugId, batchNumber);

        if (batch) {
            return {
                exists: true,
                batchId: batch.id,
                currentStock: batch.quantityInStock,
                expiry: batch.expiryDate,
                location: batch.location,
                mrp: batch.mrp,
                purchasePrice: batch.purchasePrice,
                manufacturerBarcode: batch.manufacturerBarcode,
                internalQR: batch.id,
                createdAt: batch.createdAt,
            };
        }

        return { exists: false };
    }

    /**
     * Bulk check batch existence
     * Returns a map keyed by `${drugId}_${batchNumber}`
     */
    async checkBatchesBulk(storeId, items) {
        const batches = await inventoryRepository.findBatchesBulk(storeId, items);

        // Transform to map for easy frontend lookup
        const result = {};

        // Helper key generator
        const getKey = (drugId, batchNumber) => `${drugId}_${batchNumber}`;

        // Populate found batches
        batches.forEach(batch => {
            const key = getKey(batch.drugId, batch.batchNumber);
            result[key] = {
                exists: true,
                batchId: batch.id,
                currentStock: batch.quantityInStock,
                expiry: batch.expiryDate,
                location: batch.location,
                mrp: batch.mrp,
                manufacturerBarcode: batch.manufacturerBarcode,
                internalQR: batch.id // Using batch ID as QR content
            };
        });

        // Add 'exists: false' for items not found (implicit in frontend usage, but explicit here is clearer)
        items.forEach(item => {
            const key = getKey(item.drugId, item.batchNumber);
            if (!result[key]) {
                result[key] = { exists: false };
            }
        });

        return result;
    }
}

module.exports = new InventoryService();

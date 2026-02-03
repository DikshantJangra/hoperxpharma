/**
 * Inventory Service (Refactored to use Domain Models)
 * CRITICAL: Maintains backward compatibility with frontend expectations
 */

const inventoryRepository = require('../../repositories/inventoryRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const eventBus = require('../../events/eventBus');
const { INVENTORY_EVENTS } = require('../../events/eventTypes');

// Domain imports
const Batch = require('../../domain/inventory/Batch');
const Drug = require('../../domain/inventory/Drug');
const { StockMovement } = require('../../domain/inventory/StockMovement');
const { InventoryDomainService, AllocationStrategy } = require('../../domain/inventory/InventoryDomainService');
const { Quantity, Unit } = require('../../domain/shared/valueObjects/Quantity');
const BatchNumber = require('../../domain/inventory/valueObjects/BatchNumber');
const Money = require('../../domain/shared/valueObjects/Money');

class InventoryService {
    constructor() {
        // Initialize domain service
        this.inventoryDomain = new InventoryDomainService(inventoryRepository);
        // Bind private methods
        this._resolveSalts = this._resolveSalts.bind(this);
    }

    /**
     * Get all drugs with pagination and CRITICAL stock aggregation
     */
    async getDrugs(filters) {
        const result = await inventoryRepository.findDrugs(filters);

        // Handle both paginated and non-paginated responses
        if (result.drugs) {
            // Paginated response - MUST include stock aggregation for frontend
            const drugsWithStock = result.drugs.map(d => {
                // Calculate total stock from inventory batches
                const totalStock = d.inventory
                    ? d.inventory.reduce((sum, batch) => sum + (batch.baseUnitQuantity || 0), 0)
                    : 0;

                // Return raw Prisma data with stock calculation
                // IMPORTANT: Frontend expects these exact fields
                return {
                    ...d,
                    totalStock,
                    batches: d.inventory || [],
                    batchCount: d.inventory ? d.inventory.length : 0
                };
            });

            return {
                drugs: drugsWithStock,
                total: result.total
            };
        } else {
            // Non-paginated response (array)
            return result.map(d => {
                const totalStock = d.inventory
                    ? d.inventory.reduce((sum, batch) => sum + (batch.baseUnitQuantity || 0), 0)
                    : 0;

                return {
                    ...d,
                    totalStock,
                    batches: d.inventory || []
                };
            });
        }
    }

    /**
     * Get drug by ID
     */
    async getDrugById(id) {
        if (!id || typeof id !== 'string') {
            throw ApiError.badRequest('Invalid drug ID');
        }

        const drugData = await inventoryRepository.findDrugById(id);

        if (!drugData) {
            logger.warn(`Drug not found with ID: ${id}`);
            throw ApiError.notFound('Drug not found');
        }

        const drug = Drug.fromPrisma(drugData);
        return drug.toDTO();
    }

    /**
     * Create new drug
     */
    async createDrug(drugData, userId) {
        // CRITICAL: Prevent duplicate drugs - use repository layer
        const existing = await inventoryRepository.findDrugByNameAndManufacturer(
            drugData.name.trim(),
            drugData.manufacturer?.trim() || '',
            drugData.storeId
        );

        if (existing) {
            throw ApiError.conflict(`Medicine "${drugData.name}" by ${drugData.manufacturer || 'Unknown'} already exists`);
        }

        // Create domain entity
        const drug = new Drug({
            ...drugData,
            isActive: true
        });

        // Validate
        drug.validate();

        // Persist Drug first
        const prismaData = drug.toPrisma();

        // Transform saltLinks for Prisma nested write if present
        if (prismaData.saltLinks && Array.isArray(prismaData.saltLinks)) {
            // Intelligent Salt Resolution: Resolve name to saltId or create new salt
            const resolvedSaltLinks = await this._resolveSalts(prismaData.saltLinks, userId || drugData.storeId);

            prismaData.saltLinks = {
                create: resolvedSaltLinks.map(link => ({
                    saltId: link.saltId,
                    // Note: 'name' is NOT a field in DrugSaltLink model, removed to fix 500 error
                    strengthValue: link.strengthValue ? Number(link.strengthValue) : null,
                    strengthUnit: link.strengthUnit,
                    order: link.order
                }))
            };
        }

        const created = await inventoryRepository.createDrug(prismaData);
        logger.info(`Drug created: ${drug.getDisplayName()}`);

        // CRITICAL FIX: Handle initial batch creation if provided
        // The frontend sends 'initialStock' or 'batchDetails' in the same payload
        const batchData = drugData.batchDetails || drugData.initialStock;
        if (batchData) {
            try {
                console.error('🚨 DEBUG: Raw initialStock from frontend:', batchData);
                logger.info('🔍 DEBUG createDrug - Raw initialStock from frontend:', JSON.stringify(batchData, null, 2));

                // Ensure numeric types for critical fields
                const quantity = Number(batchData.quantity);
                const mrp = Number(batchData.mrp);
                const purchasePrice = Number(batchData.purchaseRate || batchData.purchasePrice);

                logger.info('🔍 DEBUG createDrug - Extracted numbers:', { quantity, mrp, purchasePrice });

                if (isNaN(quantity)) throw new Error(`Invalid Quantity: ${batchData.quantity}`);
                if (isNaN(mrp)) throw new Error(`Invalid MRP: ${batchData.mrp}`);
                if (isNaN(purchasePrice)) throw new Error(`Invalid Purchase Rate: ${batchData.purchaseRate}`);

                const batchPayload = {
                    ...batchData,
                    drugId: created.id,
                    storeId: created.storeId,
                    quantity: quantity,
                    mrp: mrp,
                    purchasePrice: purchasePrice, // frontend sends purchaseRate
                    // CRITICAL: Get unit config from drug if not in batch
                    receivedUnit: batchData.receivedUnit || drugData.displayUnit || 'Tablet',
                    tabletsPerStrip: batchData.tabletsPerStrip || drugData.tabletsPerStrip || 1
                };

                console.error('🚨 DEBUG: batchPayload about to send to createBatch:', batchPayload);
                logger.info('🔍 DEBUG createDrug - Initial Stock Payload:', JSON.stringify(batchPayload, null, 2));

                // Use existing createBatch method (handles domain logic & events & supplier resolution)
                await this.createBatch(batchPayload, userId);
                logger.info(`Initial batch created for drug: ${created.name}`);
            } catch (err) {
                logger.error(`Failed to create initial batch for ${created.name}:`, err);
                // Throwing here to inform the client/user that part of the op failed
                // Ideally this should revert the Drug creation (Transaction needed)
                throw new ApiError(500, `Drug created but failed to add stock: ${err.message}`);
            }
        }

        return Drug.fromPrisma(created).toDTO();
    }

    /**
     * Update drug
     */
    async updateDrug(id, updates) {
        const existing = await inventoryRepository.findDrugById(id);

        if (!existing) {
            throw ApiError.notFound('Drug not found');
        }

        // Only update allowed fields, exclude relations like saltLinks
        const allowedFields = [
            'name', 'genericName', 'manufacturer', 'strength', 'form',
            'defaultUnit', 'schedule', 'requiresPrescription', 'hsnCode',
            'gstRate', 'lowStockThreshold', 'description', 'baseUnit',
            'displayUnit', 'ocrMetadata', 'stripImageUrl'
        ];

        const updateData = {};
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        });

        updateData.updatedAt = new Date();

        // Persist only the allowed fields
        const updated = await inventoryRepository.updateDrug(id, updateData);

        return Drug.fromPrisma(updated).toDTO();
    }

    /**
     * Get all batches with filters and related data
     */
    async getBatches(filters) {
        const result = await inventoryRepository.findBatches(filters);

        // Return raw Prisma data - frontend expects exact DB structure
        return result;
    }

    /**
     * Get batch by ID
     */
    async getBatchById(id) {
        const batchData = await inventoryRepository.findBatchById(id);

        if (!batchData) {
            throw ApiError.notFound('Batch not found');
        }

        // Return raw Prisma data
        return batchData;
    }

    /**
     * Create new batch
     */
    async createBatch(batchData, userId) {
        // Resolve supplier if name provided but ID missing
        if (!batchData.supplierId && batchData.supplier) {
            batchData.supplierId = await this.findOrCreateSupplierByName(batchData.supplier, batchData.storeId, userId);
        }

        // CRITICAL: Calculate baseUnitQuantity correctly based on unit type
        logger.info('🔍 DEBUG createBatch - Raw Input:', JSON.stringify({
            quantity: batchData.quantity,
            receivedUnit: batchData.receivedUnit,
            unit: batchData.unit,
            tabletsPerStrip: batchData.tabletsPerStrip,
            form: batchData.form
        }, null, 2));

        const quantity = Number(batchData.quantity || 0);
        const unit = (batchData.receivedUnit || batchData.unit || 'Tablet').toUpperCase();
        const tabletsPerStrip = batchData.tabletsPerStrip ? Number(batchData.tabletsPerStrip) : null;

        logger.info('🔍 DEBUG createBatch - Parsed Values:', {
            quantity,
            unit,
            tabletsPerStrip,
            'isNaN(tabletsPerStrip)': tabletsPerStrip === null ? 'null' : isNaN(tabletsPerStrip)
        });

        let baseUnitQuantity;

        // CRITICAL: If frontend already calculated baseUnitQuantity (e.g., 3-level Box hierarchy), use it!
        if (batchData.baseUnitQuantity !== undefined && batchData.baseUnitQuantity !== null) {
            baseUnitQuantity = Number(batchData.baseUnitQuantity);
            logger.info(`✅ Using PRE-CALCULATED baseUnitQuantity: ${baseUnitQuantity} base units`);
        } else {
            const needsConversion = (unit === 'STRIP' || unit === 'BOX' || unit === 'BOTTLE');
            const hasValidConversion = tabletsPerStrip !== null && !isNaN(tabletsPerStrip) && tabletsPerStrip > 0;

            logger.info('🔍 DEBUG createBatch - Conversion Check:', {
                needsConversion,
                hasValidConversion,
                willApplyConversion: needsConversion && hasValidConversion
            });

            // Check if unit requires conversion AND tabletsPerStrip is a valid number > 0
            if (needsConversion && hasValidConversion) {
                baseUnitQuantity = quantity * tabletsPerStrip;
                logger.info(`✅ Batch conversion APPLIED: ${quantity} ${unit} × ${tabletsPerStrip} = ${baseUnitQuantity} tablets`);
            } else {
                baseUnitQuantity = quantity;
                if (needsConversion && !hasValidConversion) {
                    logger.warn(`⚠️ WARNING: Unit "${unit}" needs conversion but tabletsPerStrip is invalid (${tabletsPerStrip}). Using quantity as-is: ${baseUnitQuantity}`);
                } else {
                    logger.info(`ℹ️ No conversion needed for unit "${unit}". Using quantity directly: ${baseUnitQuantity}`);
                }
            }
        }

        // Create domain entity with corrected values
        const batch = new Batch({
            ...batchData,
            batchNumber: new BatchNumber(batchData.batchNumber),
            baseUnitQuantity,
            receivedUnit: unit,
            tabletsPerStrip
        });

        // Check expiry warnings
        if (batch.isExpiringSoon(30)) {
            logger.warn(`New batch ${batch.batchNumber.toString()} is expiring soon`);

            eventBus.emitEvent(INVENTORY_EVENTS.BATCH_EXPIRING_SOON, {
                batchId: batch.id,
                batchNumber: batch.batchNumber.toString(),
                expiryDate: batch.expiryDate,
                daysRemaining: Math.floor((batch.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
            });
        }

        // Persist
        const created = await inventoryRepository.createBatch(batch.toPrisma());

        logger.info(`Batch created: ${batch.batchNumber.toString()} by user ${userId}`);

        // Create stock movement for audit trail
        const movement = StockMovement.createForGRN(created.id, baseUnitQuantity, userId, 'Initial Stock', null);
        await inventoryRepository.createStockMovement(movement.toPrisma());
        logger.info(`✅ Stock movement created for batch ${created.id} with ${baseUnitQuantity} base units`);

        return created; // Return raw Prisma data
    }

    /**
     * Resolve supplier name to ID, creating it if it doesn't exist
     */
    async findOrCreateSupplierByName(name, storeId, userId) {
        if (!name || !storeId) return null;

        const supplierRepository = require('../../repositories/supplierRepository');
        const existing = await supplierRepository.findByName(name, storeId);

        if (existing) {
            return existing.id;
        }

        // Create new supplier if not found
        const supplierService = require('../suppliers/supplierService');
        const newSupplier = await supplierService.createSupplier({
            name: name.trim(),
            storeId,
            status: 'Active',
            createdBy: userId
        });

        return newSupplier.id;
    }

    /**
     * Update batch
     */
    async updateBatch(id, updates, userId) {
        const existing = await inventoryRepository.findBatchById(id);

        if (!existing) {
            throw ApiError.notFound('Batch not found');
        }

        const batch = Batch.fromPrisma(existing);

        // Apply updates (carefully - some fields shouldn't change)
        if (updates.location) batch.location = updates.location;
        if (updates.mrp) batch.sellingPrice = new Money(updates.mrp);
        if (updates.costPrice) batch.costPrice = new Money(updates.costPrice);

        // Persist
        const updated = await inventoryRepository.updateBatch(id, batch.toPrisma());

        return updated; // Return raw Prisma data
    }

    /**
     * Adjust stock (manual increase/decrease)
     */
    async adjustStock(adjustmentData, userId) {
        const { batchId, quantityAdjusted, reason, notes } = adjustmentData;

        // Validate quantity is a number
        const numQuantity = Number(quantityAdjusted);
        if (isNaN(numQuantity)) {
            throw ApiError.badRequest(`Invalid quantity: ${quantityAdjusted}`);
        }

        const batchData = await inventoryRepository.findBatchById(batchId);

        if (!batchData) {
            throw ApiError.notFound('Batch not found');
        }

        const batch = Batch.fromPrisma(batchData);

        // Frontend sends adjustment already in BASE UNITS
        // Backend is DUMB - just add or deduct the received quantity
        const adjustmentInBaseUnits = numQuantity;

        // Add or deduct based on sign
        if (adjustmentInBaseUnits > 0) {
            batch.add(adjustmentInBaseUnits, reason, userId);
        } else {
            batch.deduct(Math.abs(adjustmentInBaseUnits), reason, userId);
        }

        // Update ONLY baseUnitQuantity
        await inventoryRepository.updateBatch(batch.id, {
            baseUnitQuantity: batch.baseUnitQuantity
        });

        // Create stock movement (use absolute value, direction is indicated by movement type)
        const movement = StockMovement.createAdjustment(
            batchId,
            adjustmentInBaseUnits,
            reason,
            userId,
            notes
        );

        await inventoryRepository.createStockMovement(movement.toPrisma());

        // Emit events
        batch.getDomainEvents().forEach(event => {
            eventBus.emitEvent(event.type, event);
        });
        batch.clearEvents();

        logger.info(`Stock adjusted for batch ${batch.batchNumber.toString()}: ${numQuantity} base units -> ${batch.baseUnitQuantity} total base units`);

        return batch.toDTO();
    }

    /**
     * Get low stock alerts
     */
    async getLowStockAlerts(storeId) {
        // Use repository directly as it returns aggregated data
        return await inventoryRepository.getLowStockItems(storeId);
    }

    /**
     * Get expiring items
     */
    async getExpiringItems(storeId, daysAhead = 90) {
        // Return raw Prisma data - frontend expects exact structure
        return await inventoryRepository.getExpiringItems(storeId, daysAhead);
    }

    /**
     * Get inventory summary
     */
    async getInventorySummary(storeId) {
        try {
            const [value, lowStock, expiring] = await Promise.all([
                inventoryRepository.getInventoryValue(storeId).catch(() => null),
                inventoryRepository.getLowStockItems(storeId).catch(() => []),
                inventoryRepository.getExpiringItems(storeId, 30).catch(() => []),
            ]);

            return {
                totalValue: value?.totalValue || 0,
                uniqueDrugs: value?.uniqueDrugs || 0,
                totalUnits: value?.totalUnits || 0,
                lowStockCount: lowStock?.length || 0,
                expiringCount: expiring?.length || 0,
            };
        } catch (error) {
            logger.error('Error getting inventory summary:', error);
            // Return safe defaults if there's an error
            return {
                totalValue: 0,
                uniqueDrugs: 0,
                totalUnits: 0,
                lowStockCount: 0,
                expiringCount: 0,
            };
        }
    }

    /**
     * Allocate stock using domain service (FEFO by default)
     */
    async allocateStock(storeId, drugId, quantity, strategy = AllocationStrategy.FEFO) {
        const qty = new Quantity(quantity, Unit.TABLET);
        const allocations = await this.inventoryDomain.allocateStock(storeId, drugId, qty, strategy);

        return allocations.map(alloc => ({
            batch: alloc.batch.toDTO(),
            allocatedQty: alloc.allocatedQty.toJSON()
        }));
    }

    /**
     * Search drugs for POS (enriched for frontend)
     */
    async searchDrugsForPOS(storeId, query, limit = 10) {
        const drugs = await inventoryRepository.searchDrugsWithStock(storeId, query, limit);

        // Transform results to match what frontend expects (similar to getDrugs)
        return drugs
            .map(d => {
                // Calculate total stock from inventory batches
                const totalStock = d.inventory
                    ? d.inventory.reduce((sum, batch) => sum + (batch.baseUnitQuantity || 0), 0)
                    : 0;

                const batchCount = d.inventory ? d.inventory.length : 0;

                // Get unit config if available
                let baseUnit = d.baseUnit || d.defaultUnit || 'Tablet';
                let displayUnit = d.displayUnit || d.defaultUnit || d.form || 'Tablet';

                // Return enriched object
                return {
                    ...d,
                    totalStock,
                    batchCount,
                    baseUnit,
                    displayUnit,
                    // Include batch info if available (for UI that shows batch details)
                    batchId: d.inventory && d.inventory.length > 0 ? d.inventory[0].id : null, // <--- CRITICAL: Pass Batch ID
                    batchNumber: d.inventory && d.inventory.length > 0 ? d.inventory[0].batchNumber : null,
                    expiryDate: d.inventory && d.inventory.length > 0 ? d.inventory[0].expiryDate : null,
                    mrp: d.inventory && d.inventory.length > 0 ? d.inventory[0].mrp : d.mrp || 0,
                };
            })
            // CRITICAL FIX: Filter out medicines without valid batches
            // This ensures POS never receives medicines that can't be sold
            .filter(drug => {
                const hasValidBatch = drug.batchId && drug.totalStock > 0;
                if (!hasValidBatch) {
                    logger.warn(`[POS Search] Filtering out ${drug.name} - No valid batches (batchId: ${drug.batchId}, stock: ${drug.totalStock})`);
                }
                return hasValidBatch;
            });
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
     * Delete drug and all its batches
     */
    async deleteDrug(id, userId) {
        const prisma = require('../../db/prisma');

        try {
            const drug = await prisma.drug.findUnique({ where: { id }, select: { id: true, name: true } });
            if (!drug) {
                throw ApiError.notFound('Drug not found');
            }

            logger.info(`Deleting drug ${drug.name}`);

            // Delete all related records in correct order
            await prisma.stockMovement.deleteMany({ where: { batch: { drugId: id } } });
            await prisma.saleItem.deleteMany({ where: { drugId: id } });
            await prisma.prescriptionItem.deleteMany({ where: { drugId: id } });
            await prisma.prescriptionItemVersion.deleteMany({ where: { drugId: id } });
            await prisma.purchaseOrderItem.deleteMany({ where: { drugId: id } });
            await prisma.gRNItem.deleteMany({ where: { drugId: id } });
            await prisma.supplierReturnItem.deleteMany({ where: { drugId: id } });
            await prisma.consolidatedInvoiceItem.deleteMany({ where: { drugId: id } });
            await prisma.pOTemplateItem.deleteMany({ where: { drugId: id } });
            await prisma.stockAlert.deleteMany({ where: { drugId: id } });
            await prisma.inventoryForecast.deleteMany({ where: { drugId: id } });
            await prisma.locationMapping.deleteMany({ where: { drugId: id } });
            await prisma.locationMismatch.deleteMany({ where: { drugId: id } });
            await prisma.saltMappingAudit.deleteMany({ where: { drugId: id } });
            await prisma.drugUnit.deleteMany({ where: { drugId: id } });
            await prisma.inventoryBatch.deleteMany({ where: { drugId: id } });
            await prisma.drugSaltLink.deleteMany({ where: { drugId: id } });
            await prisma.drug.delete({ where: { id } });

            logger.info(`Drug deleted: ${drug.name} by user: ${userId}`);
            return { drug };
        } catch (error) {
            logger.error('Delete drug error:', error);
            throw error;
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
                currentStock: batch.baseUnitQuantity,
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
                currentStock: batch.baseUnitQuantity,
                expiry: batch.expiryDate,
                location: batch.location,
                mrp: batch.mrp,
                manufacturerBarcode: batch.manufacturerBarcode,
                internalQR: batch.id // Using batch ID as QR content
            };
        });

        // Add 'exists: false' for items not found
        items.forEach(item => {
            const key = getKey(item.drugId, item.batchNumber);
            if (!result[key]) {
                result[key] = { exists: false };
            }
        });

        return result;
    }
    /**
     * Private helper to resolve salts by name or ID
     * @private
     */
    async _resolveSalts(saltLinks, contextId) {
        const saltRepository = require('../../repositories/saltRepository');
        const resolvedLinks = [];

        for (const link of saltLinks) {
            let finalSaltId = link.saltId;

            // If no ID, but we have a name, try to resolve or create
            if (!finalSaltId && link.name) {
                // Try to find existing salt by name
                const existingSalt = await saltRepository.findByNameOrAlias(link.name);
                if (existingSalt) {
                    finalSaltId = existingSalt.id;
                } else {
                    // Create new salt master record
                    const newSalt = await saltRepository.createSalt({
                        name: link.name,
                        createdById: contextId // Use storeId or userId as creator context
                    });
                    finalSaltId = newSalt.id;
                    logger.info(`Created new salt master record for: ${link.name}`);
                }
            }

            if (finalSaltId) {
                resolvedLinks.push({
                    ...link,
                    saltId: finalSaltId
                });
            }
        }

        return resolvedLinks;
    }
}

module.exports = new InventoryService();

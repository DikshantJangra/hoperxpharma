/**
 * GRN Completion Service
 * Extracted from grnRepository.completeGRN() to separate business logic from data access
 * 
 * This service orchestrates the complex workflow of:
 * - Validating GRN completion eligibility
 * - Creating inventory batches
 * - Updating purchase order status
 * - Creating stock movements
 * - Handling barcode registration
 */

const logger = require('../../config/logger');
const eventBus = require('../../events/eventBus');
const { INVENTORY_EVENTS } = require('../../events/eventTypes');

class GRNCompletionService {
    constructor(grnRepository, inventoryRepository, prisma) {
        this.grnRepo = grnRepository;
        this.inventoryRepo = inventoryRepository;
        this.prisma = prisma;
    }

    /**
     * Complete a GRN - Main orchestration method
     */
    async complete(grnId, status, userId) {
        return await this.prisma.$transaction(async (tx) => {
            // 1. Load and validate GRN
            const grn = await this._loadAndValidateGRN(grnId, tx);

            // 2. Ensure drugs exist in target store
            await this._ensureDrugsInStore(grn, tx);

            // 3. Reload GRN with updated drug references
            const updatedGrn = await this._reloadGRN(grnId, tx);

            // 4. Create inventory batches
            await this._createInventoryBatches(updatedGrn, userId, tx);

            // 5. Update PO items and status
            await this._updatePurchaseOrder(updatedGrn, status, tx);

            // 6. Mark GRN as completed
            const completedGRN = await this._completeGRN(grnId, status, tx);

            // 7. Emit domain events
            this._emitCompletionEvents(completedGRN);

            logger.info(`GRN completed: ${completedGRN.grnNumber} - Inventory updated`);

            return completedGRN;
        }, {
            maxWait: 10000,
            timeout: 15000
        });
    }

    /**
     * Step 1: Load and validate GRN
     */
    async _loadAndValidateGRN(grnId, tx) {
        const grn = await tx.goodsReceivedNote.findUnique({
            where: { id: grnId },
            include: {
                items: {
                    include: { children: true }
                },
                po: {
                    include: { items: true }
                }
            }
        });

        if (!grn) {
            throw new Error('GRN not found');
        }

        if (grn.status !== 'DRAFT' && grn.status !== 'IN_PROGRESS') {
            throw new Error('Can only complete draft or in-progress GRNs');
        }

        return grn;
    }

    /**
     * Step 2: Ensure all drugs exist in the target store
     * Creates store-specific drug copies if needed
     */
    async _ensureDrugsInStore(grn, tx) {
        const drugIds = new Set(grn.items.map(item => item.drugId));

        for (const drugId of drugIds) {
            const drug = await tx.drug.findUnique({ where: { id: drugId } });

            if (!drug) {
                throw new Error(`Drug ${drugId} not found`);
            }

            // If drug belongs to different store, create a copy
            if (drug.storeId !== grn.storeId) {
                const storeDrugId = await this._createOrFindStoreDrug(drug, grn.storeId, tx);

                // Update GRN items to reference store-specific drug
                await tx.gRNItem.updateMany({
                    where: { grnId: grn.id, drugId: drugId },
                    data: { drugId: storeDrugId }
                });
            }
        }
    }

    /**
     * Find or create store-specific drug
     */
    async _createOrFindStoreDrug(drug, storeId, tx) {
        const existingDrug = await tx.drug.findFirst({
            where: {
                storeId,
                name: drug.name,
                strength: drug.strength,
                form: drug.form
            }
        });

        if (existingDrug) {
            return existingDrug.id;
        }

        const newDrug = await tx.drug.create({
            data: {
                storeId,
                rxcui: drug.rxcui,
                name: drug.name,
                genericName: drug.genericName,
                strength: drug.strength,
                form: drug.form,
                manufacturer: drug.manufacturer,
                schedule: drug.schedule,
                hsnCode: drug.hsnCode,
                gstRate: drug.gstRate,
                requiresPrescription: drug.requiresPrescription,
                defaultUnit: drug.defaultUnit,
                lowStockThreshold: drug.lowStockThreshold,
                description: drug.description
            }
        });

        return newDrug.id;
    }

    /**
     * Step 3: Reload GRN with updated references
     */
    async _reloadGRN(grnId, tx) {
        return await tx.goodsReceivedNote.findUnique({
            where: { id: grnId },
            include: {
                items: {
                    where: { parentItemId: null },
                    include: { children: true }
                },
                po: true
            }
        });
    }

    /**
     * Step 4: Create inventory batches
     */
    async _createInventoryBatches(grn, userId, tx) {
        // Flatten items (include children of split batches, exclude split parents)
        const allItems = grn.items.flatMap(item => {
            return item.isSplit ? (item.children || []) : [item];
        });

        // Validate: No TBD batches
        const tbdItems = allItems.filter(item => item.batchNumber === 'TBD');
        if (tbdItems.length > 0) {
            throw new Error(
                `Cannot complete GRN: ${tbdItems.length} item(s) still have batch number "TBD". ` +
                `Please update all batch numbers before completing.`
            );
        }

        for (const item of allItems) {
            const totalQty = item.receivedQty + item.freeQty;

            if (totalQty > 0) {
                await this._createInventoryBatch(item, grn, totalQty, userId, tx);
            }
        }
    }

    /**
     * Create  or update a single inventory batch
     */
    async _createInventoryBatch(item, grn, totalQty, userId, tx) {
        // Calculate base unit quantity with unit conversion
        let baseUnitQty = totalQty;
        let receivedUnit = 'unit';
        let receivedQuantity = totalQty;

        try {
            const grnUnitHelper = require('../../repositories/grnUnitConversionHelper');
            const packUnit = grn.po?.items?.find(pi => pi.id === item.poItemId)?.packUnit || 'unit';
            const packSize = grn.po?.items?.find(pi => pi.id === item.poItemId)?.packSize || 1;

            const conversion = await grnUnitHelper.calculateBaseUnitQty(
                { drugId: item.drugId, receivedQty: item.receivedQty, freeQty: item.freeQty },
                packUnit,
                packSize
            );

            baseUnitQty = conversion.baseUnitQty;
            receivedUnit = conversion.receivedUnit;
            receivedQuantity = conversion.receivedQuantity;
        } catch (error) {
            logger.warn(`Unit conversion failed for batch ${item.batchNumber}, using 1:1:`, error.message);
        }

        // Upsert batch
        const batch = await tx.inventoryBatch.upsert({
            where: {
                storeId_batchNumber_drugId: {
                    storeId: grn.storeId,
                    batchNumber: item.batchNumber,
                    drugId: item.drugId
                }
            },
            update: {
                quantityInStock: { increment: totalQty },
                baseUnitQuantity: { increment: baseUnitQty },
                mrp: item.mrp,
                purchasePrice: item.unitPrice,
                location: item.location || undefined,
                manufacturerBarcode: item.manufacturerBarcode || undefined
            },
            create: {
                storeId: grn.storeId,
                drugId: item.drugId,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                quantityInStock: totalQty,
                baseUnitQuantity: baseUnitQty,
                baseUnitReserved: 0,
                receivedUnit,
                receivedQuantity,
                mrp: item.mrp,
                purchasePrice: item.unitPrice,
                supplierId: grn.supplierId,
                location: item.location || null,
                manufacturerBarcode: item.manufacturerBarcode || null
            }
        });

        // Register manufacturer barcode if present
        if (item.manufacturerBarcode) {
            await this._registerBarcode(item.manufacturerBarcode, batch.id, tx);
        }

        // Create stock movement
        await tx.stockMovement.create({
            data: {
                batchId: batch.id,
                movementType: 'IN',
                quantity: totalQty,
                reason: `GRN ${grn.grnNumber}`,
                referenceType: 'grn',
                referenceId: grn.id,
                userId
            }
        });
    }

    /**
     * Register barcode for batch
     */
    async _registerBarcode(barcode, batchId, tx) {
        const existingBarcode = await tx.barcodeRegistry.findUnique({
            where: { barcode }
        });

        if (!existingBarcode) {
            await tx.barcodeRegistry.create({
                data: {
                    barcode,
                    batchId,
                    barcodeType: 'MANUFACTURER',
                    unitType: 'STRIP',
                    manufacturerCode: barcode
                }
            });
        } else if (existingBarcode.batchId !== batchId) {
            // Update to newest batch (FIFO-ish for scanning)
            await tx.barcodeRegistry.update({
                where: { id: existingBarcode.id },
                data: { batchId }
            });
        }
    }

    /**
     * Step 5: Update purchase order
     */
    async _updatePurchaseOrder(grn, status, tx) {
        // Update PO item received quantities (only receivedQty, not free)
        for (const grnItem of grn.items) {
            await tx.purchaseOrderItem.update({
                where: { id: grnItem.poItemId },
                data: {
                    receivedQty: { increment: grnItem.receivedQty }
                }
            });
        }

        // Determine PO status
        const updatedPO = await tx.purchaseOrder.findUnique({
            where: { id: grn.poId },
            include: { items: true }
        });

        let newPOStatus = 'RECEIVED';
        for (const poItem of updatedPO.items) {
            if (poItem.receivedQty < poItem.quantity) {
                newPOStatus = 'PARTIALLY_RECEIVED';
                break;
            }
        }

        // If GRN explicitly marked COMPLETED, accept shortages
        if (status === 'COMPLETED') {
            newPOStatus = 'RECEIVED';
        }

        await tx.purchaseOrder.update({
            where: { id: grn.poId },
            data: { status: newPOStatus }
        });
    }

    /**
     * Step 6: Mark GRN as completed
     */
    async _completeGRN(grnId, status, tx) {
        return await tx.goodsReceivedNote.update({
            where: { id: grnId },
            data: {
                status: status || 'COMPLETED',
                completedAt: new Date()
            },
            include: {
                items: true,
                discrepancies: true,
                po: {
                    include: {
                        items: true,
                        supplier: true
                    }
                }
            }
        });
    }

    /**
     * Step 7: Emit domain events
     */
    _emitCompletionEvents(grn) {
        eventBus.emitEvent(INVENTORY_EVENTS.GRN_COMPLETED, {
            grnId: grn.id,
            grnNumber: grn.grnNumber,
            storeId: grn.storeId,
            supplierId: grn.supplierId,
            totalItems: grn.items.length,
            completedAt: grn.completedAt
        });
    }
}

// Export singleton with dependencies injected
const grnRepository = require('../../repositories/grnRepository');
const inventoryRepository = require('../../repositories/inventoryRepository');
const prisma = require('../../db/prisma');

module.exports = new GRNCompletionService(grnRepository, inventoryRepository, prisma);

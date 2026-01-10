/**
 * Inventory Reconciliation Service
 * 
 * Provides tools for daily stock reconciliation, ensuring that
 * opening balance + purchases - sales + adjustments = closing balance
 * 
 * Operates on base unit quantities for accuracy
 */

const prisma = require('../../db/prisma');
const logger = require('../../config/logger');
const inventoryDisplayHelper = require('./inventoryDisplayHelper');

class ReconciliationService {
    /**
     * Reconcile inventory for a specific store and date
     * 
     * @param {string} storeId - Store ID
     * @param {Date} date - Date to reconcile
     * @returns {Promise<Object>} Reconciliation report
     */
    async reconcileDailyStock(storeId, date) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // Get all batches for this store
            const batches = await prisma.inventoryBatch.findMany({
                where: {
                    storeId,
                    deletedAt: null
                },
                include: {
                    drug: {
                        select: {
                            id: true,
                            name: true,
                            baseUnit: true,
                            displayUnit: true
                        }
                    },
                    movements: {
                        where: {
                            createdAt: {
                                gte: startOfDay,
                                lte: endOfDay
                            }
                        }
                    }
                }
            });

            const discrepancies = [];

            for (const batch of batches) {
                // Calculate expected balance
                // Opening: Get stock at start of day
                // (For simplicity, we'll use current - today's movements)

                const todaysBaseMovements = batch.movements.reduce((sum, m) => {
                    return sum + (m.baseUnitQuantity || m.quantity || 0);
                }, 0);

                const current = batch.baseUnitQuantity || batch.quantityInStock;
                const opening = current - todaysBaseMovements;

                // Categorize movements
                const purchases = batch.movements
                    .filter(m => m.movementType === 'IN' || m.movementType === 'GRN')
                    .reduce((sum, m) => sum + Math.abs(m.baseUnitQuantity || m.quantity || 0), 0);

                const sales = batch.movements
                    .filter(m => m.movementType === 'SALE')
                    .reduce((sum, m) => sum + Math.abs(m.baseUnitQuantity || m.quantity || 0), 0);

                const adjustments = batch.movements
                    .filter(m => m.movementType === 'ADJUSTMENT')
                    .reduce((sum, m) => sum + (m.baseUnitQuantity || m.quantity || 0), 0);

                // Expected closing = opening + purchases - sales + adjustments
                const expected = opening + purchases - sales + adjustments;
                const actual = current;
                const difference = actual - expected;

                // Tolerance: 0.01 for decimal units
                if (Math.abs(difference) > 0.01) {
                    const displayInfo = await inventoryDisplayHelper.formatWithBothUnits(
                        Math.abs(difference),
                        batch.drug
                    );

                    discrepancies.push({
                        batchId: batch.id,
                        drugName: batch.drug.name,
                        batchNumber: batch.batchNumber,
                        expected,
                        actual,
                        difference,
                        differenceFormatted: displayInfo,
                        movements: {
                            purchases,
                            sales,
                            adjustments
                        }
                    });

                    logger.warn(`Stock discrepancy detected for ${batch.drug.name} (${batch.batchNumber})`, {
                        expected,
                        actual,
                        difference
                    });
                }
            }

            return {
                date,
                storeId,
                batchesChecked: batches.length,
                discrepanciesFound: discrepancies.length,
                discrepancies
            };
        } catch (error) {
            logger.error('Error in daily stock reconciliation:', error);
            throw error;
        }
    }

    /**
     * Generate inventory valuation report
     * 
     * @param {string} storeId - Store ID
     * @returns {Promise<Object>} Valuation report
     */
    async generateValuationReport(storeId) {
        try {
            const batches = await prisma.inventoryBatch.findMany({
                where: {
                    storeId,
                    deletedAt: null,
                    OR: [
                        { baseUnitQuantity: { gt: 0 } },
                        { quantityInStock: { gt: 0 } }
                    ]
                },
                include: {
                    drug: {
                        select: {
                            id: true,
                            name: true,
                            form: true,
                            baseUnit: true,
                            displayUnit: true
                        }
                    }
                }
            });

            let totalCost = 0;
            let totalMrp = 0;
            const items = [];

            for (const batch of batches) {
                const baseQty = batch.baseUnitQuantity || batch.quantityInStock;
                const batchCost = parseFloat(batch.purchasePrice) * baseQty;
                const batchMrp = parseFloat(batch.mrp) * baseQty;

                totalCost += batchCost;
                totalMrp += batchMrp;

                const displayInfo = await inventoryDisplayHelper.formatWithBothUnits(
                    baseQty,
                    batch.drug
                );

                items.push({
                    drugName: batch.drug.name,
                    batchNumber: batch.batchNumber,
                    quantity: displayInfo,
                    unitCost: parseFloat(batch.purchasePrice),
                    unitMrp: parseFloat(batch.mrp),
                    totalCost: batchCost.toFixed(2),
                    totalMrp: batchMrp.toFixed(2),
                    expiryDate: batch.expiryDate
                });
            }

            return {
                storeId,
                generatedAt: new Date(),
                summary: {
                    totalItems: items.length,
                    totalCostValue: totalCost.toFixed(2),
                    totalMrpValue: totalMrp.toFixed(2),
                    potentialProfit: (totalMrp - totalCost).toFixed(2)
                },
                items
            };
        } catch (error) {
            logger.error('Error generating valuation report:', error);
            throw error;
        }
    }
}

module.exports = new ReconciliationService();

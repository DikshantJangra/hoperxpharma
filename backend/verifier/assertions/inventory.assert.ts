/**
 * Inventory Assertions - Business invariant checks for inventory
 */

import { AssertionResult, ScenarioContext } from '../types';

const prisma = require('../../src/db/prisma');

export const inventoryAssert = {
    /**
     * INV-001: Stock must never be negative
     */
    async checkNonNegativeStock(ctx: ScenarioContext, batchId: string): Promise<AssertionResult> {
        const batch = await prisma.inventoryBatch.findUnique({
            where: { id: batchId }
        });

        return {
            passed: batch !== null && Number(batch.baseUnitQuantity) >= 0,
            expected: '>= 0',
            actual: batch?.baseUnitQuantity ?? 'Batch not found',
            message: 'Stock quantity must never be negative'
        };
    },

    /**
     * INV-001: All batches in store have non-negative stock
     */
    async checkAllBatchesNonNegative(ctx: ScenarioContext): Promise<AssertionResult> {
        const negativeBatches = await prisma.inventoryBatch.findMany({
            where: {
                storeId: ctx.storeId,
                baseUnitQuantity: { lt: 0 },
                deletedAt: null
            },
            select: {
                id: true,
                batchNumber: true,
                baseUnitQuantity: true,
                drug: { select: { name: true } }
            }
        });

        return {
            passed: negativeBatches.length === 0,
            expected: 'No batches with negative stock',
            actual: negativeBatches.length > 0
                ? negativeBatches.map((b: any) => `${b.drug.name} (${b.batchNumber}): ${b.baseUnitQuantity}`)
                : 'All batches OK',
            message: 'All inventory batches must have non-negative stock'
        };
    },

    /**
     * INV-004: GRN updates stock correctly
     */
    async checkGRNStockUpdate(
        ctx: ScenarioContext,
        grnId: string,
        expectedUpdates: { drugId: string; batchNumber: string; quantity: number }[]
    ): Promise<AssertionResult> {
        const grn = await prisma.goodsReceivedNote.findUnique({
            where: { id: grnId },
            include: {
                items: {
                    include: { drug: true }
                }
            }
        });

        if (!grn) {
            return {
                passed: false,
                expected: 'GRN exists',
                actual: 'GRN not found',
                message: `GRN ${grnId} not found`
            };
        }

        const mismatches: string[] = [];

        for (const expected of expectedUpdates) {
            const batch = await prisma.inventoryBatch.findFirst({
                where: {
                    storeId: ctx.storeId,
                    drugId: expected.drugId,
                    batchNumber: expected.batchNumber
                }
            });

            if (!batch) {
                mismatches.push(`Batch ${expected.batchNumber} not created`);
            } else if (Number(batch.baseUnitQuantity) !== expected.quantity) {
                mismatches.push(
                    `Batch ${expected.batchNumber}: expected ${expected.quantity}, got ${batch.baseUnitQuantity}`
                );
            }
        }

        return {
            passed: mismatches.length === 0,
            expected: 'All GRN items created correct stock',
            actual: mismatches.length > 0 ? mismatches : 'All correct',
            message: 'GRN completion must create/update inventory batches correctly'
        };
    },

    /**
     * INV-AUDIT: Stock movement recorded for sale
     */
    async checkStockMovementRecorded(
        ctx: ScenarioContext,
        params: { batchId: string; saleId: string; type: 'IN' | 'OUT' }
    ): Promise<AssertionResult> {
        const movement = await prisma.stockMovement.findFirst({
            where: {
                batchId: params.batchId,
                referenceId: params.saleId,
                movementType: params.type
            }
        });

        return {
            passed: movement !== null,
            expected: `StockMovement record with type=${params.type}`,
            actual: movement ? 'Movement recorded' : 'No movement found',
            message: 'Stock movement must be recorded for audit trail'
        };
    },

    /**
     * INV-009: FIFO allocation check
     */
    async checkFIFOAllocation(
        ctx: ScenarioContext,
        drugId: string,
        saleId: string
    ): Promise<AssertionResult> {
        // Get all batches for this drug, ordered by expiry
        const batches = await prisma.inventoryBatch.findMany({
            where: {
                storeId: ctx.storeId,
                drugId,
                deletedAt: null
            },
            orderBy: { expiryDate: 'asc' }
        });

        // Get sale items for this sale
        const saleItems = await prisma.saleItem.findMany({
            where: {
                saleId,
                batch: { drugId }
            },
            include: { batch: true }
        });

        if (saleItems.length === 0) {
            return {
                passed: true,
                expected: 'FIFO',
                actual: 'No items to check',
                message: 'FIFO check skipped (no items)'
            };
        }

        // Check if earliest expiring batches were used first
        const usedBatchIds = saleItems.map((si: any) => si.batchId);
        const earliestBatches = batches.slice(0, usedBatchIds.length);
        const usedEarliestFirst = earliestBatches.every((b: any) => usedBatchIds.includes(b.id));

        return {
            passed: usedEarliestFirst,
            expected: 'Earliest expiring batches used first',
            actual: usedBatchIds,
            message: 'Stock allocation must follow FIFO (First Expiry First Out)'
        };
    }
};

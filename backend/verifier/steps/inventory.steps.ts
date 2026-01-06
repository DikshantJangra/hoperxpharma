/**
 * Inventory Step Implementations
 * Steps for inventory management scenarios
 */

import { StepResult, BatchFixture, ScenarioContext } from '../types';

const inventoryService = require('../../src/services/inventory/inventoryService');
const prisma = require('../../src/db/prisma');

export const inventorySteps = {
    /**
     * Create a drug in the catalog
     */
    async createDrug(
        ctx: ScenarioContext,
        drugData: {
            name: string;
            genericName?: string;
            strength?: string;
            form?: string;
            manufacturer?: string;
            hsnCode?: string;
            gstRate?: number;
        }
    ): Promise<StepResult> {
        try {
            const drug = await inventoryService.createDrug({
                storeId: ctx.storeId,
                ...drugData,
                gstRate: drugData.gstRate ?? 12
            });

            ctx.set('testDrug', drug);

            return {
                success: true,
                data: drug,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Create inventory batch
     */
    async createBatch(
        ctx: ScenarioContext,
        batchData: BatchFixture
    ): Promise<StepResult> {
        try {
            const drugId = batchData.drugId || ctx.get<any>('testDrug')?.id;

            if (!drugId) {
                throw new Error('Drug ID required for batch creation');
            }

            const batch = await inventoryService.createBatch({
                storeId: ctx.storeId,
                drugId,
                batchNumber: batchData.batchNumber,
                expiryDate: batchData.expiryDate,
                quantityInStock: batchData.quantity,
                mrp: batchData.mrp,
                purchasePrice: batchData.purchasePrice,
                supplierId: batchData.supplierId,
                location: batchData.location
            });

            ctx.set('testBatch', batch);

            return {
                success: true,
                data: batch,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Ensure a batch exists with sufficient stock (create if needed)
     */
    async ensureBatchExists(
        ctx: ScenarioContext,
        params: {
            drugName: string;
            quantity: number;
            mrp: number;
            expiryMonths?: number;
        }
    ): Promise<any> {
        // Find or create drug
        let drug = await prisma.drug.findFirst({
            where: {
                storeId: ctx.storeId,
                name: { contains: params.drugName, mode: 'insensitive' }
            }
        });

        if (!drug) {
            drug = await prisma.drug.create({
                data: {
                    storeId: ctx.storeId,
                    name: params.drugName,
                    genericName: params.drugName,
                    form: 'Tablet',
                    gstRate: 12
                }
            });
        }

        // Find or create batch
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (params.expiryMonths || 12));

        const batchNumber = `DPFV-${Date.now()}`;

        let batch = await prisma.inventoryBatch.findFirst({
            where: {
                storeId: ctx.storeId,
                drugId: drug.id,
                quantityInStock: { gte: params.quantity },
                expiryDate: { gt: new Date() },
                deletedAt: null
            },
            include: { drug: true }
        });

        if (!batch) {
            batch = await prisma.inventoryBatch.create({
                data: {
                    storeId: ctx.storeId,
                    drugId: drug.id,
                    batchNumber,
                    expiryDate,
                    quantityInStock: params.quantity,
                    mrp: params.mrp,
                    purchasePrice: params.mrp * 0.8
                },
                include: { drug: true }
            });
        }

        return batch;
    },

    /**
     * Get batch by ID
     */
    async getBatch(ctx: ScenarioContext, batchId: string): Promise<any> {
        return prisma.inventoryBatch.findUnique({
            where: { id: batchId },
            include: { drug: true }
        });
    },

    /**
     * Adjust stock quantity
     */
    async adjustStock(
        ctx: ScenarioContext,
        params: {
            batchId: string;
            adjustment: number;
            reason: string;
        }
    ): Promise<StepResult> {
        try {
            const result = await inventoryService.adjustStock({
                batchId: params.batchId,
                quantityAdjusted: params.adjustment,
                reason: params.reason,
                userId: ctx.userId
            });

            return {
                success: true,
                data: result,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Get low stock alerts
     */
    async getLowStockAlerts(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const alerts = await inventoryService.getLowStockAlerts(ctx.storeId);
            ctx.set('lowStockAlerts', alerts);

            return {
                success: true,
                data: alerts,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Get expiring items
     */
    async getExpiringItems(
        ctx: ScenarioContext,
        daysAhead: number = 90
    ): Promise<StepResult> {
        try {
            const items = await inventoryService.getExpiringItems(ctx.storeId, daysAhead);
            ctx.set('expiringItems', items);

            return {
                success: true,
                data: items,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Ensure a test drug exists
     */
    async ensureTestDrugExists(ctx: ScenarioContext): Promise<StepResult> {
        return this.createDrug(ctx, {
            name: 'DPFV Test Drug ' + Date.now(),
            genericName: 'Test Generic',
            strength: '500mg',
            form: 'Tablet',
            manufacturer: 'Test Pharma',
            gstRate: 12
        });
    },

    /**
     * Verify stock deduction for a single batch
     * uses testBatch from context as baseline
     */
    async verifyOneBatchDeduction(
        ctx: ScenarioContext,
        params: {
            drugId: string;
            batchId: string;
            quantity: number;
        }
    ): Promise<StepResult> {
        try {
            const initialBatch = ctx.get<any>('testBatch');
            if (initialBatch.id !== params.batchId) {
                throw new Error('Context batch ID mismatch');
            }

            const currentBatch = await this.getBatch(ctx, params.batchId);
            const expectedStock = initialBatch.quantityInStock - params.quantity;

            const correct = currentBatch.quantityInStock === expectedStock;

            return {
                success: correct,
                data: {
                    initial: initialBatch.quantityInStock,
                    deduction: params.quantity,
                    expected: expectedStock,
                    actual: currentBatch.quantityInStock
                },
                duration: 0,
                error: correct ? undefined : new Error(
                    `Stock mismatch: expected ${expectedStock}, got ${currentBatch.quantityInStock}`
                )
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Verify stock deduction after sale
     */
    async verifyStockDeduction(
        ctx: ScenarioContext,
        params: {
            batchId: string;
            expectedDeduction: number;
            initialStock: number;
        }
    ): Promise<StepResult> {
        try {
            const batch = await this.getBatch(ctx, params.batchId);
            const expectedStock = params.initialStock - params.expectedDeduction;

            const correct = batch.quantityInStock === expectedStock;

            return {
                success: correct,
                data: {
                    expected: expectedStock,
                    actual: batch.quantityInStock,
                    deduction: params.expectedDeduction
                },
                duration: 0,
                error: correct ? undefined : new Error(
                    `Stock mismatch: expected ${expectedStock}, got ${batch.quantityInStock}`
                )
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    }
};

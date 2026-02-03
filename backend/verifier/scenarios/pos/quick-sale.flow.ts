/**
 * Quick Sale Flow Scenario
 * Validates POS quick sale with stock deduction
 */

import { Scenario } from '../../types';
import { authSteps } from '../../steps/auth.steps';
import { inventorySteps } from '../../steps/inventory.steps';
import { posSteps } from '../../steps/pos.steps';
import { inventoryAssert } from '../../assertions/inventory.assert';
import { financialAssert } from '../../assertions/financial.assert';

export const quickSaleScenario: Scenario = {
    id: 'pos.quick-sale',
    name: 'Quick Sale (Walk-in Customer)',
    description: 'Validates complete quick sale flow from cart to invoice with inventory deduction',
    dependsOn: ['core.onboarding'], // Needs store setup (which depends on auth)
    validatesFeatures: ['pos', 'inventory', 'gst', 'payments'],
    tags: ['critical', 'smoke'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'quick-sale.setup-stock',
            name: 'Ensure test drug has sufficient stock',
            execute: async (ctx) => {
                const batch = await inventorySteps.ensureBatchExists(ctx, {
                    drugName: 'Paracetamol 500mg',
                    quantity: 100,
                    mrp: 25.00,
                    expiryMonths: 12
                });

                ctx.set('testBatch', batch);
                ctx.set('initialStock', Number(batch.baseUnitQuantity));

                return {
                    success: true,
                    data: batch,
                    duration: 0
                };
            },
            assertions: [
                {
                    name: 'Stock is positive',
                    invariant: 'INV-001',
                    check: async (ctx) => {
                        const batch = ctx.get<any>('testBatch');
                        return {
                            passed: Number(batch.baseUnitQuantity) > 0,
                            expected: '> 0',
                            actual: batch.baseUnitQuantity,
                            message: 'Test batch must have positive stock'
                        };
                    }
                },
                {
                    name: 'Batch has valid expiry',
                    invariant: 'INV-001',
                    check: async (ctx) => {
                        const batch = ctx.get<any>('testBatch');
                        const isValid = new Date(batch.expiryDate) > new Date();
                        return {
                            passed: isValid,
                            expected: 'Future expiry date',
                            actual: batch.expiryDate,
                            message: 'Test batch must not be expired'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'quick-sale.create-sale',
            name: 'Create quick sale with payment',
            execute: async (ctx) => {
                const batch = ctx.get<any>('testBatch');

                return posSteps.createQuickSale(ctx, {
                    items: [{
                        drugId: batch.drugId,
                        batchId: batch.id,
                        quantity: 10,
                        mrp: parseFloat(batch.mrp),
                        discount: 5
                    }],
                    paymentMethod: 'CASH'
                });
            },
            assertions: [
                {
                    name: 'Sale created with ID',
                    invariant: 'SALE-001',
                    check: async (ctx) => {
                        const sale = ctx.get<any>('sale');
                        return {
                            passed: Boolean(sale && sale.id),
                            expected: 'Sale with ID',
                            actual: sale?.id || 'No sale',
                            message: 'Sale must be created with ID'
                        };
                    }
                },
                {
                    name: 'Invoice number generated',
                    invariant: 'SALE-001',
                    check: async (ctx) => {
                        const sale = ctx.get<any>('sale');
                        const hasInvoice = sale?.invoiceNumber && sale.invoiceNumber.length > 0;
                        return {
                            passed: Boolean(hasInvoice),
                            expected: 'Invoice number present',
                            actual: sale?.invoiceNumber || 'No invoice',
                            message: 'Invoice number must be generated'
                        };
                    }
                },
                {
                    name: 'Payment total matches sale total',
                    invariant: 'INV-002',
                    check: async (ctx) => financialAssert.checkPaymentTotal(ctx)
                }
            ],
            critical: true,
            timeout: 20000
        },

        {
            id: 'quick-sale.verify-stock-deduction',
            name: 'Verify inventory was deducted correctly',
            execute: async (ctx) => {
                const batch = ctx.get<any>('testBatch');
                const updatedBatch = await inventorySteps.getBatch(ctx, batch.id);
                ctx.set('updatedBatch', updatedBatch);

                return {
                    success: true,
                    data: updatedBatch,
                    duration: 0
                };
            },
            assertions: [
                {
                    name: 'Stock deducted by sold quantity',
                    invariant: 'INV-001',
                    check: async (ctx) => {
                        const initialStock = ctx.get<number>('initialStock');
                        const updatedBatch = ctx.get<any>('updatedBatch');
                        const soldQty = 10;
                        const expectedStock = initialStock - soldQty;

                        return {
                            passed: Number(updatedBatch.baseUnitQuantity) === expectedStock,
                            expected: expectedStock,
                            actual: updatedBatch.baseUnitQuantity,
                            message: 'Stock must be deducted by exact sold quantity'
                        };
                    }
                },
                {
                    name: 'Stock never negative',
                    invariant: 'INV-001',
                    check: async (ctx) => {
                        const batch = ctx.get<any>('updatedBatch');
                        return inventoryAssert.checkNonNegativeStock(ctx, batch.id);
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },

        {
            id: 'quick-sale.verify-sale-retrieval',
            name: 'Verify sale can be retrieved',
            execute: async (ctx) => {
                return posSteps.getSaleById(ctx);
            },
            assertions: [
                {
                    name: 'Sale items match cart',
                    invariant: 'SALE-001',
                    check: async (ctx) => {
                        const sale = ctx.get<any>('fetchedSale');
                        const batch = ctx.get<any>('testBatch');

                        const hasItems = sale.items && sale.items.length > 0;
                        const correctDrug = sale.items?.some((i: any) =>
                            i.drugId === batch.drugId && i.quantity === 10
                        );

                        return {
                            passed: Boolean(hasItems && correctDrug),
                            expected: { drugId: batch.drugId, quantity: 10 },
                            actual: sale.items?.map((i: any) => ({ drugId: i.drugId, qty: i.quantity })),
                            message: 'Sale items must match what was in cart'
                        };
                    }
                }
            ],
            critical: false,
            timeout: 5000
        }
    ]
};

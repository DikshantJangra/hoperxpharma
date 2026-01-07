/**
 * Prescription Sale Scenario
 * Validates the flow: Prescription -> Dispense -> Sale -> Invoice
 */

import { Scenario } from '../../types';
import { posSteps } from '../../steps/pos.steps';
import { dispenseSteps } from '../../steps/dispense.steps';
import { inventorySteps } from '../../steps/inventory.steps';
import { financialAssert } from '../../assertions/financial.assert';
import { inventoryAssert } from '../../assertions/inventory.assert';

export const rxSaleScenario: Scenario = {
    id: 'pos.rx-sale',
    name: 'Prescription Sale Flow',
    description: 'Validates completion of sale from a processed dispense',
    dependsOn: ['clinical.dispense'], // Needs a READY dispense
    validatesFeatures: ['pos', 'clinical', 'inventory'],
    tags: ['critical', 'pos'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'rx-sale.create',
            name: 'Create sale from dispense',
            execute: async (ctx) => {
                const dispense = ctx.get<any>('dispense'); // Should be READY from previous scenario
                const drug = ctx.get<any>('testDrug');

                // Simulate POS loading the dispense
                return posSteps.createQuickSale(ctx, {
                    patientId: dispense.refill.prescription.patientId,
                    items: [{
                        drugId: drug.id,
                        batchId: ctx.get<any>('testBatch').id,
                        quantity: 30,
                        mrp: 100, // Dummy MRP
                        discount: 0
                    }],
                    paymentMethod: 'CASH'
                });
            },
            assertions: [
                {
                    name: 'Sale created',
                    invariant: 'SALE-001',
                    check: async (ctx) => {
                        const s = ctx.get<any>('sale');
                        return {
                            passed: Boolean(s && s.id),
                            message: 'Sale must be created',
                            expected: 'Sale object',
                            actual: s ? 'Created' : 'Null'
                        };
                    }
                },
                {
                    name: 'Invoice generated',
                    invariant: 'SALE-002',
                    check: async (ctx) => {
                        const sale = ctx.get<any>('sale');
                        return {
                            passed: Boolean(sale && sale.invoiceNumber),
                            message: 'Invoice number generated',
                            expected: 'Invoice number',
                            actual: sale?.invoiceNumber || 'None'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 20000
        },

        {
            id: 'rx-sale.complete-dispense',
            name: 'Mark dispense as COMPLETED',
            execute: async (ctx) => dispenseSteps.updateStatus(ctx, 'COMPLETED'),
            assertions: [
                {
                    name: 'Dispense status is COMPLETED',
                    invariant: 'DISP-004',
                    check: async (ctx) => {
                        const d = ctx.get<any>('dispense');
                        return {
                            passed: Boolean(d.status === 'COMPLETED'),
                            message: 'Dispense status must be COMPLETED',
                            expected: 'COMPLETED',
                            actual: d.status
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'rx-sale.verify-stock',
            name: 'Verify inventory deduction',
            execute: async (ctx) => {
                // Refresh batch to get current stock
                const inventorySteps = require('../../steps/inventory.steps').inventorySteps;
                const batch = await inventorySteps.getBatch(ctx, ctx.get<any>('testBatch').id);
                ctx.set('currentBatch', batch);
                return { success: true, data: batch, duration: 0 };
            },
            assertions: [
                {
                    name: 'Stock remains non-negative',
                    invariant: 'INV-001',
                    check: async (ctx) => inventoryAssert.checkNonNegativeStock(ctx, ctx.get<any>('testBatch').id)
                }
            ],
            critical: true,
            timeout: 5000
        }
    ]
};

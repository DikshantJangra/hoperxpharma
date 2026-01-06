/**
 * Purchase Order Flow Scenario
 * Validates PO creation, approval, and sending
 */

import { Scenario } from '../../types';
import { procurementSteps } from '../../steps/procurement.steps';
import { inventorySteps } from '../../steps/inventory.steps';

export const poScenario: Scenario = {
    id: 'procurement.po',
    name: 'Purchase Order Flow',
    description: 'Validates PO lifecycle (Draft -> Approved -> Sent)',
    dependsOn: ['procurement.supplier'],
    validatesFeatures: ['procurement', 'po'],
    tags: ['critical', 'procurement'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'po.setup-drug',
            name: 'Ensure drug exists for PO',
            execute: async (ctx) => inventorySteps.createDrug(ctx, {
                name: `PO Test Drug ${Date.now()}`,
                gstRate: 12,
                manufacturer: 'Cipla'
            }),
            assertions: [],
            critical: true,
            timeout: 5000
        },

        {
            id: 'po.create',
            name: 'Create Draft PO',
            execute: async (ctx) => {
                const drug = ctx.get<any>('testDrug');
                return procurementSteps.createPurchaseOrder(ctx, {
                    items: [{
                        drugId: drug.id,
                        quantity: 100,
                        unitPrice: 50.00,
                        gstPercent: 12
                    }]
                });
            },
            assertions: [
                {
                    name: 'PO logic sums correctly',
                    invariant: 'INV-007',
                    check: async (ctx) => {
                        const po = ctx.get<any>('purchaseOrder');
                        // 100 * 50 = 5000 base
                        // 12% tax = 600
                        // Total = 5600
                        return {
                            passed: po && Math.abs(po.total - 5600) < 0.1,
                            message: 'PO Total match',
                            expected: 5600,
                            actual: po?.total
                        };
                    }
                },
                {
                    name: 'Status is DRAFT',
                    invariant: 'STATE-001',
                    check: async (ctx) => {
                        const po = ctx.get<any>('purchaseOrder');
                        return { passed: po.status === 'DRAFT', expected: 'DRAFT', actual: po.status, message: 'Initial status DRAFT' };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },

        {
            id: 'po.approve',
            name: 'Approve PO',
            execute: async (ctx) => procurementSteps.approvePurchaseOrder(ctx),
            assertions: [
                {
                    name: 'Status is APPROVED',
                    invariant: 'STATE-002',
                    check: async (ctx) => {
                        const po = ctx.get<any>('purchaseOrder'); // Updated in context by step
                        return { passed: po.status === 'APPROVED', expected: 'APPROVED', actual: po.status, message: 'Status -> APPROVED' };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },

        {
            id: 'po.send',
            name: 'Send PO',
            execute: async (ctx) => procurementSteps.sendPurchaseOrder(ctx),
            assertions: [
                {
                    name: 'Status is SENT',
                    invariant: 'STATE-003',
                    check: async (ctx) => {
                        const po = ctx.get<any>('purchaseOrder');
                        return { passed: po.status === 'SENT', expected: 'SENT', actual: po.status, message: 'Status -> SENT' };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        }
    ]
};

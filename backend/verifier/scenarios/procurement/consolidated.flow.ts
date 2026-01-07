/**
 * Consolidated Invoice Scenario
 * Validates aggregation of multiple GRNs into a single invoice
 */

import { Scenario } from '../../types';
import { procurementSteps } from '../../steps/procurement.steps';
import { authSteps } from '../../steps/auth.steps';
import { inventorySteps } from '../../steps/inventory.steps';
// Removing dsl import as it is not used/found

const onboardingService = require('../../../src/services/onboarding/onboardingService');

export const consolidatedInvoiceScenario: Scenario = {
    id: 'procurement.consolidated',
    name: 'Consolidated Invoice Flow',
    description: 'Validates creating and consolidating multiple GRNs',
    dependsOn: [],
    validatesFeatures: ['procurement', 'grn', 'billing'],
    tags: ['procurement', 'billing'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'consolidated.setup',
            name: 'Setup for Consolidation',
            execute: async (ctx) => {
                // 1. User
                const timestamp = Date.now();
                const signupResult = await authSteps.signup(ctx, {
                    email: `consol-${timestamp}@test.hoperx.com`,
                    password: 'password123',
                    firstName: 'Consol',
                    lastName: 'Tester',
                    phoneNumber: `9${timestamp.toString().slice(-9)}`
                });
                if (!signupResult.success) return signupResult;

                // 2. Store
                const userId = ctx.userId;
                const result = await onboardingService.completeOnboarding({
                    store: {
                        name: `Consol Store ${timestamp}`,
                        displayName: `Consol Store`,
                        email: `consol-store-${timestamp}@test.hoperx.com`,
                        phoneNumber: `9${timestamp.toString().slice(-9)}`,
                        businessType: 'Retail Pharmacy'
                    } as any,
                    licenses: [],
                    operatingHours: [],
                    suppliers: [],
                    users: []
                }, userId);
                ctx.set('onboardingResult', result);
                ctx.set('currentStore', result.store);
                ctx.storeId = result.store.id;
                ctx.set('storeId', result.store.id);

                // 3. Supplier
                const suppRes = await procurementSteps.createSupplier(ctx, {
                    name: `Consol Supplier ${timestamp}`,
                    category: 'Distributor',
                    contactName: 'John Doe',
                    phoneNumber: '9876543210',
                    addressLine1: '123 Supply Lane',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pinCode: '400001',
                    gstin: '27ABCDE1234F1Z5'
                });
                if (!suppRes.success) return suppRes;

                // 4. Drug - Use correct method ensuredTestDrugExists
                const drugRes = await inventorySteps.ensureTestDrugExists(ctx);
                if (!drugRes.success) return drugRes;
                ctx.set('consolDrug', drugRes.data);

                return { success: true, duration: 0 };
            },
            assertions: [],
            critical: true,
            timeout: 10000
        },
        {
            id: 'consolidated.create-grn-1',
            name: 'Create First GRN',
            execute: async (ctx) => {
                const drug = ctx.get<any>('consolDrug');

                // Create PO
                const poRes = await procurementSteps.createPurchaseOrder(ctx, {
                    items: [{ drugId: drug.id, quantity: 10, unitPrice: 80 }]
                });
                if (!poRes.success) return poRes;

                // Send PO
                await procurementSteps.sendPurchaseOrder(ctx);

                // Initialize GRN
                await procurementSteps.initializeGRN(ctx);

                // Update GRN Items
                const grn = ctx.get<any>('grn');
                await procurementSteps.updateReceivingDetails(ctx, {
                    itemId: grn.items[0].id,
                    receivedQty: 10,
                    batchNumber: 'B1',
                    expiryDate: new Date('2026-01-01'),
                    mrp: 100
                });

                // Complete GRN
                const compRes = await procurementSteps.completeGRN(ctx, {
                    supplierInvoiceNo: `INV-1-${Date.now()}`
                });

                // Save GRN ID - Type casting fix
                const grnIds = ctx.get<string[]>('grnIdsToConsolidate') || [];
                grnIds.push((compRes.data as any).id);
                ctx.set('grnIdsToConsolidate', grnIds);

                return compRes;
            },
            assertions: [],
            critical: true,
            timeout: 5000
        },
        {
            id: 'consolidated.create-grn-2',
            name: 'Create Second GRN',
            execute: async (ctx) => {
                const drug = ctx.get<any>('consolDrug');

                // Create PO
                const poRes = await procurementSteps.createPurchaseOrder(ctx, {
                    items: [{ drugId: drug.id, quantity: 5, unitPrice: 80 }]
                });
                if (!poRes.success) return poRes;

                // Send PO
                await procurementSteps.sendPurchaseOrder(ctx);

                // Initialize GRN
                await procurementSteps.initializeGRN(ctx);
                const grn = ctx.get<any>('grn');

                // Update GRN Items
                await procurementSteps.updateReceivingDetails(ctx, {
                    itemId: grn.items[0].id,
                    receivedQty: 5,
                    batchNumber: 'B2',
                    expiryDate: new Date('2026-01-01'),
                    mrp: 100
                });

                // Complete GRN
                const compRes = await procurementSteps.completeGRN(ctx, {
                    supplierInvoiceNo: `INV-2-${Date.now()}`
                });

                // Save GRN ID
                const grnIds = ctx.get<string[]>('grnIdsToConsolidate') || [];
                grnIds.push((compRes.data as any).id);
                ctx.set('grnIdsToConsolidate', grnIds);

                return compRes;
            },
            assertions: [],
            critical: true,
            timeout: 5000
        },
        {
            id: 'consolidated.generate',
            name: 'Generate Consolidated Invoice',
            execute: async (ctx) => {
                // Ignore type check for dynamically added method
                return (procurementSteps as any).createConsolidatedInvoice(ctx);
            },
            assertions: [
                {
                    name: 'Invoice Created',
                    invariant: 'INV-007',
                    check: async (ctx) => {
                        const invoice = ctx.get<any>('consolidatedInvoice');
                        return {
                            passed: !!invoice && invoice.grns.length === 2,
                            message: 'Invoice created with 2 GRNs',
                            expected: 2,
                            actual: invoice?.grns?.length
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        }
    ]
};

/**
 * Sale Refund Scenario
 * Validates sale refund process
 */

import { Scenario } from '../../types';
import { posSteps } from '../../steps/pos.steps';
import { inventorySteps } from '../../steps/inventory.steps';
import { authSteps } from '../../steps/auth.steps';

const onboardingService = require('../../../src/services/onboarding/onboardingService');

export const refundScenario: Scenario = {
    id: 'pos.refund',
    name: 'Sale Refund Flow',
    description: 'Validates refunding a completed sale',
    dependsOn: [],
    validatesFeatures: ['pos', 'refund', 'inventory'],
    tags: ['pos', 'regression'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'refund.setup',
            name: 'Setup for Refund',
            execute: async (ctx) => {
                // 1. Create User
                const timestamp = Date.now();
                const signupResult = await authSteps.signup(ctx, {
                    email: `refund-${timestamp}@test.hoperx.com`,
                    password: 'password123',
                    firstName: 'Refund',
                    lastName: 'Tester',
                    phoneNumber: `9${timestamp.toString().slice(-9)}`
                });
                if (!signupResult.success) return signupResult;

                // 2. Create Store
                const userId = ctx.userId;
                try {
                    const result = await onboardingService.completeOnboarding({
                        store: {
                            name: `Refund Store ${timestamp}`,
                            displayName: `Refund Store`,
                            email: `refund-store-${timestamp}@test.hoperx.com`,
                            phoneNumber: `9${timestamp.toString().slice(-9)}`,
                            businessType: 'Retail Pharmacy'
                        } as any,
                        licenses: [],
                        operatingHours: [],
                        suppliers: [],
                        users: []
                    }, userId);
                    ctx.set('currentStore', result.store);
                    // Need batch for sale
                    const batch = await inventorySteps.ensureBatchExists(ctx, {
                        drugName: 'Refundable Drug',
                        quantity: 10,
                        mrp: 100
                    });
                    ctx.set('refundBatch', batch);
                    return { success: true, duration: 0 };
                } catch (error: any) {
                    return { success: false, error, duration: 0 };
                }
            },
            assertions: [],
            critical: true,
            timeout: 10000
        },
        {
            id: 'refund.create-sale',
            name: 'Create Sale to Refund',
            execute: async (ctx) => {
                const batch = ctx.get<any>('refundBatch');
                return posSteps.createQuickSale(ctx, {
                    items: [{
                        drugId: batch.drugId,
                        batchId: batch.id,
                        quantity: 2,
                        mrp: 100,
                        discount: 0
                    }],
                    paymentMethod: 'CASH'
                });
            },
            assertions: [],
            critical: true,
            timeout: 5000
        },
        {
            id: 'refund.process',
            name: 'Process Refund',
            execute: async (ctx) => {
                const sale = ctx.get<any>('sale');
                return posSteps.processRefund(ctx, sale.id);
            },
            assertions: [
                {
                    name: 'Refund Completed',
                    invariant: 'REF-001',
                    check: async (ctx) => {
                        const refund = ctx.get<any>('refund');
                        return {
                            passed: refund.status === 'COMPLETED',
                            message: 'Refund status is COMPLETED',
                            expected: 'COMPLETED',
                            actual: refund.status
                        };
                    }
                }
            ],

            critical: true,
            timeout: 5000
        }
    ]
};

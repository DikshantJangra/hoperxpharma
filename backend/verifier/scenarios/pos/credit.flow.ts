/**
 * Credit Sale Scenario
 * Validates purchasing on credit and ledger updates
 */

import { Scenario } from '../../types';
import { posSteps } from '../../steps/pos.steps';
import { patientSteps } from '../../steps/patient.steps';
import { inventorySteps } from '../../steps/inventory.steps';
import { authSteps } from '../../steps/auth.steps';

const onboardingService = require('../../../src/services/onboarding/onboardingService');

export const creditSaleScenario: Scenario = {
    id: 'pos.credit',
    name: 'Credit Sale Flow',
    description: 'Validates sale on credit, patient balance update, and ledger entry',
    dependsOn: [],
    validatesFeatures: ['pos', 'credit', 'ledger', 'patient'],
    tags: ['pos', 'credit', 'financial'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'credit.setup',
            name: 'Setup for Credit Sale',
            execute: async (ctx) => {
                // 1. Create unique user
                const timestamp = Date.now();
                const signupResult = await authSteps.signup(ctx, {
                    email: `credit-${timestamp}@test.hoperx.com`,
                    password: 'password123',
                    firstName: 'Credit',
                    lastName: 'Tester',
                    phoneNumber: `9${timestamp.toString().slice(-9)}`
                });
                if (!signupResult.success) return signupResult;

                // 2. Create Store
                const userId = ctx.userId;
                try {
                    const result = await onboardingService.completeOnboarding({
                        store: {
                            name: `Credit Store ${timestamp}`,
                            displayName: `Credit Store`,
                            email: `credit-store-${timestamp}@test.hoperx.com`,
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

                    // 3. Create Patient
                    const patientRes = await patientSteps.createPatient(ctx, {
                        firstName: 'Credit',
                        lastName: 'Customer',
                        phoneNumber: `8${timestamp.toString().slice(-9)}`
                    });
                    if (!patientRes.success) return patientRes;

                    // 4. Create Batch
                    const batch = await inventorySteps.ensureBatchExists(ctx, {
                        drugName: 'Credit Drug',
                        quantity: 10,
                        mrp: 100
                    });
                    ctx.set('creditBatch', batch);

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
            id: 'credit.verify-initial-balance',
            name: 'Verify Initial Balance',
            execute: async (ctx) => {
                return patientSteps.verifyPatientBalance(ctx, 0);
            },
            assertions: [],
            critical: true,
            timeout: 2000
        },
        {
            id: 'credit.create-sale',
            name: 'Create Sale on Credit',
            execute: async (ctx) => {
                const batch = ctx.get<any>('creditBatch');
                const patientId = ctx.get<string>('patientId');

                // Sale Amount = 100 * 2 = 200
                return posSteps.createQuickSale(ctx, {
                    items: [{
                        drugId: batch.drugId,
                        batchId: batch.id,
                        quantity: 2,
                        mrp: 100,
                        discount: 0
                    }],
                    paymentMethod: 'CREDIT',
                    patientId: patientId // Required for credit
                });
            },
            assertions: [
                {
                    name: 'Sale Balance Updated',
                    invariant: 'SALE-002',
                    check: async (ctx) => {
                        const sale = ctx.get<any>('sale');
                        return {
                            passed: Number(sale.balance) === Number(sale.total) && sale.paymentStatus === 'UNPAID', // Full credit = UNPAID status usually? Wait, sale repo says logic: creditAmount < total ? PARTIAL : UNPAID ... wait.
                            // If creditAmount == total (full credit), logic says: 
                            // const paymentStatus = creditAmount < totalAmount ? 'PARTIAL' : 'UNPAID';
                            // Wait, if I pay fully by credit, is it UNPAID? Yes, effectively "Debt".
                            message: 'Sale balance matches total (UNPAID)',
                            expected: true,
                            actual: Number(sale.balance) === Number(sale.total)
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },
        {
            id: 'credit.verify-final-balance',
            name: 'Verify Patient Balance Updated',
            execute: async (ctx) => {
                // Should differ by 200
                return patientSteps.verifyPatientBalance(ctx, 200);
            },
            assertions: [],
            critical: true,
            timeout: 2000
        },
        {
            id: 'credit.verify-ledger',
            name: 'Verify Audit Ledger Entry',
            execute: async (ctx) => {
                return patientSteps.getPatientLedger(ctx);
            },
            assertions: [
                {
                    name: 'Ledger Entry Exists',
                    invariant: 'LEDGER-001',
                    check: async (ctx) => {
                        const entries = ctx.get<any[]>('patientLedger');
                        const sale = ctx.get<any>('sale');

                        const entry = entries[0]; // Latest
                        return {
                            // Check latest entry is DEBIT 200 for this sale
                            passed: entry && entry.type === 'DEBIT' && Number(entry.amount) === 200 && entry.referenceId === sale.id,
                            message: 'Ledger entry is correct DEBIT',
                            expected: 'DEBIT 200',
                            actual: entry ? `${entry.type} ${Number(entry.amount)}` : 'None'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 2000
        }
    ]
};

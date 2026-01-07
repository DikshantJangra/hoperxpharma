/**
 * Invoice PDF Scenario
 * Validates generation of sales invoice PDF
 */

import { Scenario } from '../../types';
import { posSteps } from '../../steps/pos.steps';
import { documentSteps } from '../../steps/documents.steps';
import { authSteps } from '../../steps/auth.steps';
import { inventorySteps } from '../../steps/inventory.steps';

const onboardingService = require('../../../src/services/onboarding/onboardingService');

export const invoicePdfScenario: Scenario = {
    id: 'documents.invoice-pdf',
    name: 'Invoice PDF Generation Flow',
    description: 'Validates creation of a sale and generation of its invoice PDF',
    dependsOn: [],
    validatesFeatures: ['pos', 'pdf', 'documents'],
    tags: ['documents', 'pos', 'smoke'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'pdf.setup',
            name: 'Setup for PDF Test',
            execute: async (ctx) => {
                // 1. Create User
                const timestamp = Date.now();
                const signupResult = await authSteps.signup(ctx, {
                    email: `pdf-${timestamp}@test.hoperx.com`,
                    password: 'password123',
                    firstName: 'PDF',
                    lastName: 'Tester',
                    phoneNumber: `9${timestamp.toString().slice(-9)}`
                });
                if (!signupResult.success) return signupResult;

                // 2. Create Store
                const userId = ctx.userId;
                try {
                    const result = await onboardingService.completeOnboarding({
                        store: {
                            name: `PDF Store ${timestamp}`,
                            displayName: `PDF Store`,
                            email: `pdf-store-${timestamp}@test.hoperx.com`,
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

                    // 3. Ensure Batch
                    const batch = await inventorySteps.ensureBatchExists(ctx, {
                        drugName: 'PDF Drug',
                        quantity: 10,
                        mrp: 50
                    });
                    ctx.set('pdfBatch', batch);

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
            id: 'pdf.create-sale',
            name: 'Create Sale for Invoice',
            execute: async (ctx) => {
                const batch = ctx.get<any>('pdfBatch');
                return posSteps.createQuickSale(ctx, {
                    items: [{
                        drugId: batch.drugId,
                        batchId: batch.id,
                        quantity: 1,
                        mrp: 50,
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
            id: 'pdf.generate',
            name: 'Generate Invoice PDF',
            execute: async (ctx) => {
                return documentSteps.generateInvoicePdf(ctx); // usage: checks 'sale' in context
            },
            assertions: [
                {
                    name: 'PDF Generated',
                    invariant: 'SALE-001',
                    check: async (ctx) => {
                        const buffer = ctx.get<Buffer>('pdfBuffer');
                        return {
                            passed: Buffer.isBuffer(buffer) && buffer.length > 1000,
                            message: 'PDF buffer exists and > 1KB',
                            expected: '> 1000 bytes',
                            actual: buffer ? `${buffer.length} bytes` : 'null'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        }
    ]
};

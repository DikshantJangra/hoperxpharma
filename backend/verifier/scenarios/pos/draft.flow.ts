/**
 * Sale Draft Scenario
 * Validates creating and retrieving sale drafts
 */

import { Scenario } from '../../types';
import { posSteps } from '../../steps/pos.steps';
import { inventorySteps } from '../../steps/inventory.steps';
import { authSteps } from '../../steps/auth.steps';

const onboardingService = require('../../../src/services/onboarding/onboardingService');

export const draftScenario: Scenario = {
    id: 'pos.draft',
    name: 'Sale Draft Workflow',
    description: 'Validates creation and retrieval of sale drafts',

    dependsOn: [], // Self-contained for now
    validatesFeatures: ['pos', 'drafts'],
    tags: ['pos', 'regression'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'draft.setup',
            name: 'Setup for Drafts',
            execute: async (ctx) => {
                // 1. Create User
                const timestamp = Date.now();
                const signupResult = await authSteps.signup(ctx, {
                    email: `draft-user-${timestamp}@test.hoperx.com`,
                    password: 'password123',
                    firstName: 'Draft',
                    lastName: 'User',
                    phoneNumber: `9${timestamp.toString().slice(-9)}`
                });

                if (!signupResult.success) return signupResult;

                // 2. Create Store
                const userId = ctx.userId;
                try {
                    const result = await onboardingService.completeOnboarding({
                        store: {
                            name: `Draft Test Store ${timestamp}`,
                            displayName: `Draft Store`,
                            email: `draft-store-${timestamp}@test.hoperx.com`,
                            phoneNumber: `9${timestamp.toString().slice(-9)}`,
                            businessType: 'Retail Pharmacy',
                            addressLine1: 'Draft Lane',
                            city: 'Mumbai',
                            state: 'MH',
                            pinCode: '400001'
                        },
                        licenses: [],
                        operatingHours: [],
                        suppliers: [],
                        users: []
                    }, userId);

                    ctx.set('onboardingResult', result);
                    ctx.set('currentStore', result.store);

                    return { success: true, duration: 0, data: result };
                } catch (error: any) {
                    return { success: false, error, duration: 0 };
                }
            },
            assertions: [],
            critical: true,
            timeout: 10000
        },
        {
            id: 'draft.create',
            name: 'Create Sale Draft',
            execute: async (ctx) => {
                // 1. Ensure stock
                const batch = await inventorySteps.ensureBatchExists(ctx, {
                    drugName: 'Draft Drug',
                    quantity: 10,
                    mrp: 50,
                    expiryMonths: 6
                });

                // 2. Create Draft
                const draftResult = await posSteps.createDraft(ctx, {
                    items: [{
                        drugId: batch.drugId,
                        batchId: batch.id,
                        quantity: 1,
                        mrp: 50,
                        discount: 0
                    }],
                    patientId: undefined // Guest
                });

                if (!draftResult.success || !draftResult.data) {
                    throw new Error('Failed to create draft: ' + (draftResult.error?.message || 'Unknown error'));
                }

                ctx.set('draft', draftResult.data);
                return { success: true, duration: 0, data: draftResult.data };
            },
            assertions: [],
            critical: true,
            timeout: 5000
        }
    ]
};

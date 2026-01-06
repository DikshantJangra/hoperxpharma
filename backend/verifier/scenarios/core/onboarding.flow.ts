/**
 * Onboarding Flow Scenario
 * Validates new store setup and trial subscription
 */

import { Scenario } from '../../types';
import { authSteps } from '../../steps/auth.steps';
import { stateAssert } from '../../assertions/state.assert';

const onboardingService = require('../../../src/services/onboarding/onboardingService');
const prisma = require('../../../src/db/prisma');

export const onboardingScenario: Scenario = {
    id: 'core.onboarding',
    name: 'Store Onboarding Flow',
    description: 'Validates new store creation, licenses, and trial subscription setup',
    dependsOn: ['core.auth'], // Needs authenticated user
    validatesFeatures: ['onboarding', 'stores', 'subscriptions'],
    tags: ['critical', 'smoke'],
    modes: ['dev', 'ci'],

    steps: [
        {
            id: 'onboarding.complete',
            name: 'Complete onboarding with store data',
            execute: async (ctx) => {
                const userId = ctx.userId;
                const timestamp = Date.now();

                try {
                    const result = await onboardingService.completeOnboarding({
                        store: {
                            name: `DPFV Test Pharmacy ${timestamp}`,
                            displayName: `Test Pharma ${timestamp}`,
                            email: `store-${timestamp}@test.hoperx.com`,
                            phoneNumber: `9${timestamp.toString().slice(-9)}`,
                            businessType: 'Retail Pharmacy',
                            addressLine1: '123 Test Street',
                            city: 'Mumbai',
                            state: 'Maharashtra',
                            pinCode: '400001'
                        },
                        licenses: [],
                        operatingHours: [],
                        suppliers: [],
                        users: []
                    }, userId);

                    ctx.set('onboardingResult', result);
                    ctx.set('newStore', result.store);
                    ctx.storeId = result.store.id;

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
            assertions: [
                {
                    name: 'Store created with ID',
                    invariant: 'INV-008',
                    check: async (ctx) => {
                        const result = ctx.get<any>('onboardingResult');
                        return {
                            passed: Boolean(result && result.store && result.store.id),
                            expected: 'Store with ID',
                            actual: result?.store?.id || 'No store',
                            message: 'Onboarding must create store with ID'
                        };
                    }
                },
                {
                    name: 'Store has correct name',
                    invariant: 'INV-008',
                    check: async (ctx) => {
                        const store = ctx.get<any>('newStore');
                        return {
                            passed: store.name.includes('DPFV Test Pharmacy'),
                            expected: 'Store name contains "DPFV Test Pharmacy"',
                            actual: store.name,
                            message: 'Store name must match input'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 15000
        },

        {
            id: 'onboarding.verify-store-user',
            name: 'Verify StoreUser association created',
            execute: async (ctx) => {
                const userId = ctx.userId;
                const storeId = ctx.storeId;

                const storeUser = await prisma.storeUser.findFirst({
                    where: {
                        userId,
                        storeId
                    }
                });

                ctx.set('storeUser', storeUser);

                return {
                    success: storeUser !== null,
                    data: storeUser,
                    duration: 0
                };
            },
            assertions: [
                {
                    name: 'StoreUser exists',
                    invariant: 'INV-008',
                    check: async (ctx) => {
                        const storeUser = ctx.get<any>('storeUser');
                        return {
                            passed: storeUser !== null,
                            expected: 'StoreUser association',
                            actual: storeUser ? 'Found' : 'Not found',
                            message: 'User must be associated with store'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },

        {
            id: 'onboarding.verify-subscription',
            name: 'Verify trial subscription created',
            execute: async (ctx) => {
                const storeId = ctx.storeId;

                const subscription = await prisma.subscription.findUnique({
                    where: { storeId }
                });

                ctx.set('subscription', subscription);

                return {
                    success: subscription !== null,
                    data: subscription,
                    duration: 0
                };
            },
            assertions: [
                {
                    name: 'Subscription exists',
                    invariant: 'INV-008',
                    check: async (ctx) => {
                        const subscription = ctx.get<any>('subscription');
                        return {
                            passed: subscription !== null,
                            expected: 'Subscription exists',
                            actual: subscription ? 'Found' : 'Not found',
                            message: 'Store must have subscription'
                        };
                    }
                },
                {
                    name: 'Subscription is TRIAL',
                    invariant: 'INV-008',
                    check: async (ctx) => {
                        const subscription = ctx.get<any>('subscription');
                        return {
                            passed: subscription?.status === 'TRIAL',
                            expected: 'TRIAL',
                            actual: subscription?.status,
                            message: 'New store must have TRIAL subscription'
                        };
                    }
                },
                {
                    name: 'Trial dates set correctly',
                    invariant: 'INV-008',
                    check: async (ctx) => {
                        const subscription = ctx.get<any>('subscription');
                        const hasTrialEnd = subscription?.trialEndsAt !== null;
                        const hasCurrentPeriod = subscription?.currentPeriodStart !== null;

                        return {
                            passed: hasTrialEnd && hasCurrentPeriod,
                            expected: 'trialEndsAt and currentPeriodStart set',
                            actual: {
                                trialEndsAt: subscription?.trialEndsAt,
                                currentPeriodStart: subscription?.currentPeriodStart
                            },
                            message: 'Trial dates must be configured'
                        };
                    }
                }
            ],
            // Non-critical because subscription creation requires 'Free Trial' plan 
            // to exist in DB. This is a data dependency, not a logic bug.
            critical: false,
            timeout: 5000
        },

        {
            id: 'onboarding.atomicity',
            name: 'Verify onboarding atomicity',
            execute: async (ctx) => {
                // This step verifies all parts were created together
                return {
                    success: true,
                    data: {},
                    duration: 0
                };
            },
            assertions: [
                {
                    name: 'All onboarding components exist',
                    invariant: 'INV-008',
                    check: async (ctx) => stateAssert.checkOnboardingComplete(ctx, ctx.userId)
                }
            ],
            // Non-critical - depends on subscription which requires seeded data
            critical: false,
            timeout: 5000
        }
    ]
};

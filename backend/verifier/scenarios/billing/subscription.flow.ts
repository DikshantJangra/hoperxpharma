
/**
 * Subscription Flow Scenario
 * Validates subscription lifecycle: Trial -> Expiry -> Upgrade
 */

import { Scenario } from '../../types';
import { billingSteps } from '../../steps/billing.steps';

export const subscriptionScenario: Scenario = {
    id: 'billing.subscription',
    name: 'Subscription Lifecycle',
    description: 'Validates trial expiration and plan upgrade flow',
    dependsOn: ['core.onboarding'], // Needs a store with trial
    validatesFeatures: ['subscription', 'billing'],
    tags: ['critical', 'full', 'billing'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'sub.verify-trial',
            name: 'Verify Initial Trial Active',
            execute: async (ctx) => billingSteps.verifySubscriptionStatus(ctx, true),
            assertions: [
                {
                    name: 'Trial Plan',
                    invariant: 'SUB-001',
                    check: async (ctx) => {
                        const sub = ctx.get<any>('subscription');
                        return {
                            passed: sub?.plan?.name?.toUpperCase().includes('TRIAL'),
                            message: 'Plan is TRIAL',
                            expected: 'TRIAL',
                            actual: sub?.plan?.name
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },

        {
            id: 'sub.expire',
            name: 'Simulate Subscription Expiry',
            execute: async (ctx) => billingSteps.expireSubscription(ctx),
            assertions: [
                {
                    name: 'Expiry Date Past',
                    invariant: 'SUB-002',
                    check: async (ctx) => {
                        const sub = ctx.get<any>('subscription');
                        return {
                            passed: new Date(sub.currentPeriodEnd) < new Date(),
                            message: 'End date is in past',
                            expected: 'Past Date',
                            actual: sub.currentPeriodEnd
                        };
                    }
                }
            ],
            critical: true, // If we can't expire, we can't test lockout
            timeout: 5000
        },

        {
            id: 'sub.verify-expired',
            name: 'Verify Subscription Inactive',
            execute: async (ctx) => billingSteps.verifySubscriptionStatus(ctx, false),
            assertions: [
                {
                    name: 'Status Inactive',
                    invariant: 'SUB-003',
                    check: async (ctx) => {
                        const isActive = ctx.get<boolean>('isSubscriptionActive');
                        return {
                            passed: isActive === false,
                            message: 'Subscription is inactive',
                            expected: false,
                            actual: isActive
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },

        {
            id: 'sub.upgrade',
            name: 'Upgrade to Basic Plan',
            execute: async (ctx) => billingSteps.upgradeSubscription(ctx, 'basic'),
            // Assuming 'Standard' exists. Will need to verify plan names.
            // If 'Standard' doesn't exist, we might need 'Premium' or check DB for plans.
            assertions: [
                {
                    name: 'Upgrade Successful',
                    invariant: 'SUB-004',
                    check: async (ctx) => {
                        const sub = ctx.get<any>('subscription');
                        return {
                            passed: sub.plan.name === 'basic' && (sub.status === 'ACTIVE' || sub.status === 'active'),
                            message: 'Plan upgraded to Basic',
                            expected: 'basic',
                            actual: sub.plan.name
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'sub.verify-active',
            name: 'Verify Subscription Active After Upgrade',
            execute: async (ctx) => billingSteps.verifySubscriptionStatus(ctx, true),
            assertions: [
                {
                    name: 'Active Status',
                    invariant: 'SUB-005',
                    check: async (ctx) => {
                        const isActive = ctx.get<boolean>('isSubscriptionActive');
                        return {
                            passed: isActive === true,
                            message: 'Subscription restored to active',
                            expected: true,
                            actual: isActive
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        }
    ]
};

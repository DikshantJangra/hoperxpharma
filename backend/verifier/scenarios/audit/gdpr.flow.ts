/**
 * GDPR Data Export Scenario
 * Validates user right to access data
 */

import { Scenario } from '../../types';
import { gdprSteps } from '../../steps/gdpr.steps';
import { authSteps } from '../../steps/auth.steps';

const onboardingService = require('../../../src/services/onboarding/onboardingService');

export const gdprScenario: Scenario = {
    id: 'audit.gdpr',
    name: 'GDPR Data Export',
    description: 'Verifies that users can export their personal data',

    dependsOn: [], // Self-contained
    validatesFeatures: ['gdpr', 'compliance', 'audit'],
    tags: ['audit', 'compliance'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'gdpr.setup',
            name: 'Setup User with Data',
            execute: async (ctx) => {
                // 1. Create User
                const timestamp = Date.now();
                const signupResult = await authSteps.signup(ctx, {
                    email: `gdpr-${timestamp}@test.hoperx.com`,
                    password: 'password123',
                    firstName: 'GDPR',
                    lastName: 'User',
                    phoneNumber: `9${timestamp.toString().slice(-9)}`
                });

                if (!signupResult.success) return signupResult;

                // 2. Create Store (as dummy data source)
                // Access via property or get()
                const userId = ctx.userId || ctx.get('userId');
                if (!userId) {
                    throw new Error('User ID not found in context after signup');
                }

                try {
                    await onboardingService.completeOnboarding({
                        store: {
                            name: `GDPR Pharmacy ${timestamp}`,
                            displayName: `GDPR Pharma`,
                            email: `gdpr-store-${timestamp}@test.hoperx.com`,
                            phoneNumber: `9${timestamp.toString().slice(-9)}`,
                            businessType: 'Retail Pharmacy',
                            addressLine1: 'GDPR St',
                            city: 'Delhi',
                            state: 'Delhi',
                            pinCode: '110001'
                        },
                        licenses: [],
                        operatingHours: [],
                        suppliers: [],
                        users: []
                    }, userId);

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
            id: 'gdpr.export-json',
            name: 'Export User Data (JSON)',
            execute: async (ctx) => gdprSteps.exportUserData(ctx),
            assertions: [
                {
                    name: 'Export contains user profile',
                    invariant: 'INV-AUDIT',
                    check: async (ctx) => {
                        const data = ctx.get<any>('gdprExport');
                        return {
                            passed: !!data.user && data.user.email.includes('gdpr-'),
                            expected: 'User profile in export',
                            actual: data.user?.email || 'Missing',
                            message: 'Export must include user profile'
                        };
                    }
                },
                {
                    name: 'Export contains stores',
                    invariant: 'INV-AUDIT',
                    check: async (ctx) => {
                        const data = ctx.get<any>('gdprExport');
                        return {
                            passed: Array.isArray(data.stores) && data.stores.length > 0,
                            expected: 'Stores list > 0',
                            actual: data.stores?.length,
                            message: 'Export must include associated stores'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },
        {
            id: 'gdpr.export-csv',
            name: 'Convert to CSV',
            execute: async (ctx) => gdprSteps.convertToCSV(ctx),
            assertions: [
                {
                    name: 'CSV generated',
                    invariant: 'INV-AUDIT',
                    check: async (ctx) => {
                        const csv = ctx.get<string>('gdprCsv');
                        return {
                            passed: csv.includes('USER PROFILE') && csv.length > 100,
                            expected: 'Valid CSV string',
                            actual: csv.substring(0, 50) + '...',
                            message: 'CSV conversion must succeed'
                        };
                    }
                }
            ],
            critical: false,
            timeout: 2000
        }
    ]
};

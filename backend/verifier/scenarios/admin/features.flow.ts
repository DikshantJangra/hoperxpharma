/**
 * Feature Toggles Scenario
 * Validates feature reading and overriding
 */

import { Scenario } from '../../types';
import { adminSteps } from '../../steps/admin.steps';

export const featuresScenario: Scenario = {
    id: 'admin.features',
    name: 'Feature Toggles Flow',
    description: 'Validates store feature overrides',
    dependsOn: ['core.onboarding'], // Needs store
    validatesFeatures: ['admin', 'features'],
    tags: ['admin'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'features.get',
            name: 'Get store features',
            execute: async (ctx) => adminSteps.getStoreFeatures(ctx),
            assertions: [
                {
                    name: 'Returns feature config',
                    invariant: 'DATA-001',
                    check: async (ctx) => {
                        const features = ctx.get<any>('storeFeatures');
                        return {
                            passed: Boolean(features && features.featureConfig),
                            message: 'Feature config must exist',
                            expected: 'Config object',
                            actual: features ? 'Found' : 'Null'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },

        {
            id: 'features.update',
            name: 'Override feature (Disable POS)',
            execute: async (ctx) => adminSteps.updateStoreFeatures(ctx, { pos: 'hidden' }),
            assertions: [
                {
                    name: 'Override applied',
                    invariant: 'CONF-001',
                    check: async (ctx) => {
                        const features = ctx.get<any>('storeFeatures');
                        // featureOverrides should now contain pos: hidden
                        // AND result.featureConfig.pos should be hidden
                        return {
                            passed: features.featureConfig.pos === 'hidden',
                            message: 'POS should be hidden',
                            expected: 'hidden',
                            actual: features.featureConfig?.pos
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        }
    ]
};

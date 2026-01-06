/**
 * Dispense Flow Scenario
 * Validates the dispense workflow: Refill -> version -> Dispense -> Ready -> Sale
 */

import { Scenario } from '../../types';
import { prescriptionSteps } from '../../steps/prescription.steps';
import { dispenseSteps } from '../../steps/dispense.steps';
import { stateAssert } from '../../assertions/state.assert';

export const dispenseScenario: Scenario = {
    id: 'clinical.dispense',
    name: 'Dispense Workflow',
    description: 'Validates dispense creation and status transitions',
    dependsOn: ['clinical.prescription'], // Needs active prescription
    validatesFeatures: ['clinical', 'dispense'],
    tags: ['critical', 'clinical'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'dispense.create',
            name: 'Create dispense from refill',
            execute: async (ctx) => dispenseSteps.createDispense(ctx),
            assertions: [
                {
                    name: 'Dispense created with ID',
                    invariant: 'DATA-001',
                    check: async (ctx) => {
                        const d = ctx.get<any>('dispense');
                        return {
                            passed: Boolean(d && d.id),
                            message: 'Dispense must be created',
                            expected: 'Dispense object',
                            actual: d ? 'Created' : 'Null'
                        };
                    }
                },
                {
                    name: 'Initial status is PENDING',
                    invariant: 'DISP-001',
                    check: async (ctx) => {
                        const did = ctx.get<string>('dispenseId');
                        return stateAssert.checkDispenseStatus(ctx, did, 'PENDING');
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'dispense.process',
            name: 'Start processing dispense (Fill)',
            execute: async (ctx) => dispenseSteps.updateStatus(ctx, 'IN_PROGRESS'),
            assertions: [
                {
                    name: 'Status updated to IN_PROGRESS',
                    invariant: 'DISP-002',
                    check: async (ctx) => {
                        const did = ctx.get<string>('dispenseId');
                        return stateAssert.checkDispenseStatus(ctx, did, 'IN_PROGRESS');
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'dispense.verify',
            name: 'Verify and release (Ready)',
            execute: async (ctx) => dispenseSteps.updateStatus(ctx, 'READY'),
            assertions: [
                {
                    name: 'Status updated to READY',
                    invariant: 'DISP-003',
                    check: async (ctx) => {
                        const did = ctx.get<string>('dispenseId');
                        return stateAssert.checkDispenseStatus(ctx, did, 'READY');
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'dispense.check-pos-visibility',
            name: 'Verify dispense visible to POS',
            execute: async (ctx) => dispenseSteps.getReadyDispenses(ctx),
            assertions: [
                {
                    name: 'Current dispense is in ready list',
                    invariant: 'POS-001',
                    check: async (ctx) => {
                        const dispenses = ctx.get<any[]>('readyDispenses') || [];
                        const currentId = ctx.get<string>('dispenseId');
                        const found = dispenses.some(d => d.id === currentId);

                        return {
                            passed: found,
                            message: found ? 'Dispense visible' : 'Dispense not found',
                            expected: 'Dispense in list',
                            actual: found ? 'Found' : 'Not Found'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        }
    ]
};

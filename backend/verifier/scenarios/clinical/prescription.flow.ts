/**
 * Prescription Flow Scenario
 * Validates the full prescription lifecycle: Create -> Activate -> Verify
 */

import { Scenario } from '../../types';
import { prescriptionSteps } from '../../steps/prescription.steps';
import { inventorySteps } from '../../steps/inventory.steps';
import { patientSteps } from '../../steps/patient.steps';
import { stateAssert } from '../../assertions/state.assert';

export const prescriptionScenario: Scenario = {
    id: 'clinical.prescription',
    name: 'Prescription Lifecycle Flow',
    description: 'Validates prescription creation, activation, and refill calculation',
    dependsOn: ['core.onboarding'], // Needs store setup
    validatesFeatures: ['clinical', 'prescriptions'],
    tags: ['critical', 'clinical'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'prescription.setup-patient',
            name: 'Ensure patient exists',
            execute: async (ctx) => patientSteps.ensurePatientExists(ctx),
            assertions: [
                {
                    name: 'Patient exists with ID',
                    invariant: 'DATA-001',
                    check: async (ctx) => {
                        const patient = ctx.get<any>('patient');
                        return {
                            passed: Boolean(patient && patient.id),
                            message: 'Patient must exist with ID',
                            expected: 'Valid ID',
                            actual: patient?.id || 'undefined'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'prescription.setup-drug',
            name: 'Ensure drug exists for prescription',
            execute: async (ctx) => inventorySteps.ensureTestDrugExists(ctx),
            assertions: [], // No assertions needed, step fails if throws
            critical: true,
            timeout: 10000
        },

        {
            id: 'prescription.create',
            name: 'Create a regular prescription',
            execute: async (ctx) => {
                const drug = ctx.get<any>('testDrug');
                const patient = ctx.get<any>('patient');

                return prescriptionSteps.createPrescription(ctx, {
                    patientId: patient.id,
                    type: 'REGULAR',
                    items: [{
                        drugId: drug.id,
                        quantity: 30, // 30 tablets
                        sig: '1 tablet daily'
                    }]
                });
            },
            assertions: [
                {
                    name: 'Prescription created',
                    invariant: 'DATA-001',
                    check: async (ctx) => {
                        const p = ctx.get<any>('prescription');
                        return {
                            passed: Boolean(p && p.id),
                            message: 'Prescription must be created',
                            expected: 'Prescription object',
                            actual: p ? 'Created' : 'Null'
                        };
                    }
                },
                {
                    name: 'Status is DRAFT initially',
                    invariant: 'RX-001',
                    check: async (ctx) => {
                        const pid = ctx.get<string>('prescriptionId');
                        return stateAssert.checkPrescriptionStatus(ctx, pid, 'DRAFT');
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'prescription.activate',
            name: 'Activate prescription',
            execute: async (ctx) => prescriptionSteps.activatePrescription(ctx),
            assertions: [
                {
                    name: 'Status changed to ACTIVE',
                    invariant: 'RX-002',
                    check: async (ctx) => {
                        const pid = ctx.get<string>('prescriptionId');
                        return stateAssert.checkPrescriptionStatus(ctx, pid, 'ACTIVE');
                    }
                },
                {
                    name: 'Refills calculated correctly (Regular = 3)',
                    invariant: 'RX-003',
                    check: async (ctx) => {
                        const p = ctx.get<any>('prescription');
                        return {
                            passed: Boolean(p.totalRefills === 3),
                            message: 'Total refills should be 3',
                            expected: 3,
                            actual: p.totalRefills
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'prescription.get-next-refill',
            name: 'Get next available refill',
            execute: async (ctx) => prescriptionSteps.getNextRefill(ctx),
            assertions: [
                {
                    name: 'Next refill is available',
                    invariant: 'RX-004',
                    check: async (ctx) => {
                        const refill = ctx.get<any>('currentRefill');
                        return {
                            passed: Boolean(refill && refill.status === 'AVAILABLE'),
                            message: 'Refill must be available',
                            expected: 'AVAILABLE',
                            actual: refill?.status || 'None'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        }
    ]
};

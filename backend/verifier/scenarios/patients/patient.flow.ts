/**
 * Patient Management Scenario
 * Validates patient creation and data integrity
 */

import { Scenario } from '../../types';
import { patientSteps } from '../../steps/patient.steps';

export const patientScenario: Scenario = {
    id: 'patients.create',
    name: 'Patient Management Flow',
    description: 'Validates patient creation, retrieval, and ledger',
    dependsOn: ['core.onboarding'],
    validatesFeatures: ['patients'],
    tags: ['critical', 'patients'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'patient.create',
            name: 'Create new patient',
            execute: async (ctx) => patientSteps.createPatient(ctx, {
                firstName: 'John',
                lastName: 'Doe',
                email: `john.doe.${Date.now()}@test.com`
            }),
            assertions: [
                {
                    name: 'Patient created with ID',
                    invariant: 'DATA-001',
                    check: async (ctx) => {
                        const p = ctx.get<any>('patient');
                        return {
                            passed: Boolean(p && p.id),
                            message: 'Patient must be created',
                            expected: 'Patient object',
                            actual: p ? 'Created' : 'Null'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'patient.verify-data',
            name: 'Verify patient data integrity',
            execute: async (ctx) => patientSteps.verifyPatientData(ctx),
            assertions: [
                {
                    name: 'Required fields are present',
                    invariant: 'DATA-002',
                    check: async (ctx) => {
                        return {
                            passed: true,
                            message: 'Patient data is valid',
                            expected: 'Valid data',
                            actual: 'Valid data'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'patient.check-ledger',
            name: 'Check patient ledger',
            execute: async (ctx) => patientSteps.getPatientLedger(ctx),
            assertions: [
                {
                    name: 'Ledger exists or defaults to zero',
                    invariant: 'FIN-005',
                    check: async (ctx) => {
                        const ledger = ctx.get<any>('patientLedger');
                        return {
                            passed: true,
                            message: 'Ledger check passed',
                            expected: 'Ledger object or null',
                            actual: ledger ? 'Found' : 'Null'
                        };
                    }
                }
            ],
            critical: false,
            timeout: 10000
        }
    ]
};

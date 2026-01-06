
/**
 * Email Flow Scenario
 * Validates email system: Configuration -> Send -> Log Verification
 */

import { Scenario } from '../../types';
import { communicationSteps } from '../../steps/communication.steps';

export const emailScenario: Scenario = {
    id: 'communication.email',
    name: 'Email Communication Flow',
    description: 'Validates email configuration and logging of sent emails',
    dependsOn: ['core.auth'], // Needs logged in user
    validatesFeatures: ['email', 'communication'],
    tags: ['full', 'communication'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'email.setup',
            name: 'Ensure Email Configured',
            execute: async (ctx) => communicationSteps.ensureEmailAccount(ctx),
            assertions: [
                {
                    name: 'Account Exists',
                    invariant: 'DATA-001',
                    check: async (ctx) => {
                        const acc = ctx.get<any>('emailAccount');
                        return {
                            passed: !!acc && !!acc.id,
                            message: 'Email account available',
                            expected: 'Account ID',
                            actual: acc?.id
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },

        {
            id: 'email.send',
            name: 'Send Test Email',
            execute: async (ctx) => communicationSteps.sendEmail(ctx, 'DPFV Test Email ' + Date.now()),
            assertions: [
                {
                    name: 'Email Logged',
                    invariant: 'INV-AUDIT',
                    check: async (ctx) => {
                        const log = ctx.get<any>('latestEmailLog');
                        return {
                            passed: !!log,
                            message: 'Email attempt logged',
                            expected: 'Log entry',
                            actual: log ? 'Found' : 'Missing'
                        };
                    }
                },
                {
                    name: 'Log Status Updated',
                    invariant: 'INV-AUDIT',
                    check: async (ctx) => {
                        const log = ctx.get<any>('latestEmailLog');
                        // Status should be SENT or FAILED (not PENDING if process finished)
                        return {
                            passed: ['SENT', 'FAILED'].includes(log.status),
                            message: 'Log status resolved (SENT/FAILED)',
                            expected: 'SENT/FAILED',
                            actual: log.status
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        }
    ]
};

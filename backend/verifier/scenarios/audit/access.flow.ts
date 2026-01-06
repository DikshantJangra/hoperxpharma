/**
 * Audit Flow Scenario
 * Validates access logging for successful and failed attempts
 */

import { Scenario } from '../../types';
import { authSteps } from '../../steps/auth.steps';
import { auditSteps } from '../../steps/audit.steps';

export const accessLogScenario: Scenario = {
    id: 'audit.access',
    name: 'Access Log Verification',
    description: 'Verifies that successful and failed login attempts are correctly logged',

    dependsOn: ['core.auth'],
    validatesFeatures: ['audit-logs', 'security'],
    tags: ['audit', 'critical'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'audit.setup',
            name: 'Login as Admin to generate success log',
            execute: async (ctx) => {
                // Determine email to use
                const email = 'dpfv-audit-admin@test.hoperx.com';

                // Ensure user exists first
                await authSteps.signup(ctx, {
                    email,
                    phoneNumber: '9998887776',
                    password: 'TestPassword@123',
                    firstName: 'Audit',
                    lastName: 'Admin'
                });

                // Login
                return authSteps.login(ctx, {
                    email,
                    password: 'TestPassword@123'
                });
            },
            assertions: [],
            critical: true,
            timeout: 5000
        },
        {
            id: 'audit.verify-success',
            name: 'Verify login success log',
            execute: async (ctx) => {
                return auditSteps.verifyLastAccessLog(ctx, {
                    eventType: 'login_success'
                });
            },
            assertions: [
                {
                    name: 'Log exists and matches event',
                    invariant: 'AUDIT-001',
                    check: async (ctx) => {
                        const log = ctx.get<any>('lastAccessLog');
                        return {
                            passed: log && log.eventType === 'login_success',
                            expected: 'login_success',
                            actual: log?.eventType,
                            message: 'Latest log should be login_success'
                        };
                    }
                },
                {
                    name: 'Client IP is recorded',
                    invariant: 'AUDIT-002',
                    check: async (ctx) => {
                        const log = ctx.get<any>('lastAccessLog');
                        return {
                            passed: !!log.ipAddress,
                            expected: 'IP Address',
                            actual: log.ipAddress,
                            message: 'IP address must be recorded'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },
        {
            id: 'audit.simulate-fail',
            name: 'Simulate failed login attempt',
            execute: async (ctx) => {
                const user = ctx.get<any>('currentUser');
                return auditSteps.simulateLoginFailure(ctx, {
                    email: user.email,
                    password: 'WrongPassword!'
                });
            },
            assertions: [],
            critical: true,
            timeout: 5000
        },
        {
            id: 'audit.verify-fail',
            name: 'Verify login failure log',
            execute: async (ctx) => {
                const targetUserId = ctx.get<string>('targetUserId');
                return auditSteps.verifyLastAccessLog(ctx, {
                    userId: targetUserId,
                    eventType: 'login_failure'
                });
            },
            assertions: [
                {
                    name: 'Log records failure',
                    invariant: 'AUDIT-001',
                    check: async (ctx) => {
                        const log = ctx.get<any>('lastAccessLog');
                        return {
                            passed: log && log.eventType === 'login_failure',
                            expected: 'login_failure',
                            actual: log?.eventType,
                            message: 'Latest log should be login_failure'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        }
    ]
};

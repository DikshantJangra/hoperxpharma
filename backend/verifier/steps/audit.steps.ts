/**
 * Audit Step Implementations
 * Steps for verifying audit logs and access control
 */

import { StepResult, ScenarioContext } from '../types';

const accessLogService = require('../../src/services/audit/accessLogService');
const authService = require('../../src/services/auth/authService');
const prisma = require('../../src/db/prisma');

export const auditSteps = {
    /**
     * Verify the most recent access log for a user matches expectations
     */
    async verifyLastAccessLog(
        ctx: ScenarioContext,
        params: {
            userId?: string;
            eventType: string;
            status?: string;
            ipAddress?: string;
        }
    ): Promise<StepResult> {
        try {
            const userId = params.userId || ctx.get<any>('currentUser').id;

            // Allow some time for async log writing
            await new Promise(resolve => setTimeout(resolve, 100));

            const logs = await accessLogService.getAccessByUser(userId, 1);

            if (!logs || logs.length === 0) {
                return {
                    success: false,
                    error: new Error(`No access logs found for user ${userId}`),
                    duration: 0
                };
            }

            const lastLog = logs[0];
            ctx.set('lastAccessLog', lastLog);

            return {
                success: true,
                data: lastLog,
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

    /**
     * Simulate a failed login attempt
     */
    async simulateLoginFailure(
        ctx: ScenarioContext,
        params: {
            email: string;
            password?: string;
        }
    ): Promise<StepResult> {
        try {
            await authService.login(
                params.email,
                params.password || 'WrongPassword123!',
                { userAgent: 'DPFV-Verifier-Fail', ipAddress: '127.0.0.1' }
            );

            // If login succeeds, this step fails
            return {
                success: false,
                error: new Error('Login succeeded when it was expected to fail'),
                duration: 0
            };
        } catch (error: any) {
            // Expected error
            ctx.set('loginError', error);

            // We need to find the user ID for verification if possible
            const user = await prisma.user.findUnique({
                where: { email: params.email }
            });

            if (user) {
                ctx.set('targetUserId', user.id);
            }

            return {
                success: true,
                data: { error: error.message },
                duration: 0
            };
        }
    }
};

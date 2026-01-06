/**
 * Auth Step Implementations
 * Steps for authentication scenarios
 */

import { StepResult, ScenarioContext } from '../types';

const authService = require('../../src/services/auth/authService');
const prisma = require('../../src/db/prisma');

export const authSteps = {
    /**
     * Sign up a new user
     */
    async signup(
        ctx: ScenarioContext,
        userData: {
            email: string;
            phoneNumber: string;
            password: string;
            firstName: string;
            lastName: string;
        }
    ): Promise<StepResult> {
        try {
            const result = await authService.signup(userData);

            ctx.set('signupResult', result);
            ctx.set('currentUser', result.user);
            ctx.set('authToken', result.accessToken);
            ctx.set('refreshToken', result.refreshToken);
            ctx.setAuth(result.user.id, '', result.accessToken);

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

    /**
     * Login with email and password
     */
    async login(
        ctx: ScenarioContext,
        credentials: { email: string; password: string }
    ): Promise<StepResult> {
        try {
            const result = await authService.login(
                credentials.email,
                credentials.password,
                { userAgent: 'DPFV-Verifier', ipAddress: '127.0.0.1' }
            );

            ctx.set('loginResult', result);
            ctx.set('currentUser', result.user);
            ctx.set('authToken', result.accessToken);
            ctx.set('refreshToken', result.refreshToken);

            // Set store if user has one
            const primaryStore = result.user.storeUsers?.find((su: any) => su.isPrimary);
            if (primaryStore) {
                ctx.storeId = primaryStore.storeId;
                ctx.set('currentStore', primaryStore.store);
            }

            ctx.setAuth(
                result.user.id,
                primaryStore?.storeId || '',
                result.accessToken
            );

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

    /**
     * Refresh access token
     */
    async refreshToken(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const refreshToken = ctx.get<string>('refreshToken');
            const result = await authService.refreshToken(refreshToken);

            ctx.set('authToken', result.accessToken);
            ctx.set('refreshToken', result.refreshToken);

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

    /**
     * Get user profile
     */
    async getProfile(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const userId = ctx.userId || ctx.get<any>('currentUser').id;
            const profile = await authService.getProfile(userId);

            ctx.set('userProfile', profile);

            return {
                success: true,
                data: profile,
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
     * Create test user (for setup)
     */
    async createTestUser(
        ctx: ScenarioContext,
        overrides?: Partial<{
            email: string;
            phoneNumber: string;
            password: string;
            firstName: string;
            lastName: string;
        }>
    ): Promise<StepResult> {
        const timestamp = Date.now();
        const userData = {
            email: `dpfv-test-${timestamp}@test.hoperx.com`,
            phoneNumber: `9${timestamp.toString().slice(-9)}`,
            password: 'Test@123456',
            firstName: 'DPFV',
            lastName: 'TestUser',
            ...overrides
        };

        return this.signup(ctx, userData);
    },

    /**
     * Cleanup test user
     */
    async cleanupTestUser(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const user = ctx.get<any>('currentUser');
            if (user?.id) {
                // Soft delete or mark as test
                await prisma.user.update({
                    where: { id: user.id },
                    data: { isActive: false }
                });
            }

            return {
                success: true,
                data: { cleaned: true },
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    }
};

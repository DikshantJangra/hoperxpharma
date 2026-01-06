/**
 * Auth Flow Scenario
 * Validates user signup, login, and token refresh
 */

import { Scenario } from '../../types';
import { authSteps } from '../../steps/auth.steps';
import { stateAssert } from '../../assertions/state.assert';

export const authScenario: Scenario = {
    id: 'core.auth',
    name: 'Authentication Flow',
    description: 'Validates user signup, login, token refresh, and profile retrieval',
    dependsOn: [], // No dependencies - foundation scenario
    validatesFeatures: ['auth', 'users'],
    tags: ['critical', 'smoke'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'auth.signup',
            name: 'Sign up new test user',
            execute: async (ctx) => {
                return authSteps.createTestUser(ctx);
            },
            assertions: [
                {
                    name: 'User created with correct fields',
                    invariant: 'AUTH-001',
                    check: async (ctx) => {
                        const user = ctx.get<any>('currentUser');
                        return {
                            passed: Boolean(user && user.id && user.email && user.firstName),
                            expected: 'User object with id, email, firstName',
                            actual: user ? { id: user.id, email: user.email } : null,
                            message: 'Signup must return complete user object'
                        };
                    }
                },
                {
                    name: 'Access token generated',
                    invariant: 'AUTH-001',
                    check: async (ctx) => {
                        const token = ctx.get<string>('authToken');
                        return {
                            passed: Boolean(token && token.length > 20),
                            expected: 'JWT access token',
                            actual: token ? `${token.substring(0, 20)}...` : null,
                            message: 'Signup must return valid access token'
                        };
                    }
                },
                {
                    name: 'Refresh token generated',
                    invariant: 'AUTH-001',
                    check: async (ctx) => {
                        const refreshToken = ctx.get<string>('refreshToken');
                        return {
                            passed: Boolean(refreshToken && refreshToken.length > 20),
                            expected: 'JWT refresh token',
                            actual: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
                            message: 'Signup must return valid refresh token'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'auth.login',
            name: 'Login with credentials',
            execute: async (ctx) => {
                const user = ctx.get<any>('signupResult');
                // Use the test credentials
                return authSteps.login(ctx, {
                    email: user.user.email,
                    password: 'Test@123456'
                });
            },
            assertions: [
                {
                    name: 'Login returns same user',
                    invariant: 'AUTH-001',
                    check: async (ctx) => {
                        const signupUser = ctx.get<any>('signupResult').user;
                        const loginUser = ctx.get<any>('loginResult').user;
                        return {
                            passed: signupUser.id === loginUser.id,
                            expected: signupUser.id,
                            actual: loginUser.id,
                            message: 'Login must return same user as signup'
                        };
                    }
                },
                {
                    name: 'User is active',
                    invariant: 'AUTH-001',
                    check: async (ctx) => {
                        const user = ctx.get<any>('loginResult').user;
                        return {
                            passed: user.isActive === true,
                            expected: true,
                            actual: user.isActive,
                            message: 'Logged in user must be active'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 10000
        },

        {
            id: 'auth.refresh-token',
            name: 'Refresh access token',
            execute: async (ctx) => {
                // Store original token
                const originalToken = ctx.get<string>('authToken');
                ctx.set('originalToken', originalToken);

                return authSteps.refreshToken(ctx);
            },
            assertions: [
                {
                    name: 'New access token generated',
                    invariant: 'AUTH-001',
                    check: async (ctx) => {
                        const newToken = ctx.get<string>('authToken');
                        const originalToken = ctx.get<string>('originalToken');
                        return {
                            passed: Boolean(newToken && newToken !== originalToken),
                            expected: 'New access token different from original',
                            actual: newToken === originalToken ? 'Same token' : 'New token',
                            message: 'Token refresh must generate new access token'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },

        {
            id: 'auth.get-profile',
            name: 'Get user profile',
            execute: async (ctx) => {
                return authSteps.getProfile(ctx);
            },
            assertions: [
                {
                    name: 'Profile matches user',
                    invariant: 'AUTH-001',
                    check: async (ctx) => {
                        const user = ctx.get<any>('currentUser');
                        const profile = ctx.get<any>('userProfile');
                        return {
                            passed: Boolean(profile && profile.email === user.email),
                            expected: user.email,
                            actual: profile?.email,
                            message: 'Profile email must match user email'
                        };
                    }
                },
                {
                    name: 'Password not exposed',
                    invariant: 'AUTH-002',
                    check: async (ctx) => {
                        const profile = ctx.get<any>('userProfile');
                        return {
                            passed: !profile.passwordHash && !profile.password,
                            expected: 'No password in profile',
                            actual: profile.passwordHash ? 'Has passwordHash' : 'No password',
                            message: 'Profile must not expose password hash'
                        };
                    }
                }
            ],
            critical: false,
            timeout: 5000
        }
    ]
};

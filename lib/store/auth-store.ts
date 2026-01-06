import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/lib/api/auth';
import { userApi, UserProfile, Store, getPrimaryStore } from '@/lib/api/user';
import { rbacApi } from '@/lib/api/rbac';
import { tokenManager } from '@/lib/api/client';
import { isNetworkError, isTimeoutError } from '@/lib/utils/network';

interface AuthState {
    user: UserProfile | null;
    primaryStore: Store | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isLoggingOut: boolean;
    hasStore: boolean;
    permissions: string[];
    login: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    updateUser: (user: UserProfile) => void;
    refreshUserData: () => Promise<void>;
    fetchPermissions: (storeId?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            primaryStore: null,
            isAuthenticated: false,
            isLoading: true,
            isLoggingOut: false,
            hasStore: false,
            permissions: [],

            login: async (data) => {
                set({ isLoading: true });
                try {
                    const response = await authApi.login(data);
                    if (response.success && response.data) {
                        // After login, fetch complete user profile
                        try {
                            const userProfile = await userApi.getUserProfile();
                            const primaryStore = getPrimaryStore(userProfile);
                            const hasStore = !!(userProfile.storeUsers && userProfile.storeUsers.length > 0);

                            // Only set cookie AFTER successful profile fetch
                            authApi.setLoggedInCookie();

                            // Fetch permissions
                            let permissions: string[] = [];
                            try {
                                const permResponse = await rbacApi.getMyPermissions(primaryStore?.id);
                                if (permResponse.success) {
                                    permissions = permResponse.data;
                                }
                            } catch (e) {
                                console.error('Failed to fetch permissions', e);
                            }

                            set({
                                user: userProfile,
                                primaryStore,
                                isAuthenticated: true,
                                hasStore,
                                permissions,
                                isLoading: false
                            });
                        } catch (profileError) {
                            // If profile fetch fails, clear everything including cookie
                            console.error('Failed to fetch user profile:', profileError);
                            tokenManager.clearTokens();
                            authApi.clearLoggedInCookie();
                            set({ isLoading: false });
                            throw new Error('Failed to load user profile. Please try again.');
                        }
                    } else {
                        set({ isLoading: false });
                        throw new Error(response.message || 'Login failed');
                    }
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                set({ isLoggingOut: true, isLoading: true });
                try {
                    await authApi.logout();
                } catch (error) {
                    console.error('Logout API error:', error);
                    // Continue with cleanup even if API call fails
                } finally {
                    // Always clear tokens and state, even if API call fails
                    tokenManager.clearTokens();
                    authApi.clearLoggedInCookie();

                    // Clear user state but keep isLoggingOut true to prevent flash of empty state
                    set({
                        user: null,
                        primaryStore: null,
                        isAuthenticated: false,
                        hasStore: false,
                        permissions: [],
                        isLoading: false,
                        isLoggingOut: true // Keep true until redirect happens
                    });

                    console.log('Logout complete - redirecting to login');

                    // Redirect to login page
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }

                    // Reset isLoggingOut after a delay (for SSR safety)
                    setTimeout(() => {
                        set({ isLoggingOut: false });
                    }, 500);
                }
            },

            checkAuth: async () => {
                let token = tokenManager.getAccessToken();

                // If no access token, try to refresh
                if (!token) {
                    console.log('No access token found, attempting refresh...');
                    try {
                        const refreshResponse = await authApi.refreshToken();
                        if (refreshResponse?.accessToken) {
                            token = refreshResponse.accessToken;
                            console.log('Token refreshed successfully');
                        }
                    } catch (refreshError: any) {
                        // Distinguish between network errors and auth errors
                        const isNetError = isNetworkError(refreshError) || isTimeoutError(refreshError);

                        if (isNetError) {
                            console.warn('Network error during token refresh, will retry on next request');
                            // Don't logout on network errors, just set loading to false
                            set({ isLoading: false });
                            return;
                        } else {
                            // Downgrade to warn or info as this is expected when user is not logged in
                            console.warn('Token refresh failed - user is unauthenticated:', refreshError?.message);
                            // Clear all auth data including tokens and cookies
                            tokenManager.clearTokens();
                            authApi.clearLoggedInCookie();
                            set({ isAuthenticated: false, user: null, primaryStore: null, hasStore: false, permissions: [], isLoading: false });
                            return;
                        }
                    }
                }

                if (!token) {
                    console.log('No token available after refresh attempt');
                    set({ isAuthenticated: false, user: null, primaryStore: null, hasStore: false, permissions: [], isLoading: false });
                    return;
                }

                try {
                    // Fetch complete user profile with store data
                    const userProfile = await userApi.getUserProfile();
                    const primaryStore = getPrimaryStore(userProfile);
                    const hasStore = !!(userProfile.storeUsers && userProfile.storeUsers.length > 0);

                    // Ensure cookie is set
                    authApi.setLoggedInCookie();

                    // Fetch permissions
                    let permissions: string[] = [];
                    try {
                        const permResponse = await rbacApi.getMyPermissions(primaryStore?.id);
                        if (permResponse.success) {
                            permissions = permResponse.data;
                        }
                    } catch (e) {
                        console.error('Failed to fetch permissions', e);
                    }

                    set({
                        user: userProfile,
                        primaryStore,
                        isAuthenticated: true,
                        hasStore,
                        permissions,
                        isLoading: false
                    });
                    console.log('Auth check successful - user authenticated');
                } catch (error: any) {
                    // If profile fetch fails, token might be invalid
                    const isNetError = isNetworkError(error) || isTimeoutError(error);
                    const isRateLimit = error?.status === 429;

                    if (isNetError) {
                        console.warn('Network error during profile fetch, will retry on next request');
                        set({ isLoading: false });
                    } else if (isRateLimit) {
                        console.warn('Rate limit exceeded during auth check, preserving existing state');
                        // Do NOT clear auth state, just stop loading. 
                        // This prevents the logout loop when 429s happen.
                        set({ isLoading: false });
                    } else {
                        console.error('Auth check failed - clearing auth state:', error?.message);
                        tokenManager.clearTokens();
                        authApi.clearLoggedInCookie();
                        set({ user: null, primaryStore: null, isAuthenticated: false, hasStore: false, permissions: [], isLoading: false });
                    }
                }
            },

            updateUser: (user) => {
                const primaryStore = getPrimaryStore(user);
                const hasStore = !!(user.storeUsers && user.storeUsers.length > 0);
                set({ user, primaryStore, hasStore });
            },

            refreshUserData: async () => {
                try {
                    const userProfile = await userApi.getUserProfile();
                    const primaryStore = getPrimaryStore(userProfile);
                    const hasStore = !!(userProfile.storeUsers && userProfile.storeUsers.length > 0);

                    // Fetch permissions
                    let permissions: string[] = [];
                    try {
                        const permResponse = await rbacApi.getMyPermissions(primaryStore?.id);
                        if (permResponse.success) {
                            permissions = permResponse.data;
                        }
                    } catch (e) {
                        console.error('Failed to fetch permissions', e);
                    }

                    set({
                        user: userProfile,
                        primaryStore,
                        hasStore,
                        permissions
                    });
                } catch (error) {
                    console.error('Failed to refresh user data:', error);
                }
            },

            fetchPermissions: async (storeId) => {
                try {
                    const response = await rbacApi.getMyPermissions(storeId);
                    if (response.success) {
                        set({ permissions: response.data });
                    }
                } catch (error) {
                    console.error('Failed to fetch permissions:', error);
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                primaryStore: state.primaryStore,
                isAuthenticated: state.isAuthenticated,
                hasStore: state.hasStore,
                permissions: state.permissions,
                // Note: isLoggingOut is NOT persisted - should always start as false
            }),
        }
    )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/lib/api/auth';
import { userApi, UserProfile, Store, getPrimaryStore } from '@/lib/api/user';
import { tokenManager } from '@/lib/api/client';

interface AuthState {
    user: UserProfile | null;
    primaryStore: Store | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasStore: boolean;
    login: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    updateUser: (user: UserProfile) => void;
    refreshUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            primaryStore: null,
            isAuthenticated: false,
            isLoading: true,
            hasStore: false,

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

                            set({
                                user: userProfile,
                                primaryStore,
                                isAuthenticated: true,
                                hasStore,
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
                set({ isLoading: true });
                try {
                    await authApi.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    tokenManager.clearTokens();
                    set({
                        user: null,
                        primaryStore: null,
                        isAuthenticated: false,
                        hasStore: false,
                        isLoading: false
                    });
                }
            },

            checkAuth: async () => {
                let token = tokenManager.getAccessToken();

                // If no access token, try to refresh
                if (!token) {
                    try {
                        const refreshResponse = await authApi.refreshToken();
                        if (refreshResponse?.accessToken) {
                            token = refreshResponse.accessToken;
                        }
                    } catch (refreshError) {
                        // Refresh failed, user is truly unauthenticated
                        set({ isAuthenticated: false, user: null, primaryStore: null, hasStore: false, isLoading: false });
                        return;
                    }
                }

                if (!token) {
                    set({ isAuthenticated: false, user: null, primaryStore: null, hasStore: false, isLoading: false });
                    return;
                }

                try {
                    // Fetch complete user profile with store data
                    const userProfile = await userApi.getUserProfile();
                    const primaryStore = getPrimaryStore(userProfile);
                    const hasStore = !!(userProfile.storeUsers && userProfile.storeUsers.length > 0);

                    // Ensure cookie is set
                    authApi.setLoggedInCookie();

                    set({
                        user: userProfile,
                        primaryStore,
                        isAuthenticated: true,
                        hasStore,
                        isLoading: false
                    });
                } catch (error) {
                    // If profile fetch fails, token might be invalid
                    console.error('Auth check failed:', error);
                    tokenManager.clearTokens();
                    authApi.clearLoggedInCookie();
                    set({ user: null, primaryStore: null, isAuthenticated: false, hasStore: false, isLoading: false });
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

                    set({
                        user: userProfile,
                        primaryStore,
                        hasStore
                    });
                } catch (error) {
                    console.error('Failed to refresh user data:', error);
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
                hasStore: state.hasStore
            }),
        }
    )
);

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
                        const userProfile = await userApi.getUserProfile();
                        const primaryStore = getPrimaryStore(userProfile);
                        const hasStore = !!(userProfile.storeUsers && userProfile.storeUsers.length > 0);

                        set({
                            user: userProfile,
                            primaryStore,
                            isAuthenticated: true,
                            hasStore
                        });
                    } else {
                        throw new Error(response.message || 'Login failed');
                    }
                } finally {
                    set({ isLoading: false });
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
                const token = tokenManager.getAccessToken();
                if (!token) {
                    set({ isAuthenticated: false, user: null, primaryStore: null, isLoading: false });
                    return;
                }

                try {
                    // Fetch complete user profile with store data
                    const userProfile = await userApi.getUserProfile();
                    const primaryStore = getPrimaryStore(userProfile);
                    const hasStore = !!(userProfile.storeUsers && userProfile.storeUsers.length > 0);

                    set({
                        user: userProfile,
                        primaryStore,
                        isAuthenticated: true,
                        hasStore,
                        isLoading: false
                    });
                } catch (error) {
                    // If profile fetch fails, token might be invalid
                    tokenManager.clearTokens();
                    set({ user: null, primaryStore: null, isAuthenticated: false, isLoading: false });
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

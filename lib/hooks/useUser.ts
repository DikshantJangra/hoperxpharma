import { UserProfile, Store, getPrimaryStore } from '@/lib/api/user';

/**
 * Custom hook to access user data
 */
export function useUser() {
    // This will be enhanced when we update the auth store
    // For now, it's a placeholder that components can use
    return {
        user: null as UserProfile | null,
        primaryStore: null as Store | null,
        isLoading: true,
        fullName: '',
    };
}

/**
 * Hook to get user's full name
 */
export function useUserFullName(): string {
    const { user } = useUser();
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
}

/**
 * Hook to get user's primary store
 */
export function usePrimaryStore(): Store | null {
    const { user } = useUser();
    return getPrimaryStore(user);
}

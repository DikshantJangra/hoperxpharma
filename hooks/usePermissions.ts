import { useAuthStore } from '@/lib/store/auth-store';
import { useCallback } from 'react';

export function usePermissions() {
    const { permissions, user } = useAuthStore();

    /**
     * Check if the user has the required permission
     * @param permissionCode The permission code to check (e.g., 'patient.create')
     * @returns boolean
     */
    const can = useCallback((permissionCode: string): boolean => {
        // Admin bypass - if user has ADMIN role, they have all permissions
        // Note: The backend also enforces this, but we do it here for UI responsiveness
        if (user?.role === 'ADMIN') {
            return true;
        }

        return permissions.includes(permissionCode);
    }, [permissions, user]);

    /**
     * Check if the user has ANY of the required permissions
     * @param permissionCodes Array of permission codes
     * @returns boolean
     */
    const canAny = useCallback((permissionCodes: string[]): boolean => {
        if (user?.role === 'ADMIN') {
            return true;
        }

        return permissionCodes.some(code => permissions.includes(code));
    }, [permissions, user]);

    /**
     * Check if the user has ALL of the required permissions
     * @param permissionCodes Array of permission codes
     * @returns boolean
     */
    const canAll = useCallback((permissionCodes: string[]): boolean => {
        if (user?.role === 'ADMIN') {
            return true;
        }

        return permissionCodes.every(code => permissions.includes(code));
    }, [permissions, user]);

    return {
        permissions,
        can,
        canAny,
        canAll,
    };
}

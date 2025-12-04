"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api/auth';

interface PermissionContextType {
    permissions: string[];
    loading: boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
    children: ReactNode;
    initialPermissions?: string[];
}

export function PermissionProvider({ children, initialPermissions = [] }: PermissionProviderProps) {
    const [permissions, setPermissions] = useState<string[]>(initialPermissions);
    const [loading, setLoading] = useState(false);

    const refreshPermissions = async () => {
        try {
            setLoading(true);
            const response = await authApi.getMyPermissions();
            if (response.success && response.data.permissions) {
                setPermissions(response.data.permissions);
            }
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (perms: string[]): boolean => {
        return perms.some(p => permissions.includes(p));
    };

    const hasAllPermissions = (perms: string[]): boolean => {
        return perms.every(p => permissions.includes(p));
    };

    // Fetch permissions on mount if not already loaded
    useEffect(() => {
        if (permissions.length === 0 && !loading) {
            refreshPermissions();
        }
    }, []);

    return (
        <PermissionContext.Provider
            value={{
                permissions,
                loading,
                hasPermission,
                hasAnyPermission,
                hasAllPermissions,
                refreshPermissions,
            }}
        >
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
}

export function useHasPermission(permission: string): boolean {
    const { hasPermission } = usePermissions();
    return hasPermission(permission);
}

export function useHasAnyPermission(permissions: string[]): boolean {
    const { hasAnyPermission } = usePermissions();
    return hasAnyPermission(permissions);
}

export function useHasAllPermissions(permissions: string[]): boolean {
    const { hasAllPermissions } = usePermissions();
    return hasAllPermissions(permissions);
}

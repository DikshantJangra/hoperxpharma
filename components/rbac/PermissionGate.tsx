import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
    permission: string | string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requireAll?: boolean; // If true, requires all permissions in the array. If false (default), requires any.
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    permission,
    children,
    fallback = null,
    requireAll = false,
}) => {
    const { can, canAny, canAll } = usePermissions();

    let hasAccess = false;

    if (typeof permission === 'string') {
        hasAccess = can(permission);
    } else if (Array.isArray(permission)) {
        if (requireAll) {
            hasAccess = canAll(permission);
        } else {
            hasAccess = canAny(permission);
        }
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

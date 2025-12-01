/**
 * Permission to Route Mapping (Frontend)
 * Mirrors backend permission_mapping.js
 * Defines which permissions are required to access specific routes/features
 */

export const ROUTE_PERMISSIONS: Record<string, string | null> = {
    // Dashboard
    '/dashboard': null, // All authenticated users

    // Prescriptions
    '/prescriptions': 'prescription.read',

    // Dispense
    '/dispense': 'prescription.fulfill',

    // Patients
    '/patients': 'patient.read',

    // Inventory
    '/inventory': 'inventory.read',

    // Orders (Purchase Orders)
    '/orders': 'po.read',

    // Suppliers
    '/suppliers': 'po.read',

    // Claims
    '/claims': 'sales.read',

    // POS
    '/pos': 'sales.create',

    // GST
    '/gst': 'report.financial',

    // Finance
    '/finance': 'report.financial',

    // Reports
    '/reports': 'report.sales',

    // Insights
    '/insights': 'report.sales',

    // Messages
    '/messages': null,

    // Engage
    '/engage': 'sales.create',

    // Audit
    '/audit': 'system.audit.view',

    // Regulations
    '/regulations': 'system.audit.view',

    // Store Settings
    '/store': 'system.store.manage',

    // Team/Users Management
    '/users': 'system.user.manage',

    // Integrations
    '/integrations': 'system.settings',

    // Multi-Store
    '/multi-store': 'system.store.manage',

    // Knowledge Base
    '/knowledge': null,

    // Help
    '/help': null,
};

/**
 * Get required permission for a route
 */
export function getRequiredPermission(route: string): string | null {
    // Exact match first
    if (route in ROUTE_PERMISSIONS) {
        return ROUTE_PERMISSIONS[route];
    }

    // Check for parent route (e.g., /inventory/stock -> /inventory)
    const segments = route.split('/').filter(Boolean);
    for (let i = segments.length - 1; i > 0; i--) {
        const parentRoute = '/' + segments.slice(0, i).join('/');
        if (parentRoute in ROUTE_PERMISSIONS) {
            return ROUTE_PERMISSIONS[parentRoute];
        }
    }

    return null;
}

/**
 * Check if user has permission to access a route
 */
export function hasRouteAccess(route: string, userPermissions: string[]): boolean {
    const requiredPermission = getRequiredPermission(route);

    // No permission required - allow access
    if (!requiredPermission) {
        return true;
    }

    // Check if user has the required permission
    return userPermissions.includes(requiredPermission);
}

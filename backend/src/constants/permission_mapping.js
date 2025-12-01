/**
 * Permission to Route Mapping
 * Defines which permissions are required to access specific routes/features
 */

const ROUTE_PERMISSIONS = {
    // Dashboard
    '/dashboard': null, // All authenticated users can access dashboard

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
    '/suppliers': 'po.read', // Suppliers tied to purchase orders

    // Claims
    '/claims': 'sales.read', // Basic read for customer claims

    // POS
    '/pos': 'sales.create',

    // GST
    '/gst': 'report.financial',

    // Finance
    '/finance': 'report.financial',

    // Reports
    '/reports': 'report.sales', // At least one report permission

    // Insights
    '/insights': 'report.sales',

    // Messages
    '/messages': null, // All users can access messages

    // Engage (Loyalty, Coupons)
    '/engage': 'sales.create', // Marketing features for sales staff

    // Audit
    '/audit': 'system.audit.view',

    // Regulations
    '/regulations': 'system.audit.view', // Compliance viewing

    // Store Settings
    '/store': 'system.store.manage',

    // Team/Users Management
    '/users': 'system.user.manage',

    // Integrations
    '/integrations': 'system.settings',

    // Multi-Store
    '/multi-store': 'system.store.manage',

    // Knowledge Base
    '/knowledge': null, // All users can access

    // Help
    '/help': null, // All users can access
};

/**
 * Get required permission for a route
 * @param {string} route - The route path
 * @returns {string|null} Required permission code or null if no permission required
 */
function getRequiredPermission(route) {
    // Exact match first
    if (ROUTE_PERMISSIONS.hasOwnProperty(route)) {
        return ROUTE_PERMISSIONS[route];
    }

    // Check for parent route (e.g., /inventory/stock -> /inventory)
    const segments = route.split('/').filter(Boolean);
    for (let i = segments.length - 1; i > 0; i--) {
        const parentRoute = '/' + segments.slice(0, i).join('/');
        if (ROUTE_PERMISSIONS.hasOwnProperty(parentRoute)) {
            return ROUTE_PERMISSIONS[parentRoute];
        }
    }

    return null;
}

/**
 * Check if user has permission to access a route
 * @param {string} route - The route path
 * @param {string[]} userPermissions - Array of user's permission codes
 * @returns {boolean} True if user has access
 */
function hasRouteAccess(route, userPermissions) {
    const requiredPermission = getRequiredPermission(route);

    // No permission required - allow access
    if (!requiredPermission) {
        return true;
    }

    // Check if user has the required permission
    return userPermissions.includes(requiredPermission);
}

module.exports = {
    ROUTE_PERMISSIONS,
    getRequiredPermission,
    hasRouteAccess,
};

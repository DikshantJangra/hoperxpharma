const ApiError = require('../utils/ApiError');
const { USER_ROLES, MESSAGES } = require('../constants');
const permissionService = require('../services/permissionService');

/**
 * Role-based access control middleware
 * Checks if user has required role
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(ApiError.forbidden(MESSAGES.AUTH.FORBIDDEN));
        }

        next();
    };
};

/**
 * Check if user is admin
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return next(ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED));
    }

    console.log('requireAdmin check:', {
        userId: req.user.id,
        role: req.user.role,
        expectedRole: USER_ROLES.ADMIN,
        matches: req.user.role === USER_ROLES.ADMIN
    });

    if (req.user.role !== USER_ROLES.ADMIN) {
        return next(ApiError.forbidden(MESSAGES.AUTH.FORBIDDEN));
    }

    next();
};

/**
 * Check if user is pharmacist or admin
 */
const requirePharmacist = requireRole(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST);

/**
 * Store access middleware
 * Checks if user has access to the specified store
 */
const requireStoreAccess = async (req, res, next) => {
    if (!req.user) {
        return next(ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED));
    }

    // If stores not loaded, fetch them
    if (!req.user.stores || !Array.isArray(req.user.stores) || req.user.stores.length === 0) {
        try {
            const userRepository = require('../repositories/userRepository');
            const user = await userRepository.findById(req.user.id);

            if (user && user.storeUsers && user.storeUsers.length > 0) {
                req.user.stores = user.storeUsers.map(su => ({
                    id: su.store.id,
                    name: su.store.name,
                    isPrimary: su.isPrimary,
                }));
            } else {
                return next(ApiError.forbidden('You do not have access to any stores. Please complete onboarding first.'));
            }
        } catch (error) {
            return next(ApiError.forbidden('Failed to load store access'));
        }
    }

    // Safely get storeId from params, body, or query
    let storeId = (req.params && req.params.storeId) ||
        (req.body && req.body.storeId) ||
        (req.query && req.query.storeId);

    // DEBUG: Trace where storeId is coming from
    // console.log('RBAC Probe:', { 
    //    params: req.params, 
    //    query: req.query, 
    //    body: req.body, 
    //    storeIdFound: storeId 
    // });

    // Sanity check: If storeId looks like a search term (e.g. not a UUID/ID format if we used UUIDs, 
    // but here we might just check if it matches search param), ignore it.
    // This is a Patch for the current issue where "Aerotide" is ending up as storeId
    if (storeId && req.query && req.query.search && storeId === req.query.search) {
        console.warn('RBAC Warning: storeId matches search term, ignoring suspect value:', storeId);
        storeId = null;
    }

    // If no storeId is provided, use the user's primary store
    if (!storeId) {
        // Use primary store or first store
        const primaryStore = req.user.stores.find(s => s.isPrimary) || req.user.stores[0];
        if (primaryStore) {
            storeId = primaryStore.id;
        } else {
            return next(ApiError.forbidden('No store found for user'));
        }
    }

    // Admin has access to all stores
    if (req.user.role === USER_ROLES.ADMIN) {
        req.storeId = storeId;
        return next();
    }

    // Check if user has stores array
    if (!req.user.stores || !Array.isArray(req.user.stores) || req.user.stores.length === 0) {
        return next(ApiError.forbidden('You do not have access to any stores. Please complete onboarding first.'));
    }

    // Check if user has access to this store
    const hasAccess = req.user.stores.some(store => store.id === storeId);

    if (!hasAccess) {
        return next(ApiError.forbidden('You do not have access to this store'));
    }

    // Attach storeId to request for convenience
    req.storeId = storeId;

    next();
};

/**
 * Permission-based access control
 * Checks if user has required permission(s) - ALL permissions required (AND logic)
 * ADMIN role bypasses all permission checks
 */
const requirePermission = (...permissions) => {
    return async (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED));
        }

        // ADMIN role bypasses all permission checks
        if (req.user.role === USER_ROLES.ADMIN) {
            return next();
        }

        const storeId = req.storeId ||
            (req.params && req.params.storeId) ||
            (req.body && req.body.storeId) ||
            (req.query && req.query.storeId) ||
            null;

        try {
            // Check each required permission
            for (const permission of permissions) {
                const hasPermission = await permissionService.hasPermission(
                    req.user.id,
                    permission,
                    storeId
                );

                if (!hasPermission) {
                    // Log permission denial for monitoring
                    console.warn('Permission denied:', {
                        userId: req.user.id,
                        permission,
                        storeId,
                        path: req.path,
                        method: req.method,
                    });

                    return next(ApiError.forbidden(
                        `You do not have permission: ${permission}`
                    ));
                }
            }

            next();
        } catch (error) {
            console.error('Permission check failed:', error);
            return next(ApiError.internal('Permission check failed'));
        }
    };
};

/**
 * Require ANY of the specified permissions (OR logic)
 * ADMIN role bypasses all permission checks
 */
const requireAnyPermission = (...permissions) => {
    return async (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED));
        }

        // ADMIN role bypasses all permission checks
        if (req.user.role === USER_ROLES.ADMIN) {
            return next();
        }

        const storeId = req.storeId ||
            (req.params && req.params.storeId) ||
            (req.body && req.body.storeId) ||
            (req.query && req.query.storeId) ||
            null;

        try {
            for (const permission of permissions) {
                const hasPermission = await permissionService.hasPermission(
                    req.user.id,
                    permission,
                    storeId
                );

                if (hasPermission) {
                    return next(); // User has at least one permission
                }
            }

            // None of the permissions matched
            console.warn('Permission denied (any):', {
                userId: req.user.id,
                permissions,
                storeId,
                path: req.path,
                method: req.method,
            });

            return next(ApiError.forbidden(
                `You need one of these permissions: ${permissions.join(', ')}`
            ));
        } catch (error) {
            console.error('Permission check failed:', error);
            return next(ApiError.internal('Permission check failed'));
        }
    };
};

module.exports = {
    requireRole,
    requireAdmin,
    requirePharmacist,
    requireStoreAccess,
    requirePermission,
    requireAnyPermission,
};

const ApiError = require('../utils/ApiError');
const { USER_ROLES, MESSAGES } = require('../utils/constants');

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
const requireAdmin = requireRole(USER_ROLES.ADMIN);

/**
 * Check if user is pharmacist or admin
 */
const requirePharmacist = requireRole(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST);

/**
 * Store access middleware
 * Checks if user has access to the specified store
 */
const requireStoreAccess = (req, res, next) => {
    if (!req.user) {
        return next(ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED));
    }

    const storeId = req.params.storeId || req.body.storeId || req.query.storeId;

    if (!storeId) {
        return next(ApiError.badRequest('Store ID is required'));
    }

    // Admin has access to all stores
    if (req.user.role === USER_ROLES.ADMIN) {
        req.storeId = storeId;
        return next();
    }

    // Check if user has stores array
    if (!req.user.stores || !Array.isArray(req.user.stores)) {
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
 * Note: This is a placeholder for future permission system
 */
const requirePermission = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED));
        }

        // TODO: Implement permission checking against Role-Permission table
        // For now, admins have all permissions
        if (req.user.role === USER_ROLES.ADMIN) {
            return next();
        }

        // Placeholder: deny access for non-admins
        return next(ApiError.forbidden('Insufficient permissions'));
    };
};

module.exports = {
    requireRole,
    requireAdmin,
    requirePharmacist,
    requireStoreAccess,
    requirePermission,
};

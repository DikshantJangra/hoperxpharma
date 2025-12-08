const { verifyAccessToken } = require('../services/auth/tokenService');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const { MESSAGES } = require('../constants');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyAccessToken(token);

        // Get user from database with store information
        const user = await userRepository.findById(decoded.userId);

        if (!user || !user.isActive) {
            throw ApiError.unauthorized('User not found or inactive');
        }

        // Find primary store
        const primaryStoreUser = user.storeUsers?.find(su => su.isPrimary);

        // Attach user to request with complete store information
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            primaryStore: primaryStoreUser ? {
                id: primaryStoreUser.store.id,
                name: primaryStoreUser.store.name
            } : null,
            storeUsers: user.storeUsers?.map(su => ({
                storeId: su.store.id,
                storeName: su.store.name,
                isPrimary: su.isPrimary,
            })) || [],
            stores: user.storeUsers?.map(su => ({
                id: su.store.id,
                name: su.store.name,
                isPrimary: su.isPrimary,
            })) || [],
            storeId: primaryStoreUser?.store.id || user.storeUsers?.[0]?.store.id,
        };

        // Also set storeId directly for convenience (from primary store or first store)
        req.storeId = primaryStoreUser?.store.id || user.storeUsers?.[0]?.store.id;

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
        } else {
            next(ApiError.unauthorized(MESSAGES.AUTH.TOKEN_INVALID));
        }
    }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyAccessToken(token);
            const user = await userRepository.findById(decoded.userId);

            if (user && user.isActive) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                };
            }
        }

        next();
    } catch (error) {
        // Silently fail for optional auth
        next();
    }
};

module.exports = { authenticate, optionalAuth };

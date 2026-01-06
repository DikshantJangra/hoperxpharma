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
        // Get token from header (preferred for explicit auth) or cookie (implicit)
        let token;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
        }

        // Fallback to cookie if header not present
        if (!token && req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            throw ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED);
        }

        // Debug logging for Auth flow
        // console.log('[Auth] Token verification started');
        const decoded = verifyAccessToken(token);
        // console.log('[Auth] Token decoded, userId:', decoded.userId);

        // Get user from database with store information
        const user = await userRepository.findById(decoded.userId);

        if (!user) {
            // console.log('[Auth] User not found for ID:', decoded.userId);
            throw ApiError.unauthorized('User not found');
        }

        if (!user.isActive) {
            // console.log('[Auth] User found but inactive:', decoded.userId);
            throw ApiError.unauthorized('User account is inactive');
        }

        // console.log('[Auth] User found:', user.email);
        // console.log('[Auth] StoreUsers:', user.storeUsers?.length);

        // Find primary store
        const primaryStoreUser = user.storeUsers?.find(su => su.isPrimary);
        // console.log('[Auth] Primary Store:', primaryStoreUser?.store?.id);

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


        // console.log('[Auth] Assigned req.user.storeId:', req.user.storeId);

        // Also set storeId directly for convenience (from primary store or first store)
        req.storeId = primaryStoreUser?.store.id || user.storeUsers?.[0]?.store.id;
        // console.log('[Auth] Assigned req.storeId:', req.storeId);

        next();
    } catch (error) {
        console.error('[Auth] Error:', error);
        if (error instanceof ApiError) {
            next(error);
        } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            next(ApiError.unauthorized(MESSAGES.AUTH.TOKEN_INVALID));
        } else {
            // Pass system/DB errors as is (will be 500)
            next(error);
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

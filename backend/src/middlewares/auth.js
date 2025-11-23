const { verifyAccessToken } = require('../services/auth/tokenService');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const { MESSAGES } = require('../utils/constants');

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

        // Get user from database
        const user = await userRepository.findById(decoded.userId);

        if (!user || !user.isActive) {
            throw ApiError.unauthorized('User not found or inactive');
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            stores: user.storeUsers?.map(su => ({
                id: su.store.id,
                name: su.store.name,
                isPrimary: su.isPrimary,
            })) || [],
        };

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

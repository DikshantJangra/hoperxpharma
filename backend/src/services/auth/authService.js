const bcrypt = require('bcrypt');
const userRepository = require('../../repositories/userRepository');
const { generateTokens, verifyRefreshToken } = require('./tokenService');
const ApiError = require('../../utils/ApiError');
const { MESSAGES } = require('../../constants');
const logger = require('../../config/logger');

/**
 * Authentication Service - Business logic for authentication
 */
class AuthService {
    /**
     * Register a new user
     */
    async signup(userData) {
        const { email, phoneNumber, password, firstName, lastName, role } = userData;

        // Check if user already exists
        const existingUser = await userRepository.existsByEmailOrPhone(email, phoneNumber);
        if (existingUser) {
            throw ApiError.conflict(MESSAGES.AUTH.USER_EXISTS);
        }

        // Check if this is the first user in the system
        const allUsers = await userRepository.findAll();
        const isFirstUser = allUsers.length === 0;

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Determine user role:
        // - If role is explicitly provided (e.g., when admin adds staff), use that
        // - Otherwise, default to ADMIN (new signups from /signup should be store owners)
        // - PHARMACIST, TECHNICIAN, CASHIER roles are only assigned when admin adds staff members
        const userRole = role || 'ADMIN';

        // Create user
        const user = await userRepository.create({
            email,
            phoneNumber,
            passwordHash,
            firstName,
            lastName,
            role: userRole,
        });

        // Generate tokens
        const tokens = generateTokens(user.id, user.role);

        logger.info(`New user registered: ${user.email} (role: ${user.role}, firstUser: ${isFirstUser})`);

        // Return clean user object
        return {
            user: JSON.parse(JSON.stringify(user)),
            ...tokens,
        };
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Find user by email
        const user = await userRepository.findByEmail(email);

        if (!user) {
            throw ApiError.unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS);
        }

        // Check if user is active
        if (!user.isActive) {
            throw ApiError.forbidden('Account is inactive. Please contact support.');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw ApiError.unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS);
        }

        // Generate tokens
        const tokens = generateTokens(user.id, user.role);

        // Fetch user permissions
        const permissionService = require('../permissionService');
        const permissions = await permissionService.getUserPermissions(user.id);

        logger.info(`User logged in: ${user.email}`);

        // Remove password from response
        const { passwordHash, pinHash, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            permissions, // Include permissions array
            ...tokens,
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            logger.warn('Refresh token missing in request');
            throw ApiError.unauthorized('Refresh token is required');
        }

        try {
            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);
            logger.info(`Refresh token verified for user: ${decoded.userId}`);

            // Get user
            const user = await userRepository.findById(decoded.userId);

            if (!user) {
                logger.warn(`Refresh token used for non-existent user: ${decoded.userId}`);
                throw ApiError.unauthorized('User not found');
            }

            if (!user.isActive) {
                logger.warn(`Refresh token used for inactive user: ${user.email}`);
                throw ApiError.forbidden('Account is inactive. Please contact support.');
            }

            // Generate new tokens
            const tokens = generateTokens(user.id, user.role);
            logger.info(`New tokens generated for user: ${user.email}`);

            return tokens;
        } catch (error) {
            // Distinguish between different error types
            if (error.name === 'TokenExpiredError') {
                logger.warn('Refresh token expired');
                throw ApiError.unauthorized('Refresh token has expired. Please login again.');
            } else if (error.name === 'JsonWebTokenError') {
                logger.warn('Invalid refresh token');
                throw ApiError.unauthorized('Invalid refresh token. Please login again.');
            } else if (error instanceof ApiError) {
                // Re-throw ApiErrors as-is
                throw error;
            } else {
                logger.error('Unexpected error during token refresh:', error);
                throw ApiError.unauthorized(MESSAGES.AUTH.TOKEN_INVALID);
            }
        }
    }

    /**
     * Get user profile
     */
    async getProfile(userId) {
        const user = await userRepository.getUserWithStores(userId);

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // Remove sensitive data
        const { passwordHash, approvalPin, ...userProfile } = user;

        return userProfile;
    }
}

module.exports = new AuthService();

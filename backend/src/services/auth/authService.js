const bcrypt = require('bcrypt');
const userRepository = require('../../repositories/userRepository');
const { generateTokens, verifyRefreshToken } = require('./tokenService');
const ApiError = require('../../utils/ApiError');
const { MESSAGES } = require('../../utils/constants');
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

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await userRepository.create({
            email,
            phoneNumber,
            passwordHash,
            firstName,
            lastName,
            role: role || 'PHARMACIST',
        });

        // Generate tokens
        const tokens = generateTokens(user.id, user.role);

        logger.info(`New user registered: ${user.email}`);

        return {
            user,
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

        logger.info(`User logged in: ${user.email}`);

        // Remove password from response
        const { passwordHash, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            ...tokens,
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);

            // Get user
            const user = await userRepository.findById(decoded.userId);

            if (!user || !user.isActive) {
                throw ApiError.unauthorized('User not found or inactive');
            }

            // Generate new tokens
            const tokens = generateTokens(user.id, user.role);

            return tokens;
        } catch (error) {
            throw ApiError.unauthorized(MESSAGES.AUTH.TOKEN_INVALID);
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

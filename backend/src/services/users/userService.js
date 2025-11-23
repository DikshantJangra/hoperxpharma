const userRepository = require('../../repositories/userRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * User Service - Business logic for user operations
 */
class UserService {
    /**
     * Get complete user profile with stores
     */
    async getUserProfile(userId) {
        const user = await userRepository.getUserWithStores(userId);

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // Remove sensitive data
        const { passwordHash, approvalPin, ...userProfile } = user;

        return userProfile;
    }

    /**
     * Get user's primary store with complete details
     */
    async getPrimaryStore(userId) {
        const user = await userRepository.getUserWithStores(userId);

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // Find primary store
        const primaryStoreUser = user.storeUsers?.find(su => su.isPrimary);

        if (!primaryStoreUser) {
            throw ApiError.notFound('No primary store found for user');
        }

        return primaryStoreUser.store;
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId, updateData) {
        // Validate that only allowed fields are being updated
        const allowedFields = ['firstName', 'lastName', 'phoneNumber'];
        const filteredData = {};

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        }

        if (Object.keys(filteredData).length === 0) {
            throw ApiError.badRequest('No valid fields to update');
        }

        const updatedUser = await userRepository.update(userId, filteredData);

        logger.info(`User profile updated: ${userId}`);

        return updatedUser;
    }

    /**
     * Check if user has completed onboarding
     */
    async hasCompletedOnboarding(userId) {
        const user = await userRepository.getUserWithStores(userId);

        if (!user) {
            return false;
        }

        // User has completed onboarding if they have at least one store
        return user.storeUsers && user.storeUsers.length > 0;
    }
}

module.exports = new UserService();

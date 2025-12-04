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
    /**
     * Get all users (filtered by requesting user's stores)
     */
    async getAllUsers(requestingUserId) {
        const db = require('../../config/database');
        const prisma = db.getClient();

        // Get requesting user's stores
        const requestingUser = await userRepository.getUserWithStores(requestingUserId);

        if (!requestingUser) {
            throw ApiError.notFound('Requesting user not found');
        }

        // Get all store IDs the requesting user has access to
        const storeIds = requestingUser.storeUsers.map(su => su.storeId);

        // If user has no stores, return empty array
        if (storeIds.length === 0) {
            return [];
        }

        // Find all users who belong to any of these stores
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null,
                storeUsers: {
                    some: {
                        storeId: {
                            in: storeIds
                        }
                    }
                }
            },
            include: {
                storeUsers: {
                    include: {
                        store: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                userRoles: {
                    include: {
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Remove sensitive data
        return users.map(user => {
            const { passwordHash, pinHash, approvalPin, ...safeUser } = user;
            return safeUser;
        });
    }

    /**
     * Create new user with role and optional PIN (Team Hub one-shot creation)
     */
    async createUser(userData) {
        const { email, phoneNumber, password, roleId, pin, firstName, lastName, storeIds } = userData;

        // Validate required fields (lastName and phoneNumber are optional)
        if (!email || !firstName) {
            throw ApiError.badRequest('Missing required fields: email, firstName');
        }

        // Validate store assignment
        if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
            throw ApiError.badRequest('At least one store must be assigned to the user');
        }

        // Check if user exists (only check email if no phone provided)
        if (phoneNumber) {
            const exists = await userRepository.existsByEmailOrPhone(email, phoneNumber);
            if (exists) {
                throw ApiError.conflict('User with this email or phone number already exists');
            }
        } else {
            const exists = await userRepository.findByEmail(email);
            if (exists) {
                throw ApiError.conflict('User with this email already exists');
            }
        }

        const bcrypt = require('bcryptjs');

        // Hash password (generate random if not provided)
        const passwordHash = await bcrypt.hash(password || this._generateTemporaryPassword(), 12);

        // Hash PIN if provided
        const pinHash = pin ? await bcrypt.hash(pin, 12) : null;

        // Create user with role assignment in transaction
        const db = require('../../config/database');
        const prisma = db.getClient();

        // Use first store for audit log
        const primaryStoreId = storeIds[0];

        const newUser = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email,
                    phoneNumber: phoneNumber || null,
                    firstName,
                    lastName: lastName || null,
                    passwordHash,
                    pinHash,
                    isActive: true,
                    role: 'PHARMACIST', // Default role for backward compatibility
                },
            });


            // Assign role if roleId provided (new RBAC system)
            if (roleId) {
                await tx.userRoleAssignment.create({
                    data: {
                        userId: user.id,
                        roleId,
                        // assignedBy will be set by controller
                    },
                });
            }

            // Assign user to selected stores
            for (let i = 0; i < storeIds.length; i++) {
                await tx.storeUser.create({
                    data: {
                        userId: user.id,
                        storeId: storeIds[i],
                        isPrimary: i === 0, // First store is primary
                    },
                });
            }

            // Create audit log
            await tx.auditLog.create({
                data: {
                    storeId: primaryStoreId,
                    userId: userData.createdBy || user.id,
                    action: 'USER_CREATED',
                    entityType: 'User',
                    entityId: user.id,
                    changes: {
                        roleId,
                        hasPin: !!pin,
                        email,
                        assignedStores: storeIds,
                    },
                },
            });

            return user;
        });

        logger.info(`User created: ${newUser.id} (${email})`);

        // Remove sensitive data before returning
        const { passwordHash: _, pinHash: __, ...userProfile } = newUser;
        return userProfile;
    }

    /**
     * Generate a temporary password for new users
     * @private
     */
    _generateTemporaryPassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Update user details (Admin) - supports role and PIN updates
     */
    async updateUser(userId, updateData, updatedBy) {
        const { firstName, lastName, phoneNumber, role, roleId, pin, isActive, storeIds } = updateData;

        const updates = {};
        if (firstName !== undefined) updates.firstName = firstName;
        if (lastName !== undefined) updates.lastName = lastName;
        if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
        if (role !== undefined) updates.role = role; // Enum fallback
        if (typeof isActive === 'boolean') updates.isActive = isActive;

        // Hash new PIN if provided
        if (pin) {
            const bcrypt = require('bcryptjs');
            updates.pinHash = await bcrypt.hash(pin, 12);
            updates.pinAttempts = 0; // Reset attempts
            updates.pinLockedUntil = null; // Clear lockout
        }

        const db = require('../../config/database');
        const prisma = db.getClient();

        // Get updater's store for audit log
        let storeId;
        if (updatedBy) {
            try {
                const store = await this.getPrimaryStore(updatedBy);
                storeId = store.id;
            } catch (e) {
                const user = await userRepository.getUserWithStores(updatedBy);
                storeId = user?.storeUsers?.[0]?.storeId;
            }
        }

        if (!storeId) {
            const firstStore = await prisma.store.findFirst();
            storeId = firstStore?.id;
        }

        const updatedUser = await prisma.$transaction(async (tx) => {
            // Update user
            const user = await tx.user.update({
                where: { id: userId },
                data: updates,
            });

            // Update role if roleId changed
            if (roleId) {
                // Remove existing role assignments
                await tx.userRoleAssignment.deleteMany({
                    where: { userId },
                });

                // Create new role assignment
                await tx.userRoleAssignment.create({
                    data: {
                        userId,
                        roleId,
                        assignedBy: updatedBy,
                    },
                });
            }

            // Update store assignments if storeIds provided
            if (storeIds && Array.isArray(storeIds)) {
                // Remove existing store assignments
                await tx.storeUser.deleteMany({
                    where: { userId },
                });

                // Create new store assignments
                for (let i = 0; i < storeIds.length; i++) {
                    await tx.storeUser.create({
                        data: {
                            userId,
                            storeId: storeIds[i],
                            isPrimary: i === 0, // First store is primary
                        },
                    });
                }
            }

            // Create audit log
            if (storeId) {
                await tx.auditLog.create({
                    data: {
                        storeId,
                        userId: updatedBy || userId,
                        action: 'USER_UPDATED',
                        entityType: 'User',
                        entityId: userId,
                        changes: {
                            updates: Object.keys(updates),
                            roleId,
                            hasNewPin: !!pin,
                        },
                    },
                });
            }

            return user;
        });

        logger.info(`User updated: ${userId}`);

        return updatedUser;
    }

    /**
     * Toggle user active status
     */
    async toggleUserStatus(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // Prevent deactivating self
        // Note: This check should ideally be in controller or have context passed here

        return await userRepository.update(userId, {
            isActive: !user.isActive
        });
    }

    /**
     * Soft delete user
     */
    async deleteUser(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        return await userRepository.softDelete(userId);
    }

    /**
     * Reset user PIN
     */
    async resetUserPin(userId, newPin, resetBy) {
        const bcrypt = require('bcryptjs');
        const db = require('../../config/database');
        const prisma = db.getClient();

        const pinHash = await bcrypt.hash(newPin, 12);

        // Get resetter's store for audit log
        let storeId;
        if (resetBy) {
            try {
                const store = await this.getPrimaryStore(resetBy);
                storeId = store.id;
            } catch (e) {
                const user = await userRepository.getUserWithStores(resetBy);
                storeId = user?.storeUsers?.[0]?.storeId;
            }
        }

        if (!storeId) {
            const firstStore = await prisma.store.findFirst();
            storeId = firstStore?.id;
        }

        const updatedUser = await prisma.$transaction(async (tx) => {
            // Update PIN
            const user = await tx.user.update({
                where: { id: userId },
                data: {
                    pinHash,
                    pinAttempts: 0,
                    pinLockedUntil: null,
                },
            });

            // Audit log
            if (storeId) {
                await tx.auditLog.create({
                    data: {
                        storeId,
                        userId: resetBy,
                        action: 'USER_PIN_RESET',
                        entityType: 'User',
                        entityId: userId,
                        changes: {
                            resetBy,
                        },
                    },
                });
            }

            return user;
        });

        logger.info(`PIN reset for user: ${userId}`);
        return updatedUser;
    }

    /**
     * Get user activity (audit logs and access logs)
     */
    async getUserActivity(userId, limit = 20) {
        const db = require('../../config/database');
        const prisma = db.getClient();

        const [auditLogs, accessLogs] = await Promise.all([
            prisma.auditLog.findMany({
                where: {
                    OR: [
                        { userId },
                        { targetId: userId, targetType: 'User' },
                    ],
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma.accessLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
        ]);

        return {
            auditLogs,
            accessLogs,
        };
    }
}

module.exports = new UserService();

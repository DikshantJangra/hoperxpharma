const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');
const permissionService = require('./permissionService');

class UserRoleService {
    /**
     * Get all roles assigned to a user
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    async getUserRoles(userId) {
        const userRoles = await prisma.userRoleAssignment.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                    },
                },
            },
            orderBy: {
                assignedAt: 'desc',
            },
        });

        return userRoles;
    }

    /**
     * Assign a role to a user
     * @param {string} userId
     * @param {string} roleId
     * @param {string} storeId - optional, null for global role
     * @param {string} assignedBy - User ID who is assigning
     * @returns {Promise<object>}
     */
    async assignRole(userId, roleId, storeId, assignedBy) {
        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // Verify role exists
        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw ApiError.notFound('Role not found');
        }

        // If storeId provided, verify store exists
        if (storeId) {
            const store = await prisma.store.findUnique({
                where: { id: storeId },
            });

            if (!store) {
                throw ApiError.notFound('Store not found');
            }
        }

        // Check if assignment already exists
        const existing = await prisma.userRoleAssignment.findFirst({
            where: {
                userId,
                roleId,
                storeId,
            },
        });

        if (existing) {
            throw ApiError.badRequest('User already has this role for the specified scope');
        }

        // Create assignment
        const assignment = await prisma.userRoleAssignment.create({
            data: {
                userId,
                roleId,
                storeId,
                assignedBy,
            },
            include: {
                role: true,
                store: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Invalidate permission cache for this user
        permissionService.invalidateUserCache(userId);

        return assignment;
    }

    /**
     * Remove a role from a user
     * @param {string} userId
     * @param {string} roleId
     * @param {string} removedBy - User ID who is removing
     * @param {string} storeId - optional
     * @returns {Promise<void>}
     */
    async removeRole(userId, roleId, removedBy, storeId = null) {
        const assignment = await prisma.userRoleAssignment.findFirst({
            where: {
                userId,
                roleId,
                storeId,
            },
        });

        if (!assignment) {
            throw ApiError.notFound('Role assignment not found');
        }

        await prisma.userRoleAssignment.delete({
            where: {
                id: assignment.id,
            },
        });

        // Invalidate permission cache for this user
        permissionService.invalidateUserCache(userId);
    }

    /**
     * Get all users with a specific role
     * @param {string} roleId
     * @param {string} storeId - optional filter by store
     * @returns {Promise<Array>}
     */
    async getUsersWithRole(roleId, storeId = null) {
        const where = { roleId };
        if (storeId) {
            where.storeId = storeId;
        }

        return await prisma.userRoleAssignment.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    /**
     * Bulk assign roles to multiple users
     * @param {string[]} userIds
     * @param {string} roleId
     * @param {string} storeId - optional
     * @param {string} assignedBy
     * @returns {Promise<number>} Count of assignments created
     */
    async bulkAssignRole(userIds, roleId, storeId, assignedBy) {
        let count = 0;

        for (const userId of userIds) {
            try {
                await this.assignRole(userId, roleId, storeId, assignedBy);
                count++;
            } catch (error) {
                // Skip if already assigned or user doesn't exist
                console.warn(`Failed to assign role to user ${userId}:`, error.message);
            }
        }

        return count;
    }
}

module.exports = new UserRoleService();

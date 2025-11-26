const prisma = require('../db/prisma');
const { USER_ROLES } = require('../constants/roles');
const { LRUCache } = require('lru-cache');

// Cache for role-permission mappings (5 min TTL)
const permissionCache = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 5, // 5 minutes
});

class PermissionService {
    /**
     * Check if user has a specific permission
     * @param {string} userId
     * @param {string} permissionCode - e.g., 'patient.create'
     * @param {string} storeId - optional store context
     * @returns {Promise<boolean>}
     */
    async hasPermission(userId, permissionCode, storeId = null) {
        try {
            // Get user with roles
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        where: storeId ? {
                            OR: [
                                { storeId: null },      // Global roles
                                { storeId: storeId },   // Store-specific roles
                            ],
                        } : { storeId: null },      // Only global roles if no store context
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
                        },
                    },
                },
            });

            if (!user) return false;

            // ADMIN bypass - admins have all permissions (based on User.role enum)
            if (user.role === USER_ROLES.ADMIN) return true;

            // Check user's assigned roles for the permission
            for (const userRole of user.userRoles) {
                const role = userRole.role;

                // Check if role has the permission
                const hasPermission = role.permissions.some(
                    rp => rp.permission.code === permissionCode
                );

                if (hasPermission) {
                    // If no store context, global permission granted
                    if (!storeId) return true;

                    // If role is global (no storeId), permission granted
                    if (!userRole.storeId) return true;

                    // If role is for this specific store, permission granted
                    if (userRole.storeId === storeId) return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }

    /**
     * Get all effective permissions for a user
     * @param {string} userId
     * @param {string} storeId - optional store context
     * @returns {Promise<string[]>} Array of permission codes
     */
    async getUserPermissions(userId, storeId = null) {
        const cacheKey = `user:${userId}:store:${storeId || 'global'}`;
        const cached = permissionCache.get(cacheKey);
        if (cached) return cached;

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        where: storeId ? {
                            OR: [
                                { storeId: null },      // Global roles
                                { storeId: storeId },   // Store-specific roles
                            ],
                        } : { storeId: null },
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
                        },
                    },
                },
            });

            if (!user) return [];

            // ADMIN has all permissions
            if (user.role === USER_ROLES.ADMIN) {
                const allPermissions = await prisma.permission.findMany();
                const codes = allPermissions.map(p => p.code);
                permissionCache.set(cacheKey, codes);
                return codes;
            }

            // Collect unique permissions from all roles
            const permissionSet = new Set();
            user.userRoles.forEach(userRole => {
                userRole.role.permissions.forEach(rp => {
                    permissionSet.add(rp.permission.code);
                });
            });

            const permissions = Array.from(permissionSet);
            permissionCache.set(cacheKey, permissions);
            return permissions;
        } catch (error) {
            console.error('Error getting user permissions:', error);
            return [];
        }
    }

    /**
     * Check if user has a specific role
     * @param {string} userId
     * @param {string} roleName
     * @param {string} storeId - optional store context
     * @returns {Promise<boolean>}
     */
    async hasRole(userId, roleName, storeId = null) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        where: storeId ? {
                            OR: [
                                { storeId: null },
                                { storeId: storeId },
                            ],
                        } : { storeId: null },
                        include: { role: true },
                    },
                },
            });

            if (!user) return false;

            return user.userRoles.some(ur => ur.role.name === roleName);
        } catch (error) {
            console.error('Error checking role:', error);
            return false;
        }
    }

    /**
     * Invalidate cache for a user
     * @param {string} userId
     */
    invalidateUserCache(userId) {
        const keys = Array.from(permissionCache.keys());
        keys.forEach(key => {
            if (key.startsWith(`user:${userId}:`)) {
                permissionCache.delete(key);
            }
        });
    }

    /**
     * Clear all permission cache
     */
    clearCache() {
        permissionCache.clear();
    }
}

module.exports = new PermissionService();

const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');
const permissionService = require('./permissionService');

class RoleService {
    /**
     * Get all roles (filtered by user's store)
     * @param {string} userId - Requesting user ID
     * @returns {Promise<Array>}
     */
    async getAllRoles(userId) {
        // Get user's stores
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                storeUsers: true
            }
        });

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        const storeIds = user.storeUsers.map(su => su.storeId);

        // Return built-in roles + roles created by user's stores
        return await prisma.role.findMany({
            where: {
                OR: [
                    { builtIn: true }, // Built-in roles are global
                    { storeId: { in: storeIds } } // Custom roles from user's stores
                ]
            },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { userRoles: true },
                },
            },
            orderBy: [
                { builtIn: 'desc' },
                { name: 'asc' },
            ],
        });
    }

    /**
     * Get role by ID
     * @param {string} roleId
     * @returns {Promise<object>}
     */
    async getRoleById(roleId) {
        const role = await prisma.role.findUnique({
            where: { id: roleId },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                userRoles: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        store: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!role) {
            throw ApiError.notFound('Role not found');
        }

        return role;
    }

    /**
     * Create a new custom role
     * @param {object} data
     * @param {string} createdBy - User ID
     * @returns {Promise<object>}
     */
    async createRole(data, createdBy) {
        const { name, description, category, permissionIds } = data;

        // Get creator's primary store
        const user = await prisma.user.findUnique({
            where: { id: createdBy },
            include: {
                storeUsers: {
                    where: { isPrimary: true }
                }
            }
        });

        if (!user || !user.storeUsers || user.storeUsers.length === 0) {
            throw ApiError.badRequest('User must have a primary store to create roles');
        }

        const storeId = user.storeUsers[0].storeId;

        // Check if role name already exists
        const existing = await prisma.role.findUnique({
            where: { name },
        });

        if (existing) {
            throw ApiError.badRequest('Role with this name already exists');
        }

        // Create role linked to the store
        const role = await prisma.role.create({
            data: {
                name,
                description,
                category,
                builtIn: false,
                storeId, // Link to creator's store
            },
        });

        // Add permissions if provided
        if (permissionIds && permissionIds.length > 0) {
            await this.addPermissions(role.id, permissionIds, createdBy);
        }

        return await this.getRoleById(role.id);
    }

    /**
     * Update a role
     * @param {string} roleId
     * @param {object} data
     * @param {string} updatedBy - User ID
     * @returns {Promise<object>}
     */
    async updateRole(roleId, data, updatedBy) {
        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw ApiError.notFound('Role not found');
        }

        const { name, description, category, permissionIds } = data;

        // For built-in roles, only allow permission updates
        if (role.builtIn) {
            if (name || description || category) {
                throw ApiError.forbidden('Cannot modify name, description, or category of built-in roles. You can only update permissions.');
            }

            // Only update permissions for built-in roles
            if (permissionIds && Array.isArray(permissionIds)) {
                // Remove existing permissions
                await prisma.rolePermission.deleteMany({
                    where: { roleId },
                });

                // Add new permissions
                if (permissionIds.length > 0) {
                    await prisma.rolePermission.createMany({
                        data: permissionIds.map(permissionId => ({
                            roleId,
                            permissionId,
                        })),
                    });
                }

                // Return updated role with permissions
                return await prisma.role.findUnique({
                    where: { id: roleId },
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                        _count: {
                            select: {
                                userRoles: true,
                            },
                        },
                    },
                });
            }

            throw ApiError.badRequest('No valid updates provided for built-in role');
        }

        // Check if new name conflicts with existing role (for non-built-in roles)
        if (name && name !== role.name) {
            const existing = await prisma.role.findUnique({
                where: { name },
            });

            if (existing) {
                throw ApiError.badRequest('Role with this name already exists');
            }
        }

        const updated = await prisma.role.update({
            where: { id: roleId },
            data: {
                name,
                description,
                category,
            },
        });

        return await this.getRoleById(updated.id);
    }

    /**
     * Delete a role
     * @param {string} roleId
     * @param {string} deletedBy - User ID
     * @returns {Promise<void>}
     */
    async deleteRole(roleId, deletedBy) {
        const role = await prisma.role.findUnique({
            where: { id: roleId },
            include: {
                _count: {
                    select: { userRoles: true },
                },
            },
        });

        if (!role) {
            throw ApiError.notFound('Role not found');
        }

        // Prevent deleting built-in roles
        if (role.builtIn) {
            throw ApiError.forbidden('Cannot delete built-in roles');
        }

        // Check if role is assigned to any users
        if (role._count.userRoles > 0) {
            throw ApiError.badRequest(
                `Cannot delete role. It is assigned to ${role._count.userRoles} user(s).`
            );
        }

        await prisma.role.delete({
            where: { id: roleId },
        });
    }

    /**
     * Add permissions to a role
     * @param {string} roleId
     * @param {string[]} permissionIds
     * @param {string} updatedBy - User ID
     * @returns {Promise<object>}
     */
    async addPermissions(roleId, permissionIds, updatedBy) {
        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw ApiError.notFound('Role not found');
        }

        // Prevent modifying built-in roles
        if (role.builtIn) {
            throw ApiError.forbidden('Cannot modify built-in roles');
        }

        // Verify all permission IDs exist
        const permissions = await prisma.permission.findMany({
            where: {
                id: {
                    in: permissionIds,
                },
            },
        });

        if (permissions.length !== permissionIds.length) {
            throw ApiError.badRequest('One or more invalid permission IDs');
        }

        // Add permissions (upsert to avoid duplicates)
        for (const permissionId of permissionIds) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId,
                        permissionId,
                    },
                },
                create: {
                    roleId,
                    permissionId,
                },
                update: {},
            });
        }

        return await this.getRoleById(roleId);
    }

    /**
     * Remove a permission from a role
     * @param {string} roleId
     * @param {string} permissionId
     * @param {string} updatedBy - User ID
     * @returns {Promise<void>}
     */
    async removePermission(roleId, permissionId, updatedBy) {
        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw ApiError.notFound('Role not found');
        }

        // Prevent modifying built-in roles
        if (role.builtIn) {
            throw ApiError.forbidden('Cannot modify built-in roles');
        }

        await prisma.rolePermission.delete({
            where: {
                roleId_permissionId: {
                    roleId,
                    permissionId,
                },
            },
        });
    }

    /**
     * Clone a role with all its permissions
     * @param {string} sourceRoleId
     * @param {string} newName
     * @param {string} clonedBy - User ID
     * @returns {Promise<object>}
     */
    async cloneRole(sourceRoleId, newName, clonedBy) {
        const sourceRole = await this.getRoleById(sourceRoleId);

        if (!sourceRole) {
            throw ApiError.notFound('Source role not found');
        }

        // Check if new name already exists
        const existing = await prisma.role.findUnique({
            where: { name: newName },
        });

        if (existing) {
            throw ApiError.badRequest('Role with this name already exists');
        }

        // Get permission IDs from source role
        const permissionIds = sourceRole.permissions.map(rp => rp.permissionId);

        // Create new role with same permissions
        const clonedRole = await this.createRole({
            name: newName,
            description: sourceRole.description ? `${sourceRole.description} (Copy)` : null,
            category: sourceRole.category,
            permissionIds,
        }, clonedBy);

        return clonedRole;
    }

    /**
     * Get role summary (for dropdowns)
     * @returns {Promise<Array>}
     */
    async getRoleSummary() {
        return await prisma.role.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                category: true,
                builtIn: true,
                _count: {
                    select: {
                        userRoles: true,
                        permissions: true,
                    },
                },
            },
            orderBy: [
                { builtIn: 'desc' },
                { name: 'asc' },
            ],
        });
    }
}

module.exports = new RoleService();

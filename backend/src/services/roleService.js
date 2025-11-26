const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');
const permissionService = require('./permissionService');

class RoleService {
    /**
     * Get all roles
     * @returns {Promise<Array>}
     */
    async getAllRoles() {
        return await prisma.role.findMany({
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

        // Check if role name already exists
        const existing = await prisma.role.findUnique({
            where: { name },
        });

        if (existing) {
            throw ApiError.badRequest('Role with this name already exists');
        }

        // Create role
        const role = await prisma.role.create({
            data: {
                name,
                description,
                category,
                builtIn: false,
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

        // Prevent updating built-in roles
        if (role.builtIn) {
            throw ApiError.forbidden('Cannot modify built-in roles');
        }

        const { name, description, category } = data;

        // Check if new name conflicts with existing role
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
}

module.exports = new RoleService();

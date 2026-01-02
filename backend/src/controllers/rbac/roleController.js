const roleService = require('../../services/roleService');
const logger = require('../../config/logger');
const asyncHandler = require('../../middlewares/asyncHandler');

/**
 * @route   GET /api/rbac/roles
 * @desc    Get all roles
 * @access  Admin
 */
exports.listRoles = asyncHandler(async (req, res) => {
    const roles = await roleService.getAllRoles(req.user.id);

    logger.info('🔍 Roles API Debug:');
    logger.info('Total roles:', roles.length);
    logger.info('Built-in roles:', roles.filter(r => r.builtIn).map(r => r.name));
    logger.info('Custom roles:', roles.filter(r => !r.builtIn).map(r => r.name));

    res.json({
        success: true,
        data: roles,
    });
});

/**
 * @route   GET /api/rbac/roles/:id
 * @desc    Get role by ID
 * @access  Admin
 */
exports.getRole = asyncHandler(async (req, res) => {
    const role = await roleService.getRoleById(req.params.id);

    res.json({
        success: true,
        data: role,
    });
});

/**
 * @route   POST /api/rbac/roles
 * @desc    Create new custom role
 * @access  Admin
 */
exports.createRole = asyncHandler(async (req, res) => {
    const role = await roleService.createRole(req.body, req.user.id);

    res.status(201).json({
        success: true,
        data: role,
        message: 'Role created successfully',
    });
});

/**
 * @route   PUT /api/rbac/roles/:id
 * @desc    Update role
 * @access  Admin
 */
exports.updateRole = asyncHandler(async (req, res) => {
    const role = await roleService.updateRole(req.params.id, req.body, req.user.id);

    res.json({
        success: true,
        data: role,
        message: 'Role updated successfully',
    });
});

/**
 * @route   DELETE /api/rbac/roles/:id
 * @desc    Delete role
 * @access  Admin
 */
exports.deleteRole = asyncHandler(async (req, res) => {
    await roleService.deleteRole(req.params.id, req.user.id);

    res.json({
        success: true,
        message: 'Role deleted successfully',
    });
});

/**
 * @route   POST /api/rbac/roles/:id/permissions
 * @desc    Add permissions to role
 * @access  Admin
 */
exports.addPermissionsToRole = asyncHandler(async (req, res) => {
    const { permissionIds } = req.body;

    const role = await roleService.addPermissions(
        req.params.id,
        permissionIds,
        req.user.id
    );

    res.json({
        success: true,
        data: role,
        message: 'Permissions added to role',
    });
});

/**
 * @route   DELETE /api/rbac/roles/:id/permissions/:permissionId
 * @desc    Remove permission from role
 * @access  Admin
 */
exports.removePermissionFromRole = asyncHandler(async (req, res) => {
    await roleService.removePermission(
        req.params.id,
        req.params.permissionId,
        req.user.id
    );

    res.json({
        success: true,
        message: 'Permission removed from role',
    });
});

/**
 * @route   POST /api/rbac/roles/:id/clone
 * @desc    Clone a role with all permissions
 * @access  Admin
 */
exports.cloneRole = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) {
        throw new ApiError(400, 'New role name is required');
    }

    const clonedRole = await roleService.cloneRole(
        req.params.id,
        name,
        req.user.id
    );

    res.status(201).json({
        success: true,
        data: clonedRole,
        message: 'Role cloned successfully',
    });
});

/**
 * @route   GET /api/rbac/roles/summary
 * @desc    Get role summary for dropdowns
 * @access  Authenticated
 */
exports.getRoleSummary = asyncHandler(async (req, res) => {
    const roles = await roleService.getRoleSummary();

    res.json({
        success: true,
        data: roles,
    });
});

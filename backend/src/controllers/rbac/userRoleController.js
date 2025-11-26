const userRoleService = require('../../services/userRoleService');
const asyncHandler = require('../../middlewares/asyncHandler');

/**
 * @route   GET /api/rbac/users/:userId/roles
 * @desc    Get all roles assigned to a user
 * @access  Admin
 */
exports.getUserRoles = asyncHandler(async (req, res) => {
    const roles = await userRoleService.getUserRoles(req.params.userId);

    res.json({
        success: true,
        data: roles,
    });
});

/**
 * @route   POST /api/rbac/users/:userId/roles
 * @desc    Assign role to user
 * @access  Admin
 */
exports.assignRole = asyncHandler(async (req, res) => {
    const { roleId, storeId } = req.body;

    const assignment = await userRoleService.assignRole(
        req.params.userId,
        roleId,
        storeId || null,
        req.user.id
    );

    res.status(201).json({
        success: true,
        data: assignment,
        message: 'Role assigned successfully',
    });
});

/**
 * @route   DELETE /api/rbac/users/:userId/roles/:roleId
 * @desc    Remove role from user
 * @access  Admin
 */
exports.removeRole = asyncHandler(async (req, res) => {
    const { storeId } = req.query;

    await userRoleService.removeRole(
        req.params.userId,
        req.params.roleId,
        req.user.id,
        storeId || null
    );

    res.json({
        success: true,
        message: 'Role removed successfully',
    });
});

/**
 * @route   GET /api/rbac/roles/:roleId/users
 * @desc    Get all users with a specific role
 * @access  Admin
 */
exports.getUsersWithRole = asyncHandler(async (req, res) => {
    const { storeId } = req.query;

    const users = await userRoleService.getUsersWithRole(
        req.params.roleId,
        storeId || null
    );

    res.json({
        success: true,
        data: users,
    });
});

/**
 * @route   POST /api/rbac/roles/:roleId/users/bulk
 * @desc    Bulk assign role to multiple users
 * @access  Admin
 */
exports.bulkAssignRole = asyncHandler(async (req, res) => {
    const { userIds, storeId } = req.body;

    const count = await userRoleService.bulkAssignRole(
        userIds,
        req.params.roleId,
        storeId || null,
        req.user.id
    );

    res.json({
        success: true,
        data: { assignedCount: count },
        message: `Role assigned to ${count} user(s)`,
    });
});

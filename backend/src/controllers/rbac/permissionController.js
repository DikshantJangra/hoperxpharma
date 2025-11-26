const prisma = require('../../db/prisma');
const permissionService = require('../../services/permissionService');
const asyncHandler = require('../../middlewares/asyncHandler');

/**
 * @route   GET /api/rbac/permissions
 * @desc    Get all permissions (grouped by category)
 * @access  Authenticated
 */
exports.listPermissions = asyncHandler(async (req, res) => {
    const permissions = await prisma.permission.findMany({
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });

    // Group by category
    const grouped = permissions.reduce((acc, perm) => {
        if (!acc[perm.category]) {
            acc[perm.category] = [];
        }
        acc[perm.category].push(perm);
        return acc;
    }, {});

    res.json({
        success: true,
        data: grouped,
    });
});

/**
 * @route   GET /api/rbac/permissions/:id
 * @desc    Get permission by ID
 * @access  Authenticated
 */
exports.getPermission = asyncHandler(async (req, res) => {
    const permission = await prisma.permission.findUnique({
        where: { id: req.params.id },
        include: {
            roles: {
                include: {
                    role: true,
                },
            },
        },
    });

    if (!permission) {
        return res.status(404).json({
            success: false,
            message: 'Permission not found',
        });
    }

    res.json({
        success: true,
        data: permission,
    });
});

/**
 * @route   GET /api/rbac/users/:userId/permissions
 * @desc    Get effective permissions for a user
 * @access  Admin or Self
 */
exports.getUserPermissions = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const storeId = req.query.storeId;

    // Only allow users to view their own permissions unless they're admin
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'You can only view your own permissions',
        });
    }

    const permissions = await permissionService.getUserPermissions(userId, storeId);

    res.json({
        success: true,
        data: permissions,
    });
});

/**
 * @route   GET /api/rbac/me/permissions
 * @desc    Get current user's effective permissions
 * @access  Authenticated
 */
exports.getMyPermissions = asyncHandler(async (req, res) => {
    const storeId = req.query.storeId;
    const permissions = await permissionService.getUserPermissions(req.user.id, storeId);

    res.json({
        success: true,
        data: permissions,
    });
});

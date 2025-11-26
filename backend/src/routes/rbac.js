const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { requirePermission, requireAdmin } = require('../middlewares/rbac');
const { PERMISSIONS } = require('../constants/permissions');

const roleController = require('../controllers/rbac/roleController');
const permissionController = require('../controllers/rbac/permissionController');
const userRoleController = require('../controllers/rbac/userRoleController');
const adminPinController = require('../controllers/rbac/adminPinController');

// All RBAC routes require authentication
router.use(requireAuth);

// ============================================================================
// ROLE MANAGEMENT ROUTES
// ============================================================================

router.get(
    '/roles',
    requirePermission(PERMISSIONS.SYSTEM_ROLE_MANAGE),
    roleController.listRoles
);

router.post(
    '/roles',
    requirePermission(PERMISSIONS.SYSTEM_ROLE_MANAGE),
    roleController.createRole
);

router.get(
    '/roles/:id',
    requirePermission(PERMISSIONS.SYSTEM_ROLE_MANAGE),
    roleController.getRole
);

router.put(
    '/roles/:id',
    requirePermission(PERMISSIONS.SYSTEM_ROLE_MANAGE),
    roleController.updateRole
);

router.delete(
    '/roles/:id',
    requirePermission(PERMISSIONS.SYSTEM_ROLE_MANAGE),
    roleController.deleteRole
);

router.post(
    '/roles/:id/permissions',
    requirePermission(PERMISSIONS.SYSTEM_ROLE_MANAGE),
    roleController.addPermissionsToRole
);

router.delete(
    '/roles/:id/permissions/:permissionId',
    requirePermission(PERMISSIONS.SYSTEM_ROLE_MANAGE),
    roleController.removePermissionFromRole
);

// ============================================================================
// PERMISSION ROUTES
// ============================================================================

router.get(
    '/permissions',
    permissionController.listPermissions
);

router.get(
    '/permissions/:id',
    permissionController.getPermission
);

router.get(
    '/me/permissions',
    permissionController.getMyPermissions
);

router.get(
    '/users/:userId/permissions',
    permissionController.getUserPermissions
);

// ============================================================================
// USER ROLE ASSIGNMENT ROUTES
// ============================================================================

router.get(
    '/users/:userId/roles',
    requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE),
    userRoleController.getUserRoles
);

router.post(
    '/users/:userId/roles',
    requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE),
    userRoleController.assignRole
);

router.delete(
    '/users/:userId/roles/:roleId',
    requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE),
    userRoleController.removeRole
);

router.get(
    '/roles/:roleId/users',
    requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE),
    userRoleController.getUsersWithRole
);

router.post(
    '/roles/:roleId/users/bulk',
    requirePermission(PERMISSIONS.SYSTEM_USER_MANAGE),
    userRoleController.bulkAssignRole
);

// ============================================================================
// ADMIN PIN ROUTES
// ============================================================================

router.post(
    '/admin/pin/setup',
    requireAdmin,
    adminPinController.setupPin
);

router.post(
    '/admin/pin/verify',
    requireAdmin,
    adminPinController.verifyPin
);

router.put(
    '/admin/pin/change',
    requireAdmin,
    adminPinController.changePin
);

router.get(
    '/admin/pin/status',
    requireAdmin,
    adminPinController.getPinStatus
);

module.exports = router;

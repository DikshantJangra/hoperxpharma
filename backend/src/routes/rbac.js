const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requirePermission, requireAdmin } = require('../middlewares/rbac');
const { PERMISSIONS } = require('../constants/permissions');

const roleController = require('../controllers/rbac/roleController');
const permissionController = require('../controllers/rbac/permissionController');
const userRoleController = require('../controllers/rbac/userRoleController');
const adminPinController = require('../controllers/rbac/adminPinController');

// All RBAC routes require authentication
router.use(authenticate);

// ============================================================================
// ROLE MANAGEMENT ROUTES
// ============================================================================

router.get(
    '/roles/summary',
    roleController.getRoleSummary  // Get role summary for dropdowns
);

router.get(
    '/roles',
    roleController.listRoles  // Authenticated users can view roles
);

router.post(
    '/roles',
    requireAdmin,  // Only admins can create roles
    roleController.createRole
);

router.get(
    '/roles/:id',
    roleController.getRole  // Authenticated users can view role details
);

router.put(
    '/roles/:id',
    requireAdmin,  // Only admins can update roles
    roleController.updateRole
);

router.delete(
    '/roles/:id',
    requireAdmin,  // Only admins can delete roles
    roleController.deleteRole
);

router.post(
    '/roles/:id/permissions',
    requireAdmin,  // Only admins can add permissions
    roleController.addPermissionsToRole
);

router.delete(
    '/roles/:id/permissions/:permissionId',
    requireAdmin,  // Only admins can remove permissions
    roleController.removePermissionFromRole
);

router.post(
    '/roles/:id/clone',
    requireAdmin,  // Only admins can clone roles
    roleController.cloneRole
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
    userRoleController.getUserRoles  // Authenticated users can view user roles
);

router.post(
    '/users/:userId/roles',
    requireAdmin,  // Only admins can assign roles
    userRoleController.assignRole
);

router.delete(
    '/users/:userId/roles/:roleId',
    requireAdmin,  // Only admins can remove roles
    userRoleController.removeRole
);

router.get(
    '/roles/:roleId/users',
    userRoleController.getUsersWithRole  // Authenticated users can view users with a role
);

router.post(
    '/roles/:roleId/users/bulk',
    requireAdmin,  // Only admins can bulk assign roles
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

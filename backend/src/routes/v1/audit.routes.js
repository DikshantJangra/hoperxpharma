const express = require('express');
const auditController = require('../../controllers/audit/auditController');
const accessLogController = require('../../controllers/audit/accessLogController');
const exportController = require('../../controllers/audit/exportController');
const { authenticate } = require('../../middlewares/auth');
const { requirePermission, requireStoreAccess } = require('../../middlewares/rbac');

const router = express.Router();

// All audit routes require authentication and store access
router.use(authenticate);
router.use(requireStoreAccess);

// Activity Log Routes
router.get('/activity', requirePermission('audit.view'), auditController.getActivityLogs);
router.get('/activity/stats', requirePermission('audit.view'), auditController.getActivityStats);
router.get('/activity/:id', requirePermission('audit.view'), auditController.getActivityById);
router.post('/activity/search', requirePermission('audit.view'), auditController.searchActivities);
router.get(
    '/activity/entity/:entityType/:entityId',
    requirePermission('audit.view'),
    auditController.getActivityByEntity
);

// Access Log Routes
router.get('/access', requirePermission('audit.view'), accessLogController.getAccessLogs);
router.get('/access/stats', requirePermission('audit.view'), accessLogController.getAccessStats);
router.get('/access/suspicious', requirePermission('audit.view'), accessLogController.getSuspiciousActivities);
router.get('/access/:id', requirePermission('audit.view'), accessLogController.getAccessById);
router.get('/access/failed/:userId', requirePermission('audit.view'), accessLogController.getFailedAttempts);
router.post('/access/search', requirePermission('audit.view'), accessLogController.searchAccessLogs);

// Export Routes
router.post('/exports', requirePermission('audit.export'), exportController.createExport);
router.get('/exports', requirePermission('audit.export'), exportController.getExports);
router.get('/exports/:id', requirePermission('audit.export'), exportController.getExportById);
router.get('/exports/:id/download', requirePermission('audit.export'), exportController.downloadExport);
router.delete('/exports/:id', requirePermission('audit.export'), exportController.deleteExport);

// Saved Filter Routes
const savedFilterController = require('../../controllers/audit/savedFilterController');
router.post('/filters', savedFilterController.createSavedFilter);
router.get('/filters', savedFilterController.getSavedFilters);
router.delete('/filters/:id', savedFilterController.deleteSavedFilter);

module.exports = router;

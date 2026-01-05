const express = require('express');
const router = express.Router();
const alertController = require('../../controllers/alerts/alert.controller');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess } = require('../../middlewares/rbac');

// All routes require authentication and store access
router.use(authenticate);
router.use(requireStoreAccess);

// Alert listing & counts
router.get('/', alertController.getAlerts);
router.get('/count', alertController.getAlertCounts);
router.get('/counts', alertController.getAlertCounts); // Alias

// Preferences (TODO: implement in controller if needed)
// router.get('/preferences', alertController.getPreferences);
// router.put('/preferences', alertController.updatePreferences);

// Bulk operations
router.post('/bulk/dismiss', alertController.bulkDismiss);

// Single alert operations
router.get('/:id', alertController.getAlertById);
router.post('/', alertController.createAlert);
router.patch('/:id/acknowledge', alertController.acknowledgeAlert);
router.patch('/:id/seen', alertController.acknowledgeAlert); // Alias
router.patch('/:id/resolve', alertController.resolveAlert);
router.patch('/:id/snooze', alertController.snoozeAlert);
router.patch('/:id/dismiss', alertController.dismissAlert);
router.delete('/:id', alertController.deleteAlert);

module.exports = router;

const express = require('express');
const router = express.Router();
const alertController = require('../../controllers/alerts/alert.controller');
const { authenticate } = require('../../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Alert routes
router.get('/', alertController.getAlerts);
router.get('/count', alertController.getAlertCounts);
router.get('/:id', alertController.getAlertById);
router.post('/', alertController.createAlert);
router.patch('/:id/acknowledge', alertController.acknowledgeAlert);
router.patch('/:id/resolve', alertController.resolveAlert);
router.patch('/:id/snooze', alertController.snoozeAlert);
router.patch('/:id/dismiss', alertController.dismissAlert);
router.delete('/:id', alertController.deleteAlert);

module.exports = router;

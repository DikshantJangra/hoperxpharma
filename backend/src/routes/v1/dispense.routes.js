const express = require('express');
const router = express.Router();
const dispenseController = require('../../controllers/dispense/dispenseController');
const { authenticate } = require('../../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Get dispense queue
router.get('/queue', dispenseController.getQueue.bind(dispenseController));

// Start fill workflow
router.post('/:prescriptionId/start', dispenseController.startFill.bind(dispenseController));

// Scan barcode (safety-critical)
router.post('/:dispenseEventId/scan', dispenseController.scanBarcode.bind(dispenseController));

// Release (pharmacist only - checked in controller)
router.post('/:dispenseEventId/release', dispenseController.release.bind(dispenseController));

module.exports = router;

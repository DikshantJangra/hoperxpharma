const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const gdprController = require('../controllers/gdpr/gdprController');

/**
 * GDPR Compliance Routes
 * All routes require authentication
 */

// Data Export
router.get('/export', authenticate, gdprController.exportUserData);
router.get('/exports', authenticate, gdprController.getExportHistory);

// Account Deletion
router.post('/delete-account', authenticate, gdprController.requestAccountDeletion);

// Consent Management
router.post('/consent', authenticate, gdprController.updateConsent);

module.exports = router;

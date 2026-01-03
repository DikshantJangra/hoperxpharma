/**
 * Platform Configuration Routes
 * Secret routes for platform-wide settings
 */

const express = require('express');
const router = express.Router();
const {
    verifyPassword,
    getEmailConfig,
    saveEmailConfig,
    testEmailConnection,
    deleteEmailConfig,
    getEmailStatus
} = require('../controllers/platformConfigController');

// Public route - check if email is configured (for login page)
router.get('/email-status', getEmailStatus);

// Setup routes - accessible via known secret path (hrp-2026ml)
router.post('/setup/:secret/verify-password', verifyPassword);
router.get('/setup/:secret/email', getEmailConfig);
router.post('/setup/:secret/email', saveEmailConfig);
router.post('/setup/:secret/email/test', testEmailConnection);
router.delete('/setup/:secret/email', deleteEmailConfig);

module.exports = router;

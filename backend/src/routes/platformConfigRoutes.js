/**
 * Platform Configuration Routes
 * Secret routes for platform-wide settings
 */

const express = require('express');
const router = express.Router();
const {
    verifyPassword,
    getEmailConfig,
    testEmailConnection,
    deleteEmailConfig,
    getEmailStatus,
    getGmailAuthUrl,
    disconnectGmail
} = require('../controllers/platformConfigController');
const platformGmailOAuthService = require('../services/platformGmailOAuthService');

// Public route - check if email is configured (for login page)
router.get('/email-status', getEmailStatus);

// Gmail OAuth callback (no secret needed in URL - callback from Google)
router.get('/gmail/callback', async (req, res) => {
    const { code, error, state } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error) {
        return res.redirect(`${frontendUrl}/setup/hrp-ml-config?error=${encodeURIComponent(error)}`);
    }

    try {
        // Decode state to get secret (if we passed it)
        const stateData = state ? JSON.parse(Buffer.from(state, 'base64').toString()) : {};
        const secret = stateData.secret || 'hrp-ml-config'; // Fallback to default if somehow missing

        await platformGmailOAuthService.handleCallback(code);

        // Redirect back to the setup page using the secret
        return res.redirect(`${frontendUrl}/setup/${secret}?success=gmail_connected`);
    } catch (err) {
        return res.redirect(`${frontendUrl}/setup/hrp-ml-config?error=${encodeURIComponent(err.message)}`);
    }
});

// Setup routes - accessible via known secret path (hrp-2026ml)
router.post('/setup/:secret/verify-password', verifyPassword);
router.get('/setup/:secret/email', getEmailConfig);
// router.post('/setup/:secret/email', saveEmailConfig); // SMTP Save Removed
router.post('/setup/:secret/email/test', testEmailConnection);
router.delete('/setup/:secret/email', deleteEmailConfig);

// Gmail OAuth routes
router.get('/setup/:secret/gmail/auth', getGmailAuthUrl);
router.post('/setup/:secret/gmail/disconnect', disconnectGmail);

module.exports = router;


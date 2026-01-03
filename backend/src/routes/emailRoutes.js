const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const emailValidator = require('../validators/emailValidator');
const storeGmailOAuthService = require('../services/storeGmailOAuthService');
const logger = require('../config/logger');

// ============================================================================
// Gmail OAuth Routes (callback must be before auth middleware)
// ============================================================================

// Check if OAuth is available (public)
router.get('/gmail/status', (req, res) => {
    res.json({
        success: true,
        available: storeGmailOAuthService.isConfigured()
    });
});

// Gmail OAuth callback (no auth - redirect from Google)
router.get('/gmail/callback', async (req, res) => {
    const { code, error, state } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error) {
        logger.error('Gmail OAuth error:', error);
        return res.redirect(`${frontendUrl}/messages/email?error=${encodeURIComponent(error)}`);
    }

    try {
        // Decode state to get storeId
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const { storeId } = stateData;

        if (!storeId) {
            throw new Error('Missing store context');
        }

        const result = await storeGmailOAuthService.handleCallback(code, storeId);

        return res.redirect(`${frontendUrl}/messages/email?success=gmail_connected&email=${encodeURIComponent(result.email)}`);
    } catch (err) {
        logger.error('Gmail OAuth callback failed:', err);
        return res.redirect(`${frontendUrl}/messages/email?error=${encodeURIComponent(err.message)}`);
    }
});

// All routes below require authentication
router.use(authenticate);

// Get Gmail OAuth URL (requires auth to get storeId)
router.get('/gmail/auth-url', asyncHandler(async (req, res) => {
    // Get storeId from authenticated user - handle various structures
    let storeId = null;

    if (req.user) {
        storeId = req.user.storeId ||
            req.user.primaryStore?.id ||
            (req.user.storeUsers && req.user.storeUsers[0]?.storeId) ||
            (req.user.stores && req.user.stores[0]?.id);
    }

    if (!storeId) {
        storeId = req.storeId;
    }

    if (!storeId) {
        logger.warn('Gmail OAuth: No store context found for user', { userId: req.user?.id });
        return res.status(400).json({
            success: false,
            message: 'No store found. Please complete onboarding first.'
        });
    }

    if (!storeGmailOAuthService.isConfigured()) {
        return res.status(400).json({
            success: false,
            message: 'Gmail OAuth not configured on this platform'
        });
    }

    const authUrl = storeGmailOAuthService.getAuthUrl(storeId);

    res.json({
        success: true,
        authUrl
    });
}));

// Disconnect Gmail OAuth account
router.post('/gmail/disconnect/:accountId', asyncHandler(async (req, res) => {
    const storeId = req.user.storeId || req.storeId;
    const { accountId } = req.params;

    const result = await storeGmailOAuthService.disconnect(accountId, storeId);

    res.json(result);
}));

// Test Gmail OAuth connection
router.post('/gmail/test/:accountId', asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    const result = await storeGmailOAuthService.testConnection(accountId);

    res.json(result);
}));

// Get OAuth accounts for store
router.get('/gmail/accounts', asyncHandler(async (req, res) => {
    const storeId = req.user.storeId || req.storeId;

    const result = await storeGmailOAuthService.getStoreOAuthStatus(storeId);

    res.json({
        success: true,
        ...result
    });
}));

// ============================================================================
// Email Account Management (existing routes)
// ============================================================================


// Email Account Management
router.post('/configure',
    asyncHandler(emailController.configureEmailAccount.bind(emailController))
);

// Get all accounts (NEW)
router.get('/accounts',
    asyncHandler(emailController.getAllEmailAccounts.bind(emailController))
);

// Get specific account (NEW)
router.get('/accounts/:accountId',
    asyncHandler(emailController.getEmailAccountById.bind(emailController))
);

// Set primary account (NEW)
router.put('/accounts/:accountId/primary',
    asyncHandler(emailController.setPrimaryAccount.bind(emailController))
);

// Update specific account (NEW)
router.put('/accounts/:accountId',
    asyncHandler(emailController.updateEmailAccountById.bind(emailController))
);

// Delete specific account (NEW)
router.delete('/accounts/:accountId',
    asyncHandler(emailController.deleteEmailAccountById.bind(emailController))
);

// Backward compatibility routes
router.get('/account',
    asyncHandler(emailController.getEmailAccount.bind(emailController))
);

router.put('/account',
    asyncHandler(emailController.updateEmailAccount.bind(emailController))
);

router.delete('/account',
    asyncHandler(emailController.deleteEmailAccount.bind(emailController))
);

// Connection Testing
router.post('/test-connection',
    asyncHandler(emailController.testConnection.bind(emailController))
);

router.post('/send-test',
    asyncHandler(emailController.sendTestEmail.bind(emailController))
);

// Email Sending
router.post('/send',
    asyncHandler(emailController.sendEmail.bind(emailController))
);

// Email Logs
router.get('/logs',
    asyncHandler(emailController.getEmailLogs.bind(emailController))
);


router.post('/logs/:logId/retry',
    asyncHandler(emailController.retryFailedEmail.bind(emailController))
);

// Contact Search & Groups  
const emailContactController = require('../controllers/emailContactController');

router.get('/contacts/search',
    asyncHandler(emailContactController.searchContacts.bind(emailContactController))
);

router.get('/groups',
    asyncHandler(emailContactController.getRecipientGroups.bind(emailContactController))
);

router.get('/groups/:groupId/recipients',
    asyncHandler(emailContactController.getGroupRecipients.bind(emailContactController))
);

// Email Attachments
const emailUpload = require('../middlewares/emailUpload');
const attachmentController = require('../controllers/attachmentController');

router.post('/attachments/upload',
    emailUpload.single('file'),
    asyncHandler(attachmentController.uploadAttachment)
);

router.delete('/attachments/:filename',
    asyncHandler(attachmentController.deleteEmailAttachment)
);

// Email Templates
router.post('/templates',
    asyncHandler(emailController.createTemplate.bind(emailController))
);

router.get('/templates',
    asyncHandler(emailController.getTemplates.bind(emailController))
);

router.get('/templates/:templateId',
    asyncHandler(emailController.getTemplateById.bind(emailController))
);

router.put('/templates/:templateId',
    asyncHandler(emailController.updateTemplate.bind(emailController))
);

router.delete('/templates/:templateId',
    asyncHandler(emailController.deleteTemplate.bind(emailController))
);

router.post('/templates/:templateId/render',
    asyncHandler(emailController.renderTemplate.bind(emailController))
);

module.exports = router;

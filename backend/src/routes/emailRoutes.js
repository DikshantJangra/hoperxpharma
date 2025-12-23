const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const emailValidator = require('../validators/emailValidator');

// All routes require authentication
router.use(authenticate);

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

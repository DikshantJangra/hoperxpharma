/**
 * WhatsApp Routes
 * API endpoints for WhatsApp Business integration
 */

const express = require('express');
const router = express.Router();

const whatsappController = require('../controllers/whatsapp/whatsappController');
const webhookController = require('../controllers/whatsapp/webhookController');
const messagingController = require('../controllers/whatsapp/messagingController');
const templateController = require('../controllers/whatsapp/templateController');

// Webhook endpoints (no auth required - Meta validation via signature)
router.get('/webhook', webhookController.handleWebhookVerification);
router.post('/webhook', webhookController.handleWebhook);

// Connection management
router.post('/connect', whatsappController.handleEmbeddedSignup);
router.post('/finalize', whatsappController.finalizeSetup);
router.post('/manual-token', whatsappController.manualTokenSetup);
router.get('/status/:storeId', whatsappController.getStatus);
router.post('/verify-phone', whatsappController.verifyPhone);
router.delete('/disconnect/:storeId', whatsappController.disconnect);
router.post('/test-message/:storeId', whatsappController.sendTestMessage);

// Conversations & messaging
router.get('/conversations/:storeId', messagingController.getConversations);
router.get('/messages/:conversationId', messagingController.getMessages);
router.post('/send', messagingController.sendMessage);
router.post('/send-template', messagingController.sendTemplate);
router.patch('/conversations/:id/status', messagingController.updateConversationStatus);
router.patch('/conversations/:id/assign', messagingController.assignConversation);

// Templates
router.get('/templates/:storeId', templateController.getTemplates);
router.post('/templates', templateController.createTemplate);
router.post('/templates/:storeId/sync', templateController.syncTemplates);
router.delete('/templates/:id', templateController.deleteTemplate);

module.exports = router;

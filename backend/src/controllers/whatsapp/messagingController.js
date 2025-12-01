/**
 * Messaging Controller
 * Handles sending messages and managing conversations
 */

const whatsappAccountRepo = require('../../repositories/whatsappAccountRepository');
const conversationRepo = require('../../repositories/conversationRepository');
const messageRepo = require('../../repositories/messageRepository');
const templateRepo = require('../../repositories/templateRepository');
const whatsappService = require('../../services/whatsappService');

/**
 * Get conversations for a store
 * GET /api/whatsapp/conversations/:storeId
 */
async function getConversations(req, res) {
    try {
        const { storeId } = req.params;
        const { status, search, skip = 0, take = 50 } = req.query;

        const conversations = await conversationRepo.findByStore(
            storeId,
            { status, search },
            parseInt(skip, 10),
            parseInt(take, 10)
        );

        res.json({ conversations });
    } catch (error) {
        console.error('[Messaging] Get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get messages for a conversation
 * GET /api/whatsapp/messages/:conversationId
 */
async function getMessages(req, res) {
    try {
        const { conversationId } = req.params;
        const { skip = 0, take = 50 } = req.query;

        const messages = await messageRepo.findByConversation(
            conversationId,
            parseInt(skip, 10),
            parseInt(take, 10)
        );

        // Reset unread count when messages are viewed
        await conversationRepo.resetUnread(conversationId);

        res.json({ messages });
    } catch (error) {
        console.error('[Messaging] Get messages error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Send text message
 * POST /api/whatsapp/send
 */
async function sendMessage(req, res) {
    try {
        const { conversationId, body, type = 'text' } = req.body;

        if (!conversationId || !body) {
            return res.status(400).json({ error: 'Missing conversationId or body' });
        }

        // Get conversation
        const conversation = await conversationRepo.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Get WhatsApp account with decrypted token
        const account = await whatsappAccountRepo.findByStoreId(conversation.storeId, true);

        if (!account || account.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        // Check 24-hour window (simplified - should check last customer message)
        const sessionExpired = !conversation.sessionActive;

        if (sessionExpired) {
            return res.status(400).json({
                error: 'Session expired. Use a template to start a new conversation.',
                requiresTemplate: true,
            });
        }

        // Send via Meta API
        const result = await whatsappService.sendTextMessage(
            account.phoneNumberId,
            conversation.phoneNumber,
            body,
            account.accessToken
        );

        // Save to database
        const message = await messageRepo.createOutbound({
            conversationId,
            storeId: conversation.storeId,
            providerMessageId: result.messages[0].id,
            wabaPhoneNumberId: account.phoneNumberId,
            type,
            body,
            from: account.phoneNumber,
            to: conversation.phoneNumber,
            status: 'sent',
            sentAt: new Date(),
        });

        // Update conversation
        await conversationRepo.upsertByPhone(conversation.storeId, account.id, conversation.phoneNumber, {
            lastMessageBody: body,
        });

        res.json({ success: true, message });
    } catch (error) {
        console.error('[Messaging] Send message error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Send template message
 * POST /api/whatsapp/send-template
 */
async function sendTemplate(req, res) {
    try {
        const { conversationId, templateName, templateLanguage = 'en', parameters = [] } = req.body;

        if (!conversationId || !templateName) {
            return res.status(400).json({ error: 'Missing conversationId or templateName' });
        }

        // Get conversation
        const conversation = await conversationRepo.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Get WhatsApp account
        const account = await whatsappAccountRepo.findByStoreId(conversation.storeId, true);

        if (!account || account.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        // Build template components
        const components = [];

        if (parameters.length > 0) {
            components.push({
                type: 'body',
                parameters: parameters.map(p => ({ type: 'text', text: p })),
            });
        }

        // Send template
        const result = await whatsappService.sendTemplateMessage(
            account.phoneNumberId,
            conversation.phoneNumber,
            {
                name: templateName,
                language: templateLanguage,
                components,
            },
            account.accessToken
        );

        // Save to database
        const message = await messageRepo.createOutbound({
            conversationId,
            storeId: conversation.storeId,
            providerMessageId: result.messages[0].id,
            wabaPhoneNumberId: account.phoneNumberId,
            type: 'template',
            templateName,
            templateLanguage,
            templateParams: parameters,
            from: account.phoneNumber,
            to: conversation.phoneNumber,
            status: 'sent',
            sentAt: new Date(),
        });

        // Reactivate session
        await conversationRepo.upsertByPhone(conversation.storeId, account.id, conversation.phoneNumber, {
            sessionActive: true,
            lastCustomerMessageAt: new Date(),
        });

        res.json({ success: true, message });
    } catch (error) {
        console.error('[Messaging] Send template error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Update conversation status
 * PATCH /api/whatsapp/conversations/:id/status
 */
async function updateConversationStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Missing status' });
        }

        const conversation = await conversationRepo.updateStatus(id, status);

        res.json({ success: true, conversation });
    } catch (error) {
        console.error('[Messaging] Update status error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Assign conversation to agent
 * PATCH /api/whatsapp/conversations/:id/assign
 */
async function assignConversation(req, res) {
    try {
        const { id } = req.params;
        const { agentId } = req.body;

        const conversation = await conversationRepo.assignAgent(id, agentId);

        res.json({ success: true, conversation });
    } catch (error) {
        console.error('[Messaging] Assign conversation error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
    sendTemplate,
    updateConversationStatus,
    assignConversation,
};

/**
 * WhatsApp Webhook Controller
 * Handles incoming webhooks from Meta WhatsApp Cloud API
 * Routes messages to correct store based on phone_number_id
 */

const { verifyWebhookSignature, verifyWebhookChallenge } = require('../../utils/webhookVerification');
const whatsappAccountRepo = require('../../repositories/whatsappAccountRepository');
const conversationRepo = require('../../repositories/conversationRepository');
const messageRepo = require('../../repositories/messageRepository');
const templateRepo = require('../../repositories/templateRepository');
const whatsappService = require('../../services/whatsappService');

/**
 * Webhook GET handler - Meta verification challenge
 * GET /webhook/whatsapp
 */
async function handleWebhookVerification(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'hoperx_whatsapp_verify';

    const result = verifyWebhookChallenge(mode, token, challenge, verifyToken);

    if (result) {
        return res.status(200).send(result);
    }

    res.status(403).send('Forbidden');
}

/**
 * Webhook POST handler - Incoming messages and status updates
 * POST /webhook/whatsapp
 */
async function handleWebhook(req, res) {
    try {
        // Verify signature
        const appSecret = process.env.FB_APP_SECRET;
        if (appSecret && !verifyWebhookSignature(req, appSecret)) {
            console.warn('[Webhook] Invalid signature');
            return res.status(401).send('Invalid signature');
        }

        // Acknowledge webhook immediately
        res.status(200).send('EVENT_RECEIVED');

        // Process asynchronously (don't block response)
        setImmediate(async () => {
            try {
                await processWebhookData(req.body);
            } catch (error) {
                console.error('[Webhook] Processing error:', error);
            }
        });
    } catch (error) {
        console.error('[Webhook] Handler error:', error);
        res.status(500).send('Internal error');
    }
}

/**
 * Process webhook data
 * @param {Object} data - Webhook payload from Meta
 */
async function processWebhookData(data) {
    const entries = data.entry || [];

    for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
            const value = change.value || {};

            // Extract phone_number_id for routing
            const phoneNumberId = value.metadata?.phone_number_id;

            if (!phoneNumberId) {
                console.warn('[Webhook] No phone_number_id in payload');
                continue;
            }

            // Map phone_number_id -> store
            const account = await whatsappAccountRepo.findByPhoneNumberId(phoneNumberId, true);

            if (!account) {
                console.warn(`[Webhook] Unmapped phone_number_id: ${phoneNumberId}`);
                continue;
            }

            const storeId = account.storeId;

            // Update last webhook timestamp
            await whatsappAccountRepo.updateWebhookTimestamp(phoneNumberId);

            // Handle different webhook types based on field
            const field = change.field;

            if (field === 'messages') {
                if (value.messages) {
                    await handleIncomingMessages(value.messages, storeId, account);
                }
                if (value.statuses) {
                    await handleStatusUpdates(value.statuses);
                }
            } else if (field === 'message_template_status_update') {
                await handleTemplateStatusUpdate(value, storeId);
            }
        }
    }
}

/**
 * Handle incoming messages
 * @param {Array} messages - Messages array from webhook
 * @param {string} storeId - Store ID
 * @param {Object} account - WhatsApp account
 */
async function handleIncomingMessages(messages, storeId, account) {
    for (const msg of messages) {
        try {
            const from = msg.from; // Customer phone in E.164
            const messageId = msg.id;
            const timestamp = new Date(parseInt(msg.timestamp, 10) * 1000);
            const type = msg.type || 'text';

            // Extract message content based on type
            let body = null;
            let caption = null;
            let mediaUrl = null;
            let mediaType = null;
            let mediaFileName = null;

            if (type === 'text') {
                body = msg.text?.body;
            } else if (type === 'image') {
                caption = msg.image?.caption;
                // For now, just store meta's URL (expires in 5 min)
                // Future: download and store to S3
                if (account.accessToken) {
                    try {
                        const mediaInfo = await whatsappService.getMediaUrl(msg.image.id, account.accessToken);
                        mediaUrl = mediaInfo.url; // Meta's temporary URL
                        mediaType = mediaInfo.mime_type;
                    } catch (err) {
                        console.error('[Webhook] Failed to fetch media URL:', err);
                    }
                }
            } else if (type === 'document') {
                caption = msg.document?.caption;
                mediaFileName = msg.document?.filename;
                // Same as image - store URL for now
            } else if (type === 'audio' || type === 'video') {
                // Handle similarly
            }

            // Get or create conversation
            const conversation = await conversationRepo.upsertByPhone(
                storeId,
                account.id,
                from,
                {
                    lastMessageBody: body || caption || `[${type}]`,
                    sessionActive: true,
                }
            );

            // Update customer message timestamp (for 24-hour window)
            await conversationRepo.updateCustomerMessageTime(conversation.id);

            // Increment unread count
            await conversationRepo.incrementUnread(conversation.id);

            // Save message
            await messageRepo.createInbound({
                conversationId: conversation.id,
                storeId,
                providerMessageId: messageId,
                wabaPhoneNumberId: account.phoneNumberId,
                type,
                body,
                caption,
                mediaUrl,
                mediaType,
                mediaFileName,
                from,
                to: account.phoneNumber,
                payload: msg, // Store full payload
                createdAt: timestamp,
            });

            // Optionally mark as read (auto-read)
            // await whatsappService.markMessageRead(account.phoneNumberId, messageId, account.accessToken);

            console.log(`[Webhook] Saved inbound message ${messageId} for store ${storeId}`);
        } catch (error) {
            console.error('[Webhook] Message processing error:', error);
        }
    }
}

/**
 * Handle message status updates (sent, delivered, read, failed)
 * @param {Array} statuses - Status updates from webhook
 */
async function handleStatusUpdates(statuses) {
    for (const status of statuses) {
        try {
            const messageId = status.id;
            const newStatus = status.status; // sent, delivered, read, failed

            // Find message by provider ID
            const message = await messageRepo.findByProviderMessageId(messageId);

            if (!message) {
                console.warn(`[Webhook] Message not found for status update: ${messageId}`);
                continue;
            }

            // Update message status
            const updateData = {};

            if (status.errors && status.errors.length > 0) {
                updateData.statusReason = status.errors[0].message;
            }

            await messageRepo.updateStatus(messageId, newStatus, updateData);

            console.log(`[Webhook] Updated message ${messageId} status to ${newStatus}`);
        } catch (error) {
            console.error('[Webhook] Status update error:', error);
        }
    }
}

module.exports = {
    handleWebhookVerification,
    handleWebhook,
};

/**
 * Handle template status updates (APPROVED, REJECTED, PAUSED)
 * @param {Object} value - Webhook value
 * @param {string} storeId - Store ID
 */
async function handleTemplateStatusUpdate(value, storeId) {
    try {
        const { event, message_template_id, message_template_name, message_template_language, reason } = value;

        console.log(`[Webhook] Template status update: ${message_template_name} -> ${event}`);

        // Find template by name and language (or ID if we stored it)
        // We use name+language as primary key for templates in Meta
        const template = await templateRepo.findByNameAndLanguage(
            storeId,
            message_template_name,
            message_template_language
        );

        if (template) {
            await templateRepo.updateStatus(template.id, event, {
                templateId: message_template_id,
                rejectedReason: reason || null,
            });
            console.log(`[Webhook] Updated template ${template.id} status to ${event}`);
        } else {
            console.warn(`[Webhook] Template not found for update: ${message_template_name} (${message_template_language})`);
        }
    } catch (error) {
        console.error('[Webhook] Template update error:', error);
    }
}

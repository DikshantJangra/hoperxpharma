/**
 * WhatsApp Service - Meta Graph API Integration
 * Handles all interactions with Meta's WhatsApp Cloud API
 * Multi-tenant: Each store has their own access token
 */



const GRAPH_API_VERSION = 'v17.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Subscribe webhook to a WABA
 * @param {string} wabaId - WhatsApp Business Account ID
 * @param {string} accessToken - Store's access token
 * @returns {Promise<Object>} Subscription result
 */
async function subscribeWebhook(wabaId, accessToken) {
    const url = `${GRAPH_BASE_URL}/${wabaId}/subscribed_apps`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subscribed_fields: ['messages', 'message_statuses'],
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to subscribe webhook: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
}

/**
 * Get WABA information
 * @param {string} accessToken - Temporary or long-lived token
 * @returns {Promise<Object>} WABA info including phone numbers
 */
async function getWABAInfo(accessToken) {
    if (!accessToken) throw new Error('Access token is missing');
    const cleanToken = accessToken.trim();

    // First, get the user's business accounts
    const url = `${GRAPH_BASE_URL}/me?fields=businesses{whatsapp_business_accounts}&access_token=${cleanToken}`;

    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch WABA: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const businesses = data.businesses?.data || [];

    if (!businesses.length) {
        throw new Error('No business accounts found');
    }

    // Get first WABA (todo: let user choose if multiple)
    const wabaList = businesses[0].whatsapp_business_accounts?.data || [];

    if (!wabaList.length) {
        throw new Error('No WhatsApp Business Accounts found');
    }

    return wabaList[0];
}

/**
 * Get phone numbers for a WABA
 * @param {string} wabaId - WABA ID
 * @param {string} accessToken - Access token
 * @returns {Promise<Array>} Phone numbers
 */
async function getPhoneNumbers(wabaId, accessToken) {
    const url = `${GRAPH_BASE_URL}/${wabaId}/phone_numbers?access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch phone numbers: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
}

/**
 * Send text message
 * @param {string} phoneNumberId - Sender phone number ID
 * @param {string} to - Recipient phone (E.164)
 * @param {string} text - Message text
 * @param {string} accessToken - Store's access token
 * @returns {Promise<Object>} Send result with message ID
 */
async function sendTextMessage(phoneNumberId, to, text, accessToken) {
    const url = `${GRAPH_BASE_URL}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to send message: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
}

/**
 * Send template message (for >24hr conversations)
 * @param {string} phoneNumberId - Sender phone number ID
 * @param {string} to - Recipient phone (E.164)
 * @param {Object} templateData - { name, language, components }
 * @param {string} accessToken - Store's access token
 * @returns {Promise<Object>} Send result
 */
async function sendTemplateMessage(phoneNumberId, to, templateData, accessToken) {
    const url = `${GRAPH_BASE_URL}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: templateData.name,
                language: { code: templateData.language || 'en' },
                components: templateData.components || [],
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to send template: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
}

/**
 * Get media URL (for downloading later)
 * Note: URLs expire in 5 minutes, store immediately if needed
 * @param {string} mediaId - Media ID from webhook
 * @param {string} accessToken - Store's access token
 * @returns {Promise<Object>} Media info including download URL
 */
async function getMediaUrl(mediaId, accessToken) {
    const url = `${GRAPH_BASE_URL}/${mediaId}?access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch media URL: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
}

/**
 * Mark message as read
 * @param {string} phoneNumberId - Phone number ID
 * @param {string} messageId - Message ID to mark
 * @param {string} accessToken - Store's access token
 * @returns {Promise<Object>} Result
 */
async function markMessageRead(phoneNumberId, messageId, accessToken) {
    const url = `${GRAPH_BASE_URL}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.warn('Failed to mark message as read:', error);
        return null; // Non-critical, don't throw
    }

    return await response.json();
}

/**
 * List approved templates for WABA
 * @param {string} wabaId - WABA ID
 * @param {string} accessToken - Access token
 * @returns {Promise<Array>} Templates
 */
async function getTemplates(wabaId, accessToken) {
    const url = `${GRAPH_BASE_URL}/${wabaId}/message_templates?access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch templates: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
}

/**
 * Create a new message template
 * @param {string} wabaId - WABA ID
 * @param {Object} templateData - Template definition
 * @param {string} accessToken - Access token
 * @returns {Promise<Object>} Created template
 */
async function createTemplate(wabaId, templateData, accessToken) {
    const url = `${GRAPH_BASE_URL}/${wabaId}/message_templates`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create template: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
}

/**
 * Verify phone OTP
 * @param {string} phoneNumberId - Phone number ID
 * @param {string} code - 6-digit OTP code
 * @param {string} accessToken - Access token
 * @returns {Promise<Object>} Verification result
 */
async function verifyPhoneOTP(phoneNumberId, code, accessToken) {
    const url = `${GRAPH_BASE_URL}/${phoneNumberId}/verify_code`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OTP verification failed: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
}

module.exports = {
    subscribeWebhook,
    getWABAInfo,
    getPhoneNumbers,
    sendTextMessage,
    sendTemplateMessage,
    getMediaUrl,
    markMessageRead,
    getTemplates,
    createTemplate,
    verifyPhoneOTP,
};

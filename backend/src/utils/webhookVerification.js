/**
 * Webhook Signature Verification for Meta WhatsApp Cloud API
 * Validates x-hub-signature-256 headers
 */

const crypto = require('crypto');

/**
 * Verifies Meta webhook signature
 * @param {Object} req - Express request object with body and headers
 * @param {string} appSecret - Facebook App Secret from environment
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(req, appSecret) {
    if (!appSecret) {
        console.warn('[Webhook] No FB_APP_SECRET configured, skipping signature verification');
        return true; // Allow in dev if secret not set
    }

    const signature = req.headers['x-hub-signature-256'] || req.headers['x-hub-signature'];

    if (!signature) {
        console.warn('[Webhook] No signature header found');
        return false;
    }

    // Get raw body as string (requires body-parser with verify option)
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // Compute expected signature
    const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payload, 'utf8')
        .digest('hex');

    // Extract hash from header (format: "sha256=<hash>")
    const receivedHash = signature.includes('=') ? signature.split('=')[1] : signature;

    // Constant-time comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(receivedHash, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        console.error('[Webhook] Signature verification error:', error.message);
        return false;
    }
}

/**
 * Verify webhook challenge for initial Meta setup
 * @param {string} mode - Hub mode from query params
 * @param {string} token - Hub verify token from query params
 * @param {string} challenge - Hub challenge from query params
 * @param {string} verifyToken - Your configured verify token from environment
 * @returns {string|null} Challenge string if valid, null otherwise
 */
function verifyWebhookChallenge(mode, token, challenge, verifyToken) {
    if (mode === 'subscribe' && token === verifyToken) {
        console.log('[Webhook] Challenge verification successful');
        return challenge;
    }

    console.warn('[Webhook] Challenge verification failed');
    return null;
}

module.exports = {
    verifyWebhookSignature,
    verifyWebhookChallenge,
};

/**
 * WhatsApp Controller
 * Handles WhatsApp Business integration endpoints
 * Multi-tenant: Each store connects their own WABA
 */

const whatsappAccountRepo = require('../../repositories/whatsappAccountRepository');
const whatsappService = require('../../services/whatsappService');

/**
 * Store temporary token from Embedded Signup
 * POST /api/whatsapp/connect
 */
async function handleEmbeddedSignup(req, res) {
    try {
        const { tempToken, storeId } = req.body;

        if (!tempToken || !storeId) {
            return res.status(400).json({ error: 'Missing tempToken or storeId' });
        }

        // Store temporary token
        await whatsappAccountRepo.upsertWhatsAppAccount(storeId, {
            tempToken,
            status: 'TEMP_STORED',
        });

        res.json({ success: true, message: 'Temporary token stored' });
    } catch (error) {
        console.error('[WhatsApp] Embedded signup error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Finalize WhatsApp setup - fetch WABA, subscribe webhook
 * POST /api/whatsapp/finalize
 */
async function finalizeSetup(req, res) {
    try {
        const { storeId } = req.body;

        if (!storeId) {
            return res.status(400).json({ error: 'Missing storeId' });
        }

        // Get account with decrypted temp token
        const account = await whatsappAccountRepo.findByStoreId(storeId, true);

        if (!account || !account.tempToken) {
            return res.status(404).json({ error: 'No temporary token found. Please reconnect.' });
        }

        // Fetch WABA info from Meta
        const wabaInfo = await whatsappService.getWABAInfo(account.tempToken);
        const wabaId = wabaInfo.id;

        // Get phone numbers
        const phoneNumbers = await whatsappService.getPhoneNumbers(wabaId, account.tempToken);

        if (!phoneNumbers.length) {
            await whatsappAccountRepo.updateStatus(storeId, 'NO_PHONE');
            return res.status(400).json({
                error: 'No phone number registered. Please add and verify a phone number in Meta Business Manager.',
                status: 'NO_PHONE'
            });
        }

        const phone = phoneNumbers[0];
        const phoneNumberId = phone.id;
        const phoneNumber = phone.display_phone_number;

        // Check if phone needs verification
        if (phone.code_verification_status !== 'VERIFIED') {
            await whatsappAccountRepo.upsertWhatsAppAccount(storeId, {
                wabaId,
                phoneNumberId,
                phoneNumber,
                status: 'NEEDS_VERIFICATION',
            });

            return res.status(200).json({
                success: true,
                status: 'NEEDS_VERIFICATION',
                phoneNumber,
                phoneNumberId,
                message: 'Phone verification required',
            });
        }

        // Subscribe webhook
        try {
            await whatsappService.subscribeWebhook(wabaId, account.tempToken);
        } catch (webhookError) {
            console.error('[WhatsApp] Webhook subscription failed:', webhookError);
            // Continue anyway, can retry later
        }

        // Update account with full info
        await whatsappAccountRepo.upsertWhatsAppAccount(storeId, {
            wabaId,
            phoneNumberId,
            phoneNumber,
            accessToken: account.tempToken, // Will be encrypted
            tempToken: null,
            status: 'ACTIVE',
            businessDisplayName: wabaInfo.name || null,
        });

        res.json({
            success: true,
            status: 'ACTIVE',
            wabaId,
            phoneNumberId,
            phoneNumber,
            businessName: wabaInfo.name,
        });
    } catch (error) {
        console.error('[WhatsApp] Finalize setup error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Manual token setup (fallback)
 * POST /api/whatsapp/manual-token
 */
async function manualTokenSetup(req, res) {
    try {
        const { storeId, systemToken } = req.body;

        if (!storeId || !systemToken) {
            return res.status(400).json({ error: 'Missing storeId or systemToken' });
        }

        // Validate token by fetching WABA info
        const wabaInfo = await whatsappService.getWABAInfo(systemToken);
        const wabaId = wabaInfo.id;

        const phoneNumbers = await whatsappService.getPhoneNumbers(wabaId, systemToken);

        if (!phoneNumbers.length) {
            return res.status(400).json({ error: 'No phone numbers found on this WABA' });
        }

        const phone = phoneNumbers[0];

        // Subscribe webhook
        await whatsappService.subscribeWebhook(wabaId, systemToken);

        // Store account
        await whatsappAccountRepo.upsertWhatsAppAccount(storeId, {
            wabaId,
            phoneNumberId: phone.id,
            phoneNumber: phone.display_phone_number,
            accessToken: systemToken,
            status: 'ACTIVE',
            businessDisplayName: wabaInfo.name,
        });

        res.json({ success: true, message: 'WhatsApp connected successfully' });
    } catch (error) {
        console.error('[WhatsApp] Manual token setup error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get connection status for store
 * GET /api/whatsapp/status/:storeId
 */
async function getStatus(req, res) {
    try {
        const { storeId } = req.params;

        const account = await whatsappAccountRepo.findByStoreId(storeId, false);

        if (!account) {
            return res.json({ connected: false, status: 'DISCONNECTED' });
        }

        res.json({
            connected: account.status === 'ACTIVE',
            status: account.status,
            phoneNumber: account.phoneNumber,
            phoneNumberId: account.phoneNumberId,
            businessVerified: account.businessVerified,
            businessName: account.businessDisplayName,
            lastWebhookAt: account.lastWebhookReceivedAt,
        });
    } catch (error) {
        console.error('[WhatsApp] Get status error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Verify phone OTP
 * POST /api/whatsapp/verify-phone
 */
async function verifyPhone(req, res) {
    try {
        const { storeId, code } = req.body;

        if (!storeId || !code) {
            return res.status(400).json({ error: 'Missing storeId or code' });
        }

        const account = await whatsappAccountRepo.findByStoreId(storeId, true);

        if (!account || !account.phoneNumberId) {
            return res.status(404).json({ error: 'No phone number to verify' });
        }

        // Verify OTP with Meta
        await whatsappService.verifyPhoneOTP(account.phoneNumberId, code, account.accessToken);

        // Update status to active
        await whatsappAccountRepo.updateStatus(storeId, 'ACTIVE');

        res.json({ success: true, message: 'Phone verified successfully' });
    } catch (error) {
        console.error('[WhatsApp] Phone verification error:', error);
        res.status(400).json({ error: error.message });
    }
}

/**
 * Disconnect WhatsApp account
 * DELETE /api/whatsapp/disconnect/:storeId
 */
async function disconnect(req, res) {
    try {
        const { storeId } = req.params;

        await whatsappAccountRepo.deleteAccount(storeId);

        res.json({ success: true, message: 'WhatsApp disconnected' });
    } catch (error) {
        console.error('[WhatsApp] Disconnect error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    handleEmbeddedSignup,
    finalizeSetup,
    manualTokenSetup,
    getStatus,
    verifyPhone,
    disconnect,
};

const whatsappQueueRepo = require('../repositories/whatsappQueueRepository');
const whatsappAccountRepo = require('../repositories/whatsappAccountRepository');
const conversationRepo = require('../repositories/conversationRepository'); // To update lastMessage
const whatsappService = require('../services/whatsappService');

const MAX_RETRIES = 3;
const BASE_DELAY_SECONDS = 60; // 1 minute

async function processQueue() {
    try {
        const pendingItems = await whatsappQueueRepo.getPendingItems(10); // Batch size

        if (pendingItems.length === 0) return;

        console.log(`[WhatsAppWorker] Processing ${pendingItems.length} items`);

        for (const item of pendingItems) {
            await processItem(item);
        }
    } catch (error) {
        console.error('[WhatsAppWorker] Error processing queue:', error);
    }
}

async function processItem(item) {
    try {
        // Mark as in_progress (optional, or just rely on atomic updates if high concurrency, but for single worker fine)
        // Ignoring "in_progress" state for simplicity for now as we just update runAfter on fail

        const { storeId, payload } = item;

        // 1. Get Access Token
        const account = await whatsappAccountRepo.findByStoreId(storeId, true);
        if (!account || !account.accessToken) {
            await whatsappQueueRepo.markPermanentlyFailed(item.id, 'Account disconnected or token missing');
            return;
        }

        // 2. Send Message
        // Payload has 'messaging_product', 'to', 'type', etc.
        // whatsappService needs raw endpoint fetch usually, but we can reuse the specialized methods if we extract args
        // OR we can make a raw send method.
        // Let's assume payload is the body for POST /messages

        // We'll use a raw fetch helper or construct the call
        // Since we don't have a "raw send" in service, let's look at payload.
        // If it's standard Meta payload, we can just POST it.

        // Let's modify service to allow raw payload send, or just use fetch here.
        // Better: Use service.

        const phoneNumberId = account.phoneNumberId;
        const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${account.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || response.statusText;
            throw new Error(errorMessage);
        }

        const result = await response.json();

        // 3. Success
        await whatsappQueueRepo.markComplete(item.id);
        console.log(`[WhatsAppWorker] Sent message for store ${storeId} (Queue ID: ${item.id})`);

    } catch (error) {
        console.error(`[WhatsAppWorker] Failed item ${item.id}:`, error.message);

        const retryCount = item.attemptCount + 1;
        if (retryCount >= MAX_RETRIES) {
            await whatsappQueueRepo.markPermanentlyFailed(item.id, error.message);
        } else {
            // Exponential backoff: 1m, 2m, 4m...
            const delay = BASE_DELAY_SECONDS * Math.pow(2, retryCount - 1);
            await whatsappQueueRepo.markFailed(item.id, error.message, delay);
        }
    }
}

// Start worker
function startWorker(intervalMs = 60000) {
    console.log('[WhatsAppWorker] Starting queue worker...');
    setInterval(processQueue, intervalMs);

    // Initial run
    processQueue();
}

module.exports = {
    startWorker
};

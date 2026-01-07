/**
 * WhatsApp Account Repository
 * Handles database operations for WhatsApp business account connections
 */

const prisma = require('../db/prisma');
const { encryptToken, decryptToken } = require('../utils/encryption');

/**
 * Create or update WhatsApp account for a store
 * @param {string} storeId - Store ID
 * @param {Object} data - Account data
 * @returns {Promise<Object>} WhatsAppAccount record
 */
async function upsertWhatsAppAccount(storeId, data) {
    // Encrypt access tokens if provided
    const encryptedData = { ...data };

    if (data.accessToken) {
        encryptedData.accessToken = encryptToken(data.accessToken);
    }

    if (data.tempToken) {
        encryptedData.tempToken = encryptToken(data.tempToken);
    }

    return await prisma.whatsAppAccount.upsert({
        where: { storeId },
        update: {
            ...encryptedData,
            updatedAt: new Date(),
        },
        create: {
            storeId,
            ...encryptedData,
        },
    });
}

/**
 * Find WhatsApp account by store ID
 * @param {string} storeId - Store ID
 * @param {boolean} decryptTokens - Whether to decrypt tokens (default: false)
 * @returns {Promise<Object|null>} WhatsAppAccount with decrypted tokens
 */
async function findByStoreId(storeId, decryptTokens = false) {
    const account = await prisma.whatsAppAccount.findUnique({
        where: { storeId },
        include: {
            store: {
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                },
            },
        },
    });

    if (!account) return null;

    if (decryptTokens) {
        return {
            ...account,
            accessToken: account.accessToken ? decryptToken(account.accessToken) : null,
            tempToken: account.tempToken ? decryptToken(account.tempToken) : null,
        };
    }

    return account;
}

/**
 * Find WhatsApp account by phone number ID (for webhook routing)
 * @param {string} phoneNumberId - Meta phone number ID
 * @param {boolean} decryptTokens - Whether to decrypt tokens
 * @returns {Promise<Object|null>} WhatsAppAccount
 */
async function findByPhoneNumberId(phoneNumberId, decryptTokens = false) {
    const account = await prisma.whatsAppAccount.findUnique({
        where: { phoneNumberId },
        include: {
            store: {
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                },
            },
        },
    });

    if (!account) return null;

    if (decryptTokens) {
        return {
            ...account,
            accessToken: account.accessToken ? decryptToken(account.accessToken) : null,
            tempToken: account.tempToken ? decryptToken(account.tempToken) : null,
        };
    }

    return account;
}

/**
 * Update account status
 * @param {string} storeId - Store ID
 * @param {string} status - WhatsAppStatus enum value
 * @param {Object} additionalData - Optional additional fields to update
 * @returns {Promise<Object>} Updated account
 */
async function updateStatus(storeId, status, additionalData = {}) {
    return await prisma.whatsAppAccount.update({
        where: { storeId },
        data: {
            status,
            ...additionalData,
            updatedAt: new Date(),
        },
    });
}

/**
 * Update last webhook received timestamp
 * @param {string} phoneNumberId - Phone number ID
 * @returns {Promise<Object>} Updated account
 */
async function updateWebhookTimestamp(phoneNumberId) {
    return await prisma.whatsAppAccount.update({
        where: { phoneNumberId },
        data: {
            lastWebhookReceivedAt: new Date(),
        },
    });
}

/**
 * Delete WhatsApp account (disconnect)
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Deleted account
 */
async function deleteAccount(storeId) {
    return await prisma.whatsAppAccount.delete({
        where: { storeId },
    });
}

/**
 * Get all active WhatsApp accounts
 * @returns {Promise<Array>} Active accounts
 */
async function getAllActive() {
    return await prisma.whatsAppAccount.findMany({
        where: {
            status: 'ACTIVE',
        },
        include: {
            store: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
}

module.exports = {
    upsertWhatsAppAccount,
    findByStoreId,
    findByPhoneNumberId,
    updateStatus,
    updateWebhookTimestamp,
    deleteAccount,
    getAllActive,
};

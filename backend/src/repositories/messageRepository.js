/**
 * Message Repository
 * Handles database operations for WhatsApp messages
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Create inbound message
 * @param {Object} data - Message data
 * @returns {Promise<Object>} Created message
 */
async function createInbound(data) {
    return await prisma.message.create({
        data: {
            ...data,
            direction: 'inbound',
        },
    });
}

/**
 * Create outbound message
 * @param {Object} data - Message data
 * @returns {Promise<Object>} Created message
 */
async function createOutbound(data) {
    return await prisma.message.create({
        data: {
            ...data,
            direction: 'outbound',
        },
    });
}

/**
 * Find messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} skip - Pagination skip
 * @param {number} take - Pagination limit
 * @returns {Promise<Array>} Messages ordered by creation time
 */
async function findByConversation(conversationId, skip = 0, take = 50) {
    return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
    });
}

/**
 * Find message by provider message ID
 * @param {string} providerMessageId - Meta's message ID
 * @returns {Promise<Object|null>} Message
 */
async function findByProviderMessageId(providerMessageId) {
    return await prisma.message.findUnique({
        where: { providerMessageId },
    });
}

/**
 * Update message status
 * @param {string} providerMessageId - Meta's message ID
 * @param {string} status - MessageStatus enum value
 * @param {Object} additionalData - Optional additional fields
 * @returns {Promise<Object>} Updated message
 */
async function updateStatus(providerMessageId, status, additionalData = {}) {
    const updateData = { status, ...additionalData };

    // Set timestamp based on status
    if (status === 'delivered') {
        updateData.deliveredAt = new Date();
    } else if (status === 'read') {
        updateData.readAt = new Date();
    }

    return await prisma.message.update({
        where: { providerMessageId },
        data: updateData,
    });
}

/**
 * Get recent messages for a store
 * @param {string} storeId - Store ID
 * @param {number} take - Number of messages
 * @returns {Promise<Array>} Recent messages
 */
async function getRecentByStore(storeId, take = 100) {
    return await prisma.message.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        take,
        include: {
            conversation: {
                select: {
                    phoneNumber: true,
                    displayName: true,
                },
            },
        },
    });
}

/**
 * Get message count by store and direction
 * @param {string} storeId - Store ID
 * @param {string} direction - 'inbound' or 'outbound'
 * @param {Date} startDate - Start date filter
 * @param {Date} endDate - End date filter
 * @returns {Promise<number>} Count
 */
async function getCount(storeId, direction = null, startDate = null, endDate = null) {
    const where = { storeId };

    if (direction) {
        where.direction = direction;
    }

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    return await prisma.message.count({ where });
}

/**
 * Search messages by content
 * @param {string} storeId - Store ID
 * @param {string} query - Search query
 * @param {number} take - Result limit
 * @returns {Promise<Array>} Matching messages
 */
async function search(storeId, query, take = 20) {
    return await prisma.message.findMany({
        where: {
            storeId,
            body: {
                contains: query,
                mode: 'insensitive',
            },
        },
        include: {
            conversation: {
                select: {
                    id: true,
                    phoneNumber: true,
                    displayName: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take,
    });
}

module.exports = {
    createInbound,
    createOutbound,
    findByConversation,
    findByProviderMessageId,
    updateStatus,
    getRecentByStore,
    getCount,
    search,
};

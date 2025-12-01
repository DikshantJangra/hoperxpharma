/**
 * Conversation Repository
 * Handles database operations for WhatsApp conversations
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Upsert conversation by phone number
 * @param {string} storeId - Store ID
 * @param {string} whatsappAccountId - WhatsApp account ID
 * @param {string} phoneNumber - Customer phone (E.164)
 * @param {Object} data - Additional conversation data
 * @returns {Promise<Object>} Conversation record
 */
async function upsertByPhone(storeId, whatsappAccountId, phoneNumber, data = {}) {
    return await prisma.conversation.upsert({
        where: {
            storeId_phoneNumber: {
                storeId,
                phoneNumber,
            },
        },
        update: {
            lastMessageAt: new Date(),
            ...data,
            updatedAt: new Date(),
        },
        create: {
            storeId,
            whatsappAccountId,
            phoneNumber,
            lastMessageAt: new Date(),
            ...data,
        },
    });
}

/**
 * Find conversation by ID
 * @param {string} id - Conversation ID
 * @returns {Promise<Object|null>} Conversation
 */
async function findById(id) {
    return await prisma.conversation.findUnique({
        where: { id },
        include: {
            whatsappAccount: {
                select: {
                    phoneNumber: true,
                    phoneNumberId: true,
                },
            },
        },
    });
}

/**
 * Find all conversations for a store
 * @param {string} storeId - Store ID
 * @param {Object} filters - Filter options
 * @param {number} skip - Pagination skip
 * @param {number} take - Pagination limit
 * @returns {Promise<Array>} Conversations
 */
async function findByStore(storeId, filters = {}, skip = 0, take = 50) {
    const where = { storeId };

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.assignedAgentId) {
        where.assignedAgentId = filters.assignedAgentId;
    }

    if (filters.search) {
        where.OR = [
            { phoneNumber: { contains: filters.search } },
            { displayName: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    return await prisma.conversation.findMany({
        where,
        include: {
            messages: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    body: true,
                    type: true,
                    createdAt: true,
                    direction: true,
                },
            },
        },
        orderBy: {
            lastMessageAt: 'desc',
        },
        skip,
        take,
    });
}

/**
 * Update conversation status
 * @param {string} id - Conversation ID
 * @param {string} status - Status value
 * @returns {Promise<Object>} Updated conversation
 */
async function updateStatus(id, status) {
    return await prisma.conversation.update({
        where: { id },
        data: { status },
    });
}

/**
 * Assign conversation to agent
 * @param {string} id - Conversation ID
 * @param {string} agentId - User ID of agent
 * @returns {Promise<Object>} Updated conversation
 */
async function assignAgent(id, agentId) {
    return await prisma.conversation.update({
        where: { id },
        data: { assignedAgentId: agentId },
    });
}

/**
 * Update last customer message timestamp (for 24-hr window)
 * @param {string} id - Conversation ID
 * @returns {Promise<Object>} Updated conversation
 */
async function updateCustomerMessageTime(id) {
    return await prisma.conversation.update({
        where: { id },
        data: {
            lastCustomerMessageAt: new Date(),
            sessionActive: true,
        },
    });
}

/**
 * Increment unread count
 * @param {string} id - Conversation ID
 * @returns {Promise<Object>} Updated conversation
 */
async function incrementUnread(id) {
    return await prisma.conversation.update({
        where: { id },
        data: {
            unreadCount: {
                increment: 1,
            },
        },
    });
}

/**
 * Reset unread count
 * @param {string} id - Conversation ID
 * @returns {Promise<Object>} Updated conversation
 */
async function resetUnread(id) {
    return await prisma.conversation.update({
        where: { id },
        data: { unreadCount: 0 },
    });
}

/**
 * Get conversation count by store and status
 * @param {string} storeId - Store ID
 * @param {string} status - Status filter (optional)
 * @returns {Promise<number>} Count
 */
async function getCount(storeId, status = null) {
    const where = { storeId };
    if (status) where.status = status;

    return await prisma.conversation.count({ where });
}

module.exports = {
    upsertByPhone,
    findById,
    findByStore,
    updateStatus,
    assignAgent,
    updateCustomerMessageTime,
    incrementUnread,
    resetUnread,
    getCount,
};

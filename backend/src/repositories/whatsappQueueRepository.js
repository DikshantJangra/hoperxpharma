const { PrismaClient } = require('@prisma/client');
const prisma = require('../db/prisma');

const whatsappQueueRepository = {
    /**
     * Add message to outbound queue
     * @param {string} storeId
     * @param {Object} payload - Meta API payload
     * @param {string} conversationId - Optional
     */
    async enqueue(storeId, payload, conversationId = null) {
        return await prisma.whatsAppOutboundQueue.create({
            data: {
                storeId,
                conversationId,
                payload,
                status: 'pending',
                attemptCount: 0,
            },
        });
    },

    /**
     * Get pending items due for processing
     * @param {number} limit
     */
    async getPendingItems(limit = 10) {
        return await prisma.whatsAppOutboundQueue.findMany({
            where: {
                status: { in: ['pending', 'failed'] },
                attemptCount: { lt: 3 }, // MAX_ATTEMPTS
                runAfter: { lte: new Date() },
            },
            take: limit,
            orderBy: { runAfter: 'asc' },
        });
    },

    /**
     * Update item status
     * @param {string|number} id
     * @param {Object} data
     */
    async update(id, data) {
        return await prisma.whatsAppOutboundQueue.update({
            where: { id: BigInt(id) },
            data,
        });
    },

    /**
     * Mark as complete
     */
    async markComplete(id) {
        return await prisma.whatsAppOutboundQueue.update({
            where: { id: BigInt(id) },
            data: {
                status: 'sent',
                sentAt: new Date(),
            },
        });
    },

    /**
     * Mark as failed (retriable)
     */
    async markFailed(id, error, nextAttemptDelaySeconds = 60) {
        const nextRun = new Date();
        nextRun.setSeconds(nextRun.getSeconds() + nextAttemptDelaySeconds);

        return await prisma.whatsAppOutboundQueue.update({
            where: { id: BigInt(id) },
            data: {
                status: 'failed',
                errorMessage: error,
                attemptCount: { increment: 1 },
                runAfter: nextRun,
            },
        });
    },

    /**
     * Mark as permanently failed
     */
    async markPermanentlyFailed(id, error) {
        return await prisma.whatsAppOutboundQueue.update({
            where: { id: BigInt(id) },
            data: {
                status: 'permanently_failed',
                errorMessage: error,
            },
        });
    }
};

module.exports = whatsappQueueRepository;

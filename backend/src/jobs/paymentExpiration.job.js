/**
 * Payment Expiration Job
 * Runs every 10 minutes to expire old pending payments
 * Marks CREATED/INITIATED payments older than 1 hour as EXPIRED
 */

const cron = require('node-cron');
const prisma = require('../db/prisma');
const { PAYMENT_STATUS, PAYMENT_TIMEOUT, PAYMENT_EVENT_TYPE, EVENT_SOURCE } = require('../constants/payment.constants');

/**
 * Expire old pending payments
 */
const expireOldPayments = async () => {
    const cutoffTime = new Date(
        Date.now() - PAYMENT_TIMEOUT.ORDER_EXPIRY_MINUTES * 60 * 1000
    );

    console.log(`[ExpirationJob] Looking for payments to expire (created before ${cutoffTime.toISOString()})`);

    try {
        // Find payments in CREATED or INITIATED older than 1 hour
        const oldPayments = await prisma.payment.findMany({
            where: {
                status: {
                    in: [PAYMENT_STATUS.CREATED, PAYMENT_STATUS.INITIATED]
                },
                createdAt: {
                    lt: cutoffTime
                }
            },
            select: {
                id: true,
                status: true,
                razorpayOrderId: true,
                createdAt: true
            }
        });

        if (oldPayments.length === 0) {
            console.log('[ExpirationJob] No payments to expire');
            return { expired: 0 };
        }

        console.log(`[ExpirationJob] Found ${oldPayments.length} old payments to expire`);

        let expiredCount = 0;

        // Expire each payment
        for (const payment of oldPayments) {
            try {
                await prisma.$transaction(async (tx) => {
                    // Update payment status
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: PAYMENT_STATUS.EXPIRED,
                            updatedAt: new Date(),
                            completedAt: new Date()
                        }
                    });

                    // Log expiration event
                    await tx.paymentEvent.create({
                        data: {
                            paymentId: payment.id,
                            eventType: PAYMENT_EVENT_TYPE.PAYMENT_EXPIRED,
                            eventSource: EVENT_SOURCE.SYSTEM,
                            oldStatus: payment.status,
                            newStatus: PAYMENT_STATUS.EXPIRED,
                            rawPayload: {
                                reason: 'Payment not completed within time limit',
                                timeoutMinutes: PAYMENT_TIMEOUT.ORDER_EXPIRY_MINUTES
                            },
                            createdBy: 'system'
                        }
                    });
                });

                expiredCount++;
                console.log(`[ExpirationJob] ✅ Expired payment ${payment.id} (${payment.status})`);
            } catch (error) {
                console.error(`[ExpirationJob] ❌ Failed to expire payment ${payment.id}:`, error.message);
            }
        }

        console.log(`[ExpirationJob] Completed: ${expiredCount} payments expired`);

        return { expired: expiredCount };
    } catch (error) {
        console.error('[ExpirationJob] Job failed:', error);
        throw error;
    }
};

/**
 * Schedule expiration job
 * Runs every 10 minutes
 */
const scheduleExpirationJob = () => {
    // Run every 10 minutes: */10 * * * *
    const cronExpression = '*/10 * * * *';

    console.log('[ExpirationJob] Scheduling job to run every 10 minutes');

    cron.schedule(cronExpression, async () => {
        console.log('[ExpirationJob] Starting scheduled expiration...');
        try {
            await expireOldPayments();
        } catch (error) {
            console.error('[ExpirationJob] Scheduled job error:', error);
        }
    });

    console.log('[ExpirationJob] ✅ Scheduled successfully');
};

/**
 * Run expiration immediately (for manual trigger)
 */
const runExpirationNow = async () => {
    console.log('[ExpirationJob] Manual expiration triggered');
    return await expireOldPayments();
};

module.exports = {
    scheduleExpirationJob,
    expireOldPayments,
    runExpirationNow
};

/**
 * Payment Reconciliation Job
 * Runs every 15 minutes to check stuck PROCESSING payments
 * Fetches status from Razorpay API and updates accordingly
 */

const cron = require('node-cron');
const prisma = require('../db/prisma');
const { PAYMENT_STATUS, PAYMENT_TIMEOUT } = require('../constants/payment.constants');
const { reconcilePayment } = require('../services/paymentService');

/**
 * Find and reconcile stuck payments
 */
const reconcileStuckPayments = async () => {
    const cutoffTime = new Date(
        Date.now() - PAYMENT_TIMEOUT.PROCESSING_TIMEOUT_MINUTES * 60 * 1000
    );

    console.log(`[ReconciliationJob] Looking for payments stuck in PROCESSING since ${cutoffTime.toISOString()}`);

    try {
        // Find payments in PROCESSING for > 30 minutes
        const stuckPayments = await prisma.payment.findMany({
            where: {
                status: PAYMENT_STATUS.PROCESSING,
                updatedAt: {
                    lt: cutoffTime
                },
                razorpayPaymentId: {
                    not: null
                }
            },
            select: {
                id: true,
                razorpayPaymentId: true,
                amountPaise: true,
                storeId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (stuckPayments.length === 0) {
            console.log('[ReconciliationJob] No stuck payments found');
            return { reconciled: 0, failed: 0 };
        }

        console.log(`[ReconciliationJob] Found ${stuckPayments.length} stuck payments`);

        let reconciledCount = 0;
        let failedCount = 0;

        // Reconcile each payment
        for (const payment of stuckPayments) {
            try {
                console.log(`[ReconciliationJob] Reconciling payment ${payment.id}...`);

                const result = await reconcilePayment(payment.id);

                if (result.resolved) {
                    reconciledCount++;
                    console.log(`[ReconciliationJob] ✅ Payment ${payment.id} resolved: ${result.newStatus}`);
                } else {
                    console.log(`[ReconciliationJob] ⏳ Payment ${payment.id} still pending (Razorpay status: ${result.razorpayStatus})`);
                }
            } catch (error) {
                failedCount++;
                console.error(`[ReconciliationJob] ❌ Failed to reconcile payment ${payment.id}:`, error.message);
            }
        }

        console.log(`[ReconciliationJob] Completed: ${reconciledCount} reconciled, ${failedCount} failed`);

        return { reconciled: reconciledCount, failed: failedCount };
    } catch (error) {
        console.error('[ReconciliationJob] Job failed:', error);
        throw error;
    }
};

/**
 * Schedule reconciliation job
 * Runs every 15 minutes
 */
const scheduleReconciliationJob = () => {
    // Run every 15 minutes: */15 * * * *
    const cronExpression = `*/${PAYMENT_TIMEOUT.WEBHOOK_RETRY_INTERVAL_MINUTES} * * * *`;

    console.log(`[ReconciliationJob] Scheduling job to run every ${PAYMENT_TIMEOUT.WEBHOOK_RETRY_INTERVAL_MINUTES} minutes`);

    cron.schedule(cronExpression, async () => {
        console.log('[ReconciliationJob] Starting scheduled reconciliation...');
        try {
            await reconcileStuckPayments();
        } catch (error) {
            console.error('[ReconciliationJob] Scheduled job error:', error);
        }
    });

    console.log('[ReconciliationJob] ✅ Scheduled successfully');
};

/**
 * Run reconciliation immediately (for manual trigger)
 */
const runReconciliationNow = async () => {
    console.log('[ReconciliationJob] Manual reconciliation triggered');
    return await reconcileStuckPayments();
};

module.exports = {
    scheduleReconciliationJob,
    reconcileStuckPayments,
    runReconciliationNow
};

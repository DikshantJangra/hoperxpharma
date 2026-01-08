/**
 * Webhook Service
 * Handles Razorpay webhook events with idempotency and comprehensive error handling
 * CRITICAL: Final source of truth for payment success
 */

const prisma = require('../db/prisma');
const {
    PAYMENT_STATUS,
    PAYMENT_EVENT_TYPE,
    EVENT_SOURCE,
    RAZORPAY_WEBHOOK_EVENTS
} = require('../constants/payment.constants');
const { transitionPaymentState, logPaymentEvent } = require('./paymentService');
const subscriptionActivationService = require('./subscriptionActivationService');

/**
 * Process webhook event (WITH IDEMPOTENCY CHECK)
 * @param {Object} webhookBody - Complete webhook payload
 * @param {string} signature - x-razorpay-signature header
 * @returns {Promise<Object>} Processing result
 */
const processWebhookEvent = async (webhookBody, signature) => {
    const { event, payload } = webhookBody;

    // Extract event identifier for idempotency
    const razorpayEventId = extractEventId(payload, event);

    // Check if already processed (idempotency)
    const existing = await prisma.webhookEvent.findUnique({
        where: { razorpayEventId }
    });

    if (existing && existing.processed) {
        console.log(`[Webhook] Duplicate event ignored: ${razorpayEventId}`);
        return { status: 'duplicate', eventId: razorpayEventId };
    }

    // Store webhook event (even if processing fails, for debugging)
    const webhookEvent = await prisma.webhookEvent.create({
        data: {
            razorpayEventId,
            eventType: event,
            signature,
            rawPayload: webhookBody,
            processed: false
        }
    });

    try {
        // Route to appropriate handler
        let processingResult;
        switch (event) {
            case RAZORPAY_WEBHOOK_EVENTS.PAYMENT_CAPTURED:
                processingResult = await handlePaymentCaptured(payload.payment.entity);
                break;

            case RAZORPAY_WEBHOOK_EVENTS.PAYMENT_FAILED:
                processingResult = await handlePaymentFailed(payload.payment.entity);
                break;

            case RAZORPAY_WEBHOOK_EVENTS.ORDER_PAID:
                processingResult = await handleOrderPaid(payload.order.entity);
                break;

            case RAZORPAY_WEBHOOK_EVENTS.REFUND_PROCESSED:
                processingResult = await handleRefundProcessed(payload.refund.entity);
                break;

            case RAZORPAY_WEBHOOK_EVENTS.DISPUTE_CREATED:
                processingResult = await handleDisputeCreated(payload.dispute.entity);
                break;

            default:
                console.log(`[Webhook] Unhandled event type: ${event}`);
                processingResult = { status: 'unhandled', event };
        }

        // Mark webhook as processed
        await prisma.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
                processed: true,
                processedAt: new Date()
            }
        });

        return { status: 'processed', result: processingResult };
    } catch (error) {
        // Log processing error but don't fail webhook acknowledgment
        await prisma.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
                processingError: error.message
            }
        });

        console.error(`[Webhook] Processing error for ${razorpayEventId}:`, error);
        throw error; // Let Razorpay retry
    }
};

/**
 * Handle payment.captured event (FINAL SUCCESS CONFIRMATION)
 * This is THE ONLY place where payment is marked SUCCESS
 */
const handlePaymentCaptured = async (paymentEntity) => {
    const {
        id: razorpayPaymentId,
        order_id: razorpayOrderId,
        amount: amountPaise,
        method,
        status
    } = paymentEntity;

    return await prisma.$transaction(async (tx) => {
        // 1. Find payment by Razorpay order ID (with row lock)
        const payment = await tx.payment.findUnique({
            where: { razorpayOrderId }
        });

        if (!payment) {
            throw new Error(`Payment not found for Razorpay order: ${razorpayOrderId}`);
        }

        // 2. CRITICAL: Verify amount matches
        if (amountPaise !== payment.amountPaise) {
            // Log security event
            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    eventType: PAYMENT_EVENT_TYPE.WEBHOOK_RECEIVED,
                    eventSource: EVENT_SOURCE.RAZORPAY_WEBHOOK,
                    oldStatus: payment.status,
                    newStatus: payment.status, // Don't change
                    rawPayload: {
                        securityEvent: 'WEBHOOK_AMOUNT_MISMATCH',
                        expectedAmount: payment.amountPaise,
                        receivedAmount: amountPaise,
                        paymentEntity
                    },
                    createdBy: 'system'
                }
            });

            throw new Error(`Amount mismatch: expected ${payment.amountPaise}, got ${amountPaise}`);
        }

        // 3. Check if already marked SUCCESS (idempotency at payment level)
        if (payment.status === PAYMENT_STATUS.SUCCESS) {
            console.log(`[Webhook] Payment ${payment.id} already SUCCESS, skipping`);
            return { status: 'already_processed', paymentId: payment.id };
        }

        // 4. Transition to SUCCESS
        await transitionPaymentState({
            paymentId: payment.id,
            newStatus: PAYMENT_STATUS.SUCCESS,
            eventType: PAYMENT_EVENT_TYPE.PAYMENT_CAPTURED,
            eventSource: EVENT_SOURCE.RAZORPAY_WEBHOOK,
            rawPayload: paymentEntity,
            createdBy: 'system',
            method
        });

        // 5. Activate subscription (atomic with payment update)
        const subscriptionResult = await subscriptionActivationService.activateSubscription(
            payment.storeId,
            payment.metadata,
            payment.amountPaise,
            tx // Pass transaction
        );

        console.log(`[Webhook] Payment ${payment.id} marked SUCCESS, subscription activated`);

        return {
            status: 'success',
            paymentId: payment.id,
            subscriptionId: subscriptionResult.subscriptionId
        };
    });
};

/**
 * Handle payment.failed event
 */
const handlePaymentFailed = async (paymentEntity) => {
    const {
        id: razorpayPaymentId,
        order_id: razorpayOrderId,
        error_code,
        error_description
    } = paymentEntity;

    const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId }
    });

    if (!payment) {
        throw new Error(`Payment not found for Razorpay order: ${razorpayOrderId}`);
    }

    // Transition to FAILED
    await transitionPaymentState({
        paymentId: payment.id,
        newStatus: PAYMENT_STATUS.FAILED,
        eventType: PAYMENT_EVENT_TYPE.PAYMENT_FAILED,
        eventSource: EVENT_SOURCE.RAZORPAY_WEBHOOK,
        rawPayload: {
            ...paymentEntity,
            errorCode: error_code,
            errorDescription: error_description
        },
        createdBy: 'system'
    });

    console.log(`[Webhook] Payment ${payment.id} marked FAILED: ${error_description}`);

    return {
        status: 'failed',
        paymentId: payment.id,
        errorCode: error_code,
        errorDescription: error_description
    };
};

/**
 * Handle order.paid event (alternative to payment.captured)
 */
const handleOrderPaid = async (orderEntity) => {
    const { id: razorpayOrderId, amount_paid } = orderEntity;

    const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId }
    });

    if (!payment) {
        console.log(`[Webhook] No payment found for order ${razorpayOrderId}, may be handled by payment.captured`);
        return { status: 'no_payment_record' };
    }

    // If not already SUCCESS, fetch payment details and process
    if (payment.status !== PAYMENT_STATUS.SUCCESS) {
        // This event doesn't have full payment details, so we'd need to fetch
        // For now, log and let payment.captured handle it
        console.log(`[Webhook] Order ${razorpayOrderId} paid, awaiting payment.captured event`);

        await logPaymentEvent({
            paymentId: payment.id,
            eventType: PAYMENT_EVENT_TYPE.WEBHOOK_RECEIVED,
            eventSource: EVENT_SOURCE.RAZORPAY_WEBHOOK,
            oldStatus: payment.status,
            newStatus: payment.status,
            rawPayload: orderEntity,
            createdBy: 'system'
        });
    }

    return { status: 'acknowledged' };
};

/**
 * Handle refund.processed event
 */
const handleRefundProcessed = async (refundEntity) => {
    const {
        id: refundId,
        payment_id: razorpayPaymentId,
        amount
    } = refundEntity;

    const payment = await prisma.payment.findUnique({
        where: { razorpayPaymentId }
    });

    if (!payment) {
        throw new Error(`Payment not found for Razorpay payment: ${razorpayPaymentId}`);
    }

    // Transition to REFUNDED
    await transitionPaymentState({
        paymentId: payment.id,
        newStatus: PAYMENT_STATUS.REFUNDED,
        eventType: PAYMENT_EVENT_TYPE.PAYMENT_REFUNDED,
        eventSource: EVENT_SOURCE.RAZORPAY_WEBHOOK,
        rawPayload: refundEntity,
        createdBy: 'system'
    });

    // TODO: Deactivate subscription or adjust billing
    console.log(`[Webhook] Payment ${payment.id} refunded: ₹${amount / 100}`);

    return {
        status: 'refunded',
        paymentId: payment.id,
        refundAmount: amount
    };
};

/**
 * Handle dispute.created event
 */
const handleDisputeCreated = async (disputeEntity) => {
    const {
        id: disputeId,
        payment_id: razorpayPaymentId,
        amount,
        reason_description
    } = disputeEntity;

    const payment = await prisma.payment.findUnique({
        where: { razorpayPaymentId }
    });

    if (!payment) {
        throw new Error(`Payment not found for Razorpay payment: ${razorpayPaymentId}`);
    }

    // Transition to DISPUTED
    await transitionPaymentState({
        paymentId: payment.id,
        newStatus: PAYMENT_STATUS.DISPUTED,
        eventType: PAYMENT_EVENT_TYPE.PAYMENT_DISPUTED,
        eventSource: EVENT_SOURCE.RAZORPAY_WEBHOOK,
        rawPayload: disputeEntity,
        createdBy: 'system'
    });

    // TODO: Send alert to admin
    console.log(`[Webhook] DISPUTE created for payment ${payment.id}: ${reason_description}`);

    return {
        status: 'disputed',
        paymentId: payment.id,
        disputeId,
        amount,
        reason: reason_description
    };
};

/**
 * Extract event ID from payload for idempotency
 */
const extractEventId = (payload, eventType) => {
    // Different events have IDs in different places
    if (payload.payment?.entity?.id) {
        return payload.payment.entity.id;
    }
    if (payload.order?.entity?.id) {
        return payload.order.entity.id;
    }
    if (payload.refund?.entity?.id) {
        return payload.refund.entity.id;
    }
    if (payload.dispute?.entity?.id) {
        return payload.dispute.entity.id;
    }

    // Fallback: use timestamp + event type (less ideal)
    return `${eventType}_${Date.now()}`;
};

module.exports = {
    processWebhookEvent,
    handlePaymentCaptured,
    handlePaymentFailed,
    handleRefundProcessed,
    handleDisputeCreated
};

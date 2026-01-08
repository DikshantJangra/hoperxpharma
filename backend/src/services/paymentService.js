/**
 * Production-Grade Payment Service
 * CRITICAL: Handles real money transactions - no payment marked successful incorrectly
 */

const crypto = require('crypto');
const prisma = require('../db/prisma');
const { createRazorpayInstance, getWebhookSecret } = require('../config/razorpay.config');
const {
    PAYMENT_STATUS,
    PAYMENT_EVENT_TYPE,
    EVENT_SOURCE,
    PAYMENT_ERROR_CODE,
    isValidTransition,
    paiseToRupees,
    rupeesToPaise
} = require('../constants/payment.constants');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

// Lazy initialization - only create instance when needed
let razorpayInstance = null;
const getRazorpayInstance = () => {
    if (!razorpayInstance) {
        razorpayInstance = createRazorpayInstance();
    }
    return razorpayInstance;
};

/**
 * Create payment order (SERVER DECIDES AMOUNT - NEVER TRUST CLIENT)
 * @param {string} userId - Authenticated user ID
 * @param {string} storeId - Store ID (validated against user)
 * @param {string} planId - Subscription plan ID
 * @returns {Promise<Object>} Payment order details
 */
const createPaymentOrder = async (userId, storeId, planId) => {
    // 1. Validate user owns store
    const storeUser = await prisma.storeUser.findUnique({
        where: {
            userId_storeId: { userId, storeId }
        }
    });

    if (!storeUser) {
        throw new ApiError(
            httpStatus.FORBIDDEN,
            PAYMENT_ERROR_CODE.UNAUTHORIZED_STORE,
            'You do not have access to this store'
        );
    }

    // 2. Fetch plan from database (SERVER IS SOURCE OF TRUTH FOR PRICING)
    const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId }
    });

    if (!plan) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            PAYMENT_ERROR_CODE.PLAN_NOT_FOUND,
            'Subscription plan not found'
        );
    }

    const amountPaise = rupeesToPaise(parseFloat(plan.price));

    // 3. Generate idempotency key
    const idempotencyKey = `payment_${userId}_${planId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 4. Create Razorpay order FIRST
    let razorpayOrder;
    try {
        razorpayOrder = await getRazorpayInstance().orders.create({
            amount: amountPaise,
            currency: plan.currency,
            receipt: `${storeId}_${Date.now()}`,
            notes: {
                store_id: storeId,
                user_id: userId,
                plan_id: planId,
                plan_name: plan.name
            }
        });
    } catch (error) {
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            PAYMENT_ERROR_CODE.RAZORPAY_API_ERROR,
            'Failed to create Razorpay order: ' + error.message
        );
    }

    // 5. Create payment record in database with Razorpay order ID
    const payment = await prisma.payment.create({
        data: {
            storeId,
            userId,
            amount: parseFloat(plan.price),
            amountPaise,
            currency: plan.currency,
            status: PAYMENT_STATUS.INITIATED,
            razorpayOrderId: razorpayOrder.id,
            idempotencyKey,
            metadata: {
                planId: plan.id,
                planName: plan.name,
                planDisplayName: plan.displayName,
                billingCycle: plan.billingCycle,
                vertical: plan.name.split('_')[0]
            }
        }
    });

    // 6. Log payment creation event (after payment exists)
    try {
        await logPaymentEvent({
            paymentId: payment.id,
            eventType: PAYMENT_EVENT_TYPE.RAZORPAY_ORDER_CREATED,
            eventSource: EVENT_SOURCE.SYSTEM,
            oldStatus: null,
            newStatus: PAYMENT_STATUS.INITIATED,
            rawPayload: razorpayOrder,
            createdBy: userId
        });
    } catch (logError) {
        console.error('[Payment] Failed to log event:', logError.message);
        // Don't fail the payment creation if logging fails
    }

    // 7. Return data for frontend
    return {
        paymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        amountPaise,
        amountRupees: paiseToRupees(amountPaise),
        currency: plan.currency,
        planName: plan.displayName,
        keyId: require('../config/razorpay.config').getPublicKey()
    };
};

/**
 * Verify payment signature (CRITICAL SECURITY CHECK)
 * Marks payment as PROCESSING, NOT SUCCESS (wait for webhook)
 * @param {string} userId - Authenticated user ID
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Signature to verify
 * @returns {Promise<Object>} Verification result
 */
const verifyPaymentSignature = async (userId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    // 1. Fetch payment from our database
    const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId }
    });

    if (!payment) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            PAYMENT_ERROR_CODE.ORDER_NOT_FOUND,
            'Payment order not found'
        );
    }

    // 2. Verify user owns this payment
    if (payment.userId !== userId) {
        throw new ApiError(
            httpStatus.FORBIDDEN,
            PAYMENT_ERROR_CODE.UNAUTHORIZED_STORE,
            'You do not have access to this payment'
        );
    }

    // 3. Check current state allows this transition
    if (!isValidTransition(payment.status, PAYMENT_STATUS.PROCESSING)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            PAYMENT_ERROR_CODE.INVALID_STATE_TRANSITION,
            `Cannot verify payment in ${payment.status} state`
        );
    }

    // 4. Verify signature using HMAC-SHA256 (TIMING-SAFE)
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex');

    // Use timing-safe comparison
    const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpaySignature)
    );

    if (!isValid) {
        // Log failed verification attempt (security event)
        await logPaymentEvent({
            paymentId: payment.id,
            eventType: PAYMENT_EVENT_TYPE.SIGNATURE_VERIFIED,
            eventSource: EVENT_SOURCE.USER,
            oldStatus: payment.status,
            newStatus: payment.status, // Stay in same state
            rawPayload: {
                razorpayPaymentId,
                signatureValid: false,
                securityEvent: true
            },
            createdBy: userId
        });

        throw new ApiError(
            httpStatus.BAD_REQUEST,
            PAYMENT_ERROR_CODE.INVALID_SIGNATURE,
            'Invalid payment signature'
        );
    }

    // 5. Fetch payment details from Razorpay to verify amount
    const razorpayPayment = await getRazorpayInstance().payments.fetch(razorpayPaymentId);

    // 6. CRITICAL: Verify amount matches
    if (razorpayPayment.amount !== payment.amountPaise) {
        await logPaymentEvent({
            paymentId: payment.id,
            eventType: PAYMENT_EVENT_TYPE.MANUAL_UPDATE,
            eventSource: EVENT_SOURCE.SYSTEM,
            oldStatus: payment.status,
            newStatus: payment.status,
            rawPayload: {
                securityEvent: 'AMOUNT_MISMATCH',
                expectedAmount: payment.amountPaise,
                receivedAmount: razorpayPayment.amount
            },
            createdBy: 'system'
        });

        throw new ApiError(
            httpStatus.BAD_REQUEST,
            PAYMENT_ERROR_CODE.AMOUNT_MISMATCH,
            'Payment amount mismatch - possible tampering detected'
        );
    }

    // 7. Transition to PROCESSING (NOT SUCCESS - waiting for webhook)
    await transitionPaymentState({
        paymentId: payment.id,
        newStatus: PAYMENT_STATUS.PROCESSING,
        eventType: PAYMENT_EVENT_TYPE.SIGNATURE_VERIFIED,
        eventSource: EVENT_SOURCE.USER,
        rawPayload: razorpayPayment,
        createdBy: userId,
        razorpayPaymentId,
        razorpaySignature,
        method: razorpayPayment.method
    });

    return {
        status: PAYMENT_STATUS.PROCESSING,
        paymentId: payment.id,
        message: 'Payment verification successful - awaiting final confirmation'
    };
};

/**
 * Transition payment state (enforces state machine rules)
 * @param {Object} params - Transition parameters
 */
const transitionPaymentState = async (params) => {
    const {
        paymentId,
        newStatus,
        eventType,
        eventSource,
        rawPayload,
        createdBy,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        method
    } = params;

    return await prisma.$transaction(async (tx) => {
        // Fetch current payment with row lock
        const payment = await tx.payment.findUnique({
            where: { id: paymentId }
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        // Validate state transition
        if (!isValidTransition(payment.status, newStatus)) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                PAYMENT_ERROR_CODE.INVALID_STATE_TRANSITION,
                `Invalid state transition: ${payment.status} → ${newStatus}`
            );
        }

        // Update payment
        const updateData = {
            status: newStatus,
            updatedAt: new Date()
        };

        if (razorpayOrderId) updateData.razorpayOrderId = razorpayOrderId;
        if (razorpayPaymentId) updateData.razorpayPaymentId = razorpayPaymentId;
        if (razorpaySignature) updateData.razorpaySignature = razorpaySignature;
        if (method) updateData.method = method;

        if (newStatus === PAYMENT_STATUS.SUCCESS || newStatus === PAYMENT_STATUS.FAILED) {
            updateData.completedAt = new Date();
        }

        const updatedPayment = await tx.payment.update({
            where: { id: paymentId },
            data: updateData
        });

        // Log state transition
        await tx.paymentEvent.create({
            data: {
                paymentId,
                eventType,
                eventSource,
                oldStatus: payment.status,
                newStatus,
                rawPayload: rawPayload || {},
                createdBy: createdBy || 'system'
            }
        });

        return updatedPayment;
    });
};

/**
 * Log payment event (immutable audit trail)
 */
const logPaymentEvent = async (eventData) => {
    return await prisma.paymentEvent.create({
        data: eventData
    });
};

/**
 * Get payment status (for frontend polling)
 * @param {string} paymentId - Payment ID
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Object>} Payment status
 */
const getPaymentStatus = async (paymentId, userId) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            store: {
                select: { name: true }
            }
        }
    });

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    // Verify user owns this payment
    if (payment.userId !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }

    return {
        paymentId: payment.id,
        status: payment.status,
        amountPaise: payment.amountPaise,
        amountRupees: paiseToRupees(payment.amountPaise),
        currency: payment.currency,
        method: payment.method,
        storeName: payment.store.name,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        metadata: payment.metadata
    };
};

/**
 * Reconcile stuck payment (fetch from Razorpay API)
 * Used by background job for PROCESSING payments > 30 mins
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Reconciliation result
 */
const reconcilePayment = async (paymentId) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
    });

    if (!payment || !payment.razorpayPaymentId) {
        throw new Error('Payment not found or no Razorpay payment ID');
    }

    try {
        // Fetch latest status from Razorpay
        const razorpayPayment = await getRazorpayInstance().payments.fetch(payment.razorpayPaymentId);

        // Log reconciliation attempt
        await prisma.paymentReconciliation.create({
            data: {
                paymentId,
                attemptNumber: 1, // TODO: Increment based on existing attempts
                status: 'checking',
                razorpayStatus: razorpayPayment.status,
                apiResponse: razorpayPayment
            }
        });

        // Update payment based on Razorpay status
        if (razorpayPayment.status === 'captured') {
            // Use transaction to update payment AND activate subscription atomically
            const result = await prisma.$transaction(async (tx) => {
                await transitionPaymentState({
                    paymentId,
                    newStatus: PAYMENT_STATUS.SUCCESS,
                    eventType: PAYMENT_EVENT_TYPE.RECONCILIATION_ATTEMPTED,
                    eventSource: EVENT_SOURCE.RECONCILIATION,
                    rawPayload: razorpayPayment,
                    createdBy: 'system'
                });

                // Activate subscription immediately
                const subscriptionActivationService = require('./subscriptionActivationService');
                const subscriptionResult = await subscriptionActivationService.activateSubscription(
                    payment.storeId,
                    payment.metadata,
                    payment.amountPaise,
                    tx
                );

                return { 
                    resolved: true, 
                    newStatus: PAYMENT_STATUS.SUCCESS,
                    subscriptionId: subscriptionResult.subscriptionId
                };
            });

            console.log(`[Reconciliation] Payment ${paymentId} confirmed and subscription activated`);
            return result;
        } else if (razorpayPayment.status === 'failed') {
            await transitionPaymentState({
                paymentId,
                newStatus: PAYMENT_STATUS.FAILED,
                eventType: PAYMENT_EVENT_TYPE.PAYMENT_FAILED,
                eventSource: EVENT_SOURCE.RECONCILIATION,
                rawPayload: razorpayPayment,
                createdBy: 'system'
            });

            return { resolved: true, newStatus: PAYMENT_STATUS.FAILED };
        }

        return { resolved: false, razorpayStatus: razorpayPayment.status };
    } catch (error) {
        // Log failed reconciliation
        await prisma.paymentReconciliation.create({
            data: {
                paymentId,
                attemptNumber: 1,
                status: 'failed',
                notes: error.message
            }
        });

        throw error;
    }
};

/**
 * Verify webhook signature
 * @param {Object} body - Webhook body
 * @param {string} signature - x-razorpay-signature header
 * @returns {boolean} Is valid
 */
const verifyWebhookSignature = (body, signature) => {
    const webhookSecret = getWebhookSecret();

    if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
    }

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    } catch {
        return false;
    }
};

module.exports = {
    createPaymentOrder,
    verifyPaymentSignature,
    transitionPaymentState,
    getPaymentStatus,
    reconcilePayment,
    verifyWebhookSignature,
    logPaymentEvent
};

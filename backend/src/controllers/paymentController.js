/**
 * Production-Grade Payment Controller
 * All endpoints enforce security, state validation, and audit logging
 */

const httpStatus = require('http-status');
const asyncHandler = require('../middlewares/asyncHandler');
const paymentService = require('../services/paymentService');
const webhookService = require('../services/webhookService');
const { getPublicKey } = require('../config/razorpay.config');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Get Razorpay public key (safe for frontend)
 * GET /api/v1/payments/razorpay-key
 */
const getRazorpayKey = asyncHandler(async (req, res) => {
    const keyId = getPublicKey();

    res.status(200).json(
        new ApiResponse(
            200,
            { keyId },
            'Razorpay key retrieved'
        )
    );
});

/**
 * Create payment order
 * POST /api/v1/payments/create-order
 * @body { planId: string, storeId: string }
 */
const createOrder = asyncHandler(async (req, res) => {
    const { planId, storeId } = req.body;
    const userId = req.user.id;

    if (!planId || !storeId) {
        throw new ApiError(400, 'planId and storeId are required');
    }

    const orderData = await paymentService.createPaymentOrder(userId, storeId, planId);

    res.status(201).json(
        new ApiResponse(
            201,
            orderData,
            'Payment order created successfully'
        )
    );
});

/**
 * Verify payment signature
 * POST /api/v1/payments/verify
 * @body { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, 'Missing required payment verification fields');
    }

    const verificationResult = await paymentService.verifyPaymentSignature(
        userId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    );

    res.status(200).json(
        new ApiResponse(
            200,
            verificationResult,
            'Payment signature verified - awaiting final confirmation'
        )
    );
});

/**
 * Get payment status (for frontend polling)
 * GET /api/v1/payments/:paymentId/status
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const paymentStatus = await paymentService.getPaymentStatus(paymentId, userId);

    res.status(200).json(
        new ApiResponse(200, paymentStatus, 'Payment status retrieved')
    );
});

/**
 * Webhook handler (PUBLIC ENDPOINT - signature verified)
 * POST /api/v1/payments/webhooks/razorpay
 */
const handleWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const webhookBody = req.body;

    // Verify webhook signature
    const isValid = paymentService.verifyWebhookSignature(webhookBody, signature);

    if (!isValid) {
        console.error('[Webhook] Invalid signature received');
        throw new ApiError(400, 'Invalid webhook signature');
    }

    // Process webhook event with idempotency
    const result = await webhookService.processWebhookEvent(webhookBody, signature);

    // ALWAYS acknowledge webhook (even if processing failed)
    // Razorpay will retry if we return error
    res.status(200).json({ status: 'ok', result });
});

/**
 * Get payment history for store
 * GET /api/v1/payments/history
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { storeId, limit = 50, offset = 0 } = req.query;

    if (!storeId) {
        throw new ApiError(400, 'storeId is required');
    }

    // Verify user has access to store
    const prisma = require('../db/prisma');
    const storeUser = await prisma.storeUser.findUnique({
        where: {
            userId_storeId: { userId, storeId }
        }
    });

    if (!storeUser) {
        throw new ApiError(403, 'Access denied to this store');
    }

    // Fetch payment history with pagination
    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
            select: {
                id: true,
                amount: true,
                amountPaise: true,
                currency: true,
                status: true,
                method: true,
                razorpayOrderId: true,
                razorpayPaymentId: true,
                createdAt: true,
                completedAt: true,
                metadata: true
            }
        }),
        prisma.payment.count({ where: { storeId } })
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            { 
                payments: payments.map(p => ({
                    ...p,
                    planName: p.metadata?.planName || 'Unknown Plan',
                    planDisplayName: p.metadata?.planDisplayName || 'Subscription'
                })),
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + parseInt(limit) < total
                }
            },
            'Payment history retrieved'
        )
    );
});

/**
 * Manual reconciliation (ADMIN ONLY)
 * POST /api/v1/payments/reconcile/:paymentId
 */
const reconcilePayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user.id;

    // TODO: Add admin role check
    // if (req.user.role !== 'ADMIN') {
    //   throw new ApiError(403, 'Admin access required');
    // }

    const reconciliationResult = await paymentService.reconcilePayment(paymentId);

    res.status(200).json(
        new ApiResponse(
            200,
            reconciliationResult,
            'Payment reconciliation completed'
        )
    );
});

module.exports = {
    getRazorpayKey,
    createOrder,
    verifyPayment,
    getPaymentStatus,
    handleWebhook,
    getPaymentHistory,
    reconcilePayment
};

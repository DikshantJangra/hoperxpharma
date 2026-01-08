const express = require('express');
const paymentController = require('../../controllers/paymentController');
const { authenticate } = require('../../middlewares/auth');
const { paymentValidation } = require('../../middlewares/payment.validation');
const {
    paymentCreationLimiter,
    paymentVerificationLimiter,
    webhookLimiter,
    generalPaymentLimiter
} = require('../../middlewares/rateLimiting');

const router = express.Router();

/**
 * Get Razorpay Public Key
 * PUBLIC - Safe to expose to frontend
 */
router.get(
    '/razorpay-key',
    paymentController.getRazorpayKey
);

/**
 * Create Payment Order
 * Protected - Requires authentication
 * Server calculates amount from plan ID
 * Rate limited: 5 requests per 15 minutes
 */
router.post(
    '/create-order',
    paymentCreationLimiter,
    authenticate,
    paymentValidation.createOrder,
    paymentController.createOrder
);

/**
 * Verify Payment Signature
 * Protected - Requires authentication
 * Marks payment as PROCESSING (not SUCCESS - wait for webhook)
 * Rate limited: 10 requests per 15 minutes
 */
router.post(
    '/verify',
    paymentVerificationLimiter,
    authenticate,
    paymentValidation.verifyPayment,
    paymentController.verifyPayment
);

/**
 * Get Payment Status
 * Protected - For frontend polling
 * Rate limited: 50 requests per 15 minutes
 */
router.get(
    '/:paymentId/status',
    generalPaymentLimiter,
    authenticate,
    paymentController.getPaymentStatus
);

/**
 * Payment History
 * Protected - Get payment history for store
 * Rate limited: 50 requests per 15 minutes
 */
router.get(
    '/history',
    generalPaymentLimiter,
    authenticate,
    paymentController.getPaymentHistory
);

/**
 * Razorpay Webhook
 * PUBLIC - Signature verified in controller
 * CRITICAL: Final source of truth for payment success
 * Rate limited: 100 requests per minute
 */
router.post(
    '/webhooks/razorpay',
    webhookLimiter,
    express.json({ type: 'application/json' }), // Parse raw body for signature verification
    paymentController.handleWebhook
);

/**
 * Manual Reconciliation
 * Protected - Admin only (TODO: Add admin middleware)
 * Rate limited: 50 requests per 15 minutes
 */
router.post(
    '/reconcile/:paymentId',
    generalPaymentLimiter,
    authenticate,
    // TODO: Add admin role middleware
    paymentController.reconcilePayment
);

module.exports = router;

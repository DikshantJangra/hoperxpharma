const express = require('express');
const router = express.Router();
const subscriptionController = require('../../controllers/subscriptions/subscriptionController');
const { authenticate } = require('../../middlewares/auth');

/**
 * @route GET /api/v1/subscriptions/status
 * @desc Get current store's subscription status
 * @access Private
 */
router.get('/status', authenticate, subscriptionController.getSubscriptionStatus);

/**
 * @route GET /api/v1/subscriptions/plans
 * @desc Get all available subscription plans
 * @access Public
 */
router.get('/plans', subscriptionController.getPlans);

/**
 * @route GET /api/v1/subscriptions/usage
 * @desc Get subscription usage for current store
 * @access Private
 */
router.get('/usage', authenticate, subscriptionController.getUsage);

/**
 * @route GET /api/v1/subscriptions/payments
 * @desc Get subscription payment history
 * @access Private
 */
router.get('/payments', authenticate, subscriptionController.getSubscriptionPayments);

/**
 * @route POST /api/v1/subscriptions/payments/:paymentId/invoice
 * @desc Generate and download invoice PDF for a payment
 * @access Private
 */
router.post('/payments/:paymentId/invoice', authenticate, subscriptionController.downloadInvoice);

/**
 * @route POST /api/v1/subscriptions/:subscriptionId/mark-welcome-shown
 * @desc Mark welcome experience as shown for a subscription
 * @access Private
 */
router.post('/:subscriptionId/mark-welcome-shown', authenticate, subscriptionController.markWelcomeShown);

module.exports = router;



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

module.exports = router;


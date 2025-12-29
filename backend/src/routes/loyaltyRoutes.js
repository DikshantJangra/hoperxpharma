const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const { authenticate } = require('../middlewares/auth');

// All loyalty routes require authentication
router.use(authenticate);

// ============================================================================
// CUSTOMER LOYALTY ROUTES
// ============================================================================

/**
 * GET /api/engage/loyalty/overview
 * Get store-wide loyalty overview
 */
router.get('/overview', loyaltyController.getOverview);

/**
 * GET /api/engage/loyalty/customers
 * Get all customers with loyalty profiles
 */
router.get('/customers', loyaltyController.getCustomers);

/**
 * GET /api/engage/loyalty/profile/:patientId
 * Get loyalty profile for a specific customer
 */
router.get('/profile/:patientId', loyaltyController.getProfile);

/**
 * GET /api/engage/loyalty/progress/:patientId
 * Get detailed progress breakdown
 */
router.get('/progress/:patientId', loyaltyController.getProgress);

/**
 * GET /api/engage/loyalty/rewards/:patientId
 * Get available and unlocked rewards
 */
router.get('/rewards/:patientId', loyaltyController.getRewards);

/**
 * GET /api/engage/loyalty/history/:patientId
 * Get event history for transparency
 */
router.get('/history/:patientId', loyaltyController.getHistory);

/**
 * POST /api/engage/loyalty/events
 * Record a loyalty event (internal use)
 */
router.post('/events', loyaltyController.recordEvent);

/**
 * POST /api/engage/loyalty/redeem/:rewardId
 * Redeem a loyalty reward
 */
router.post('/redeem/:rewardId', loyaltyController.redeemReward);

module.exports = router;

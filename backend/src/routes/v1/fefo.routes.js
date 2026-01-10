const express = require('express');
const router = express.Router();
const fefoController = require('../../controllers/inventory/fefoController');
const { authenticate } = require('../../middlewares/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/fefo/recommend
 * @desc    Get recommended batch using FEFO logic
 * @access  Private
 */
router.post('/recommend', fefoController.recommendBatch);

/**
 * @route   POST /api/v1/fefo/deviation
 * @desc    Log FEFO deviation
 * @access  Private
 */
router.post('/deviation', fefoController.logDeviation);

/**
 * @route   GET /api/v1/fefo/adherence
 * @desc    Get FEFO adherence statistics
 * @access  Private
 */
router.get('/adherence', fefoController.getAdherenceStats);

/**
 * @route   GET /api/v1/fefo/violators
 * @desc    Get top FEFO violators
 * @access  Private
 */
router.get('/violators', fefoController.getTopViolators);

/**
 * @route   GET /api/v1/fefo/trends
 * @desc    Get FEFO violation trends
 * @access  Private
 */
router.get('/trends', fefoController.getViolationTrends);

module.exports = router;

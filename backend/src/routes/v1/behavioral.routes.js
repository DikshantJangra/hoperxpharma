const express = require('express');
const router = express.Router();
const behaviorController = require('../../controllers/behavioral/behaviorController');
const { authenticate } = require('../../middlewares/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/behavioral/calculate-score
 * @desc    Calculate employee anomaly score
 * @access  Private
 */
router.post('/calculate-score', behaviorController.calculateAnomalyScore);

/**
 * @route   GET /api/v1/behavioral/employee-summary
 * @desc    Get employee behavioral summary
 * @access  Private
 */
router.get('/employee-summary', behaviorController.getEmployeeSummary);

/**
 * @route   GET /api/v1/behavioral/store-insights
 * @desc    Get store-wide behavioral insights
 * @access  Private
 */
router.get('/store-insights', behaviorController.getStoreInsights);

/**
 * @route   GET /api/v1/behavioral/high-risk
 * @desc    Get high-risk employees
 * @access  Private
 */
router.get('/high-risk', behaviorController.getHighRiskEmployees);

module.exports = router;

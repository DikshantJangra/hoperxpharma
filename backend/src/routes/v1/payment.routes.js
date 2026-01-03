const express = require('express');
const paymentController = require('../../controllers/paymentController');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

// Create Order - Protected (Store Owner)
router.post('/orders', authenticate, paymentController.createOrder);

// Verify Payment (Frontend Callback) - Protected
router.post('/verify', authenticate, paymentController.verifyPayment);

// Webhook - Public (Verified by signature)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;

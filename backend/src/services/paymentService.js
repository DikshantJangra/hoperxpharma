const Razorpay = require('razorpay');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (amount, currency = 'INR', receipt) => {
    // Amount in Razorpay is expected in smallest currency unit (paise for INR)
    // We assume input amount is in major unit (Rupees)
    const options = {
        amount: Math.round(amount * 100),
        currency,
        receipt,
    };
    try {
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Razorpay Order Creation Failed: ' + error.message);
    }
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const text = orderId + '|' + paymentId;
    const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text.toString())
        .digest('hex');
    return generated_signature === signature;
};

// Verify webhook signature
const verifyWebhookSignature = (body, signature, secret) => {
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(body));
    const digest = shasum.digest('hex');
    return digest === signature;
};

module.exports = {
    createOrder,
    verifyPaymentSignature,
    verifyWebhookSignature,
    razorpay
};

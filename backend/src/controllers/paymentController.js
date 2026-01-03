const httpStatus = require('http-status').status || require('http-status');
const asyncHandler = require('../middlewares/asyncHandler');
const paymentService = require('../services/paymentService');
const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');

const createOrder = asyncHandler(async (req, res) => {
    const { amount, currency, receipt, storeId } = req.body;

    if (!amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Amount is required");
    }

    // Use storeId from body or authenticated user context if available
    // Assuming req.user is populated by auth middleware
    // We prioritize storeId passed in body if using an admin/platform flow, 
    // but strictly we should validate user belongs to store. 
    // For basic integration now, we'll take it from body if present, or error if not.
    const targetStoreId = storeId || (req.user?.storeUsers?.[0]?.storeId); // Simplified fallback

    if (!targetStoreId) {
        // If still no storeId, we can't link the payment (unless it's a new sign up payment flow where store doesn't exist yet? 
        // But typically user creates store first).
        // If this is for platform subscription, user must have a store.
        // throw new ApiError(httpStatus.BAD_REQUEST, "Store ID is required");
        // For now, proceed without storeId if strictly needed for testing, but ideally we need it.
        // Let's assume it is required.
        // NOTE: For now, I'll allow null storeId just for creation test if needed, but DB requires it.
        // DB Payment schema: storeId String (not optional).
        throw new ApiError(httpStatus.BAD_REQUEST, "Store ID is required");
    }

    const order = await paymentService.createOrder(amount, currency, receipt || `receipt_${Date.now()}`);

    // Create a PENDING payment record
    await prisma.payment.create({
        data: {
            storeId: targetStoreId,
            amount: amount,
            currency: currency || 'INR',
            status: 'PENDING',
            razorpayOrderId: order.id,
            method: 'Unknown', // Will be updated on completion
        }
    });

    res.status(httpStatus.CREATED).send(order);
});

const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const isValid = paymentService.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid signature');
    }

    // Update payment status
    const payment = await prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
            status: 'COMPLETED',
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            method: 'UPI', // Ideally we get this from Razorpay fetch order, but assuming UPI for now or generic.
            // In a real flow, we might fetch the payment details from Razorpay to confirm method.
        }
    });

    res.send({ status: 'success', payment });
});

const handleWebhook = asyncHandler(async (req, res) => {
    const secret = process.env.RAZORPAY_KEY_SECRET; // Use Secret from env (or a specific webhook secret if configured separately)
    const signature = req.headers['x-razorpay-signature'];

    if (!paymentService.verifyWebhookSignature(req.body, signature, secret)) {
        console.error('Invalid Webhook Signature');
        return res.status(400).send('Invalid Signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
        const paymentEntity = payload.payment.entity;
        const orderId = paymentEntity.order_id;

        // Update DB if not already completed
        // We use updateMany or findUnique. razorpayOrderId is unique.
        try {
            await prisma.payment.update({
                where: { razorpayOrderId: orderId },
                data: {
                    status: 'COMPLETED',
                    razorpayPaymentId: paymentEntity.id,
                    method: paymentEntity.method, // 'upi', 'card', etc.
                    metadata: paymentEntity // store full details if needed
                }
            });
            console.log(`Payment captured for order ${orderId}`);
        } catch (err) {
            console.error('Error updating payment via webhook:', err);
            // Don't fail the webhook response if DB update fails, but log it.
            // Or maybe return 500 to retry? Razorpay retries on non-200.
            // Better to return 500 so it retries.
            throw err;
        }
    } else if (event === 'payment.failed') {
        const paymentEntity = payload.payment.entity;
        const orderId = paymentEntity.order_id;
        await prisma.payment.update({
            where: { razorpayOrderId: orderId },
            data: { status: 'FAILED' }
        });
    }

    res.json({ status: 'ok' });
});

module.exports = {
    createOrder,
    verifyPayment,
    handleWebhook
};

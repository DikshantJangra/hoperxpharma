/**
 * Payment Validation Middleware
 * Validates and santitizes payment-related requests
 */

const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Validation middleware wrapper
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg).join(', ');
            return next(new ApiError(httpStatus.BAD_REQUEST, errorMessages));
        }

        next();
    };
};

/**
 * Validate create order request
 */
const createOrder = validate([
    body('planId')
        .trim()
        .notEmpty()
        .withMessage('Plan ID is required')
        .isString()
        .withMessage('Plan ID must be a string'),

    body('storeId')
        .trim()
        .notEmpty()
        .withMessage('Store ID is required')
        .isString()
        .withMessage('Store ID must be a string')
]);

/**
 * Validate verify payment request
 */
const verifyPayment = validate([
    body('razorpay_order_id')
        .trim()
        .notEmpty()
        .withMessage('Razorpay order ID is required')
        .isString()
        .withMessage('Razorpay order ID must be a string'),

    body('razorpay_payment_id')
        .trim()
        .notEmpty()
        .withMessage('Razorpay payment ID is required')
        .isString()
        .withMessage('Razorpay payment ID must be a string'),

    body('razorpay_signature')
        .trim()
        .notEmpty()
        .withMessage('Razorpay signature is required')
        .isString()
        .withMessage('Razorpay signature must be a string')
]);

module.exports = {
    paymentValidation: {
        createOrder,
        verifyPayment
    }
};

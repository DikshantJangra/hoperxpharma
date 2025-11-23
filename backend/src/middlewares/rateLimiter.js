const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../Utils/constants');
const ApiError = require('../Utils/ApiError');

/**
 * General rate limiter for all API routes
 */
const generalLimiter = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(ApiError.tooManyRequests('Too many requests, please try again later'));
    },
});

/**
 * Strict rate limiter for authentication routes
 */
const authLimiter = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.AUTH_MAX_REQUESTS,
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res, next) => {
        next(ApiError.tooManyRequests('Too many login attempts, please try again later'));
    },
});

module.exports = { generalLimiter, authLimiter };

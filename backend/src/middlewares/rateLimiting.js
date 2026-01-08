/**
 * Rate Limiting Middleware
 * Protects payment endpoints from abuse and DoS attacks
 */

const rateLimit = require('express-rate-limit');

// Trust proxy configuration for rate limiting
// When behind a proxy (like Render), we need to trust the X-Forwarded-For header
const trustProxyConfig = {
    // Use X-Forwarded-For header for IP identification
    // This is safe because we're behind Render's proxy
    keyGenerator: (req) => {
        // Get real IP from X-Forwarded-For or fallback to req.ip
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            // X-Forwarded-For can be a comma-separated list, take the first one
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.connection.remoteAddress || 'unknown';
    }
};

/**
 * Strict rate limiter for payment creation
 * Max 5 payment attempts per 15 minutes per IP
 */
const paymentCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 requests per window
    message: {
        error: 'Too many payment attempts from this IP, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    ...trustProxyConfig,
    // Store in memory (use Redis in production for distributed systems)
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many payment attempts. Please wait before trying again.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Moderate rate limiter for payment verification
 * Max 10 verification attempts per 15 minutes per IP
 */
const paymentVerificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: 'Too many verification attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...trustProxyConfig
});

/**
 * Webhook rate limiter
 * Max 100 webhooks per minute (Razorpay can retry frequently)
 */
const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: {
        error: 'Webhook rate limit exceeded'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful webhooks
    ...trustProxyConfig
});

/**
 * General payment API limiter
 * Max 50 requests per 15 minutes
 */
const generalPaymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...trustProxyConfig
});

module.exports = {
    paymentCreationLimiter,
    paymentVerificationLimiter,
    webhookLimiter,
    generalPaymentLimiter
};

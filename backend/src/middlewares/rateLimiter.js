const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// Optional Redis dependencies - only load if Redis is enabled
let RedisStore = null;
let Redis = null;
let redisClient = null;

// Try to load Redis packages if enabled
if (process.env.REDIS_ENABLED === 'true' && process.env.REDIS_URL) {
    try {
        RedisStore = require('rate-limit-redis');
        Redis = require('redis');

        redisClient = Redis.createClient({
            url: process.env.REDIS_URL,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 10) return null; // Stop retrying after 10 attempts
                    return Math.min(retries * 50, 500);
                }
            }
        });

        redisClient.on('error', (err) => {
            logger.error('Redis rate limiter error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('Redis rate limiter connected');
        });

        redisClient.connect().catch((err) => {
            logger.error('Failed to connect Redis for rate limiting:', err);
            redisClient = null; // Fallback to memory store
        });
    } catch (err) {
        logger.warn('Redis packages not installed. Using memory store for rate limiting.', {
            error: err.message,
            tip: 'Install with: npm install redis rate-limit-redis'
        });
        redisClient = null;
    }
} else {
    logger.info('Redis rate limiting disabled. Using memory store.');
}

/**
 * General API rate limiter
 * Applies to all API endpoints
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window (increased for development)
    skip: (req) => {
        // Skip rate limiting for localhost in development
        const isDev = process.env.NODE_ENV !== 'production';
        const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
        return isDev && isLocalhost;
    },
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        retryAfter: 15 * 60 // seconds
    },
    validate: { trustProxy: false }, // Disable trust proxy validation warning
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:general:'
    }) : undefined, // Falls back to memory store if Redis not available
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            user: req.user?.id
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later',
            retryAfter: 15 * 60
        });
    }
});

/**
 * Auth endpoints rate limiter (stricter)
 * For login, signup, password reset
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful logins
    validate: { trustProxy: false, xForwardedForHeader: false },
    skip: (req) => {
        // Skip rate limiting for localhost in development
        const isDev = process.env.NODE_ENV !== 'production';
        const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
        return isDev && isLocalhost;
    },
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
        retryAfter: 15 * 60
    },
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:auth:'
    }) : undefined,
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            email: req.body?.email || req.body?.phoneNumber
        });
        res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again after 15 minutes.',
            retryAfter: 15 * 60
        });
    }
});

/**
 * Refresh token rate limiter (lenient for legitimate use)
 * Refresh tokens are called frequently by frontend
 * CRITICAL: Always enforce to prevent infinite loops
 */
const refreshLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 2, // Max 2 refresh requests per 10 seconds (prevents loops)
    validate: { trustProxy: false },
    skip: () => false, // NEVER skip - always enforce
    message: {
        success: false,
        message: 'Too many refresh requests, please try again later',
        retryAfter: 10
    },
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:refresh:'
    }) : undefined,
    handler: (req, res) => {
        logger.error('⚠️ REFRESH RATE LIMIT EXCEEDED - Possible infinite loop detected', {
            ip: req.ip,
            path: req.path,
            userAgent: req.headers['user-agent']
        });
        res.status(429).json({
            success: false,
            message: 'Too many refresh requests. Please slow down.',
            retryAfter: 10
        });
    }
});

/**
 * Per-user rate limiter
 * More granular control based on authenticated user
 */
const userLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute per user (increased for development)
    validate: { trustProxy: false },
    keyGenerator: (req) => {
        // Use user ID if authenticated, else IP address
        return req.user?.id || 'anonymous';
    },
    message: {
        success: false,
        message: 'You are making too many requests',
        retryAfter: 60
    },
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:user:'
    }) : undefined,
    handler: (req, res) => {
        logger.warn('User rate limit exceeded', {
            userId: req.user?.id,
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            success: false,
            message: 'You are making too many requests. Please slow down.',
            retryAfter: 60
        });
    }
});

/**
 * POS endpoint limiter (more lenient for rapid scanning)
 * Allows fast barcode scanning and product lookups
 */
const posLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests per minute (2 per second)
    validate: { trustProxy: false },
    keyGenerator: (req) => req.user?.id || 'anonymous',
    message: {
        success: false,
        message: 'POS request limit exceeded',
        retryAfter: 60
    },
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:pos:'
    }) : undefined
});

/**
 * Search endpoint limiter (moderate)
 * For drug search, patient search, etc.
 */
const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    validate: { trustProxy: false },
    keyGenerator: (req) => req.user?.id || 'anonymous',
    message: {
        success: false,
        message: 'Too many search requests',
        retryAfter: 60
    },
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:search:'
    }) : undefined
});

/**
 * Report generation limiter (very strict)
 * Reports are expensive operations
 */
const reportLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 reports per minute
    validate: { trustProxy: false },
    keyGenerator: (req) => req.user?.id || 'anonymous',
    message: {
        success: false,
        message: 'Report generation limit exceeded. Please wait before generating another report.',
        retryAfter: 60
    },
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:report:'
    }) : undefined,
    handler: (req, res) => {
        logger.warn('Report generation limit exceeded', {
            userId: req.user?.id,
            ip: req.ip,
            reportType: req.path
        });
        res.status(429).json({
            success: false,
            message: 'You are generating reports too quickly. Please wait a moment.',
            retryAfter: 60
        });
    }
});

/**
 * File upload limiter (strict)
 * For prescription images, documents, etc.
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    validate: { trustProxy: false },
    keyGenerator: (req) => req.user?.id || 'anonymous',
    message: {
        success: false,
        message: 'Upload limit exceeded',
        retryAfter: 60
    },
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:upload:'
    }) : undefined
});

/**
 * Create custom rate limiter with options
 */
const createCustomLimiter = (options) => {
    const {
        windowMs = 60 * 1000,
        max = 60,
        message = 'Too many requests',
        keyPrefix = 'rl:custom:',
        keyGenerator,
        skipSuccessfulRequests = false
    } = options;

    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message,
            retryAfter: Math.floor(windowMs / 1000)
        },
        keyGenerator: keyGenerator || ((req) => req.user?.id || req.ip),
        skipSuccessfulRequests,
        store: redisClient ? new RedisStore({
            client: redisClient,
            prefix: keyPrefix
        }) : undefined
    });
};

module.exports = {
    generalLimiter,
    authLimiter,
    refreshLimiter,
    userLimiter,
    posLimiter,
    searchLimiter,
    reportLimiter,
    uploadLimiter,
    createCustomLimiter,
    redisClient // Export for cleanup if needed
};

const express = require('express');
const router = express.Router();
const magicLinkService = require('../services/magicLinkService');
const logger = require('../config/logger');
const { generateTokens } = require('../services/auth/tokenService');

// Rate limiting middleware (simple in-memory implementation)
const emailRateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_EMAILS_PER_WINDOW = 3;

function checkRateLimit(email) {
    const now = Date.now();
    const userLimits = emailRateLimiter.get(email) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

    if (now > userLimits.resetAt) {
        userLimits.count = 0;
        userLimits.resetAt = now + RATE_LIMIT_WINDOW;
    }

    if (userLimits.count >= MAX_EMAILS_PER_WINDOW) {
        const waitTime = Math.ceil((userLimits.resetAt - now) / 1000);
        throw new Error(`Too many requests. Please try again in ${waitTime} seconds.`);
    }

    userLimits.count++;
    emailRateLimiter.set(email, userLimits);
}

/**
 * @route   POST /api/auth/send-magic-link
 * @desc    Send magic link email for passwordless authentication
 * @access  Public
 */
router.post('/send-magic-link', async (req, res) => {
    try {
        const { email, mode } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate mode
        if (mode && !['login', 'signup'].includes(mode)) {
            return res.status(400).json({
                success: false,
                message: 'Mode must be either "login" or "signup"'
            });
        }

        // Check rate limit
        try {
            checkRateLimit(email);
        } catch (error) {
            return res.status(429).json({
                success: false,
                message: error.message
            });
        }

        // Send magic link
        const result = await magicLinkService.sendMagicLink(email, mode || 'login');

        return res.status(200).json(result);
    } catch (error) {
        logger.error('Send magic link error:', error);

        // Handle specific error cases
        if (error.message.includes('No account found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to send magic link: ' + error.message
        });
    }
});

/**
 * @route   GET /api/auth/verify-magic-link
 * @desc    Verify magic link token and authenticate user
 * @access  Public
 */
router.get('/verify-magic-link', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Extract IP address for access logging
        let ipAddress = req.ip || req.connection.remoteAddress;
        if (req.headers['x-forwarded-for']) {
            const forwardedIps = req.headers['x-forwarded-for'].split(',');
            ipAddress = forwardedIps[0].trim();
        }
        if (ipAddress && ipAddress.startsWith('::ffff:')) {
            ipAddress = ipAddress.substring(7);
        }

        const userAgent = req.headers['user-agent'];

        // Verify magic link with request context for access logging
        const result = await magicLinkService.verifyMagicLink(token, {
            ipAddress,
            userAgent
        });

        // Extract tokens from service result (tokens generated in service)
        const { accessToken, refreshToken } = result;

        // Determine production mode securely
        const isProduction = process.env.NODE_ENV === 'production' || (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https'));

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            partitioned: isProduction, // CHIPS support for Arc and strict browsers
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        // Set access token in httpOnly cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            partitioned: isProduction, // CHIPS support for Arc and strict browsers
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/',
        });

        // Return user data with auth token (accessToken only for memory storage on client)
        // NOTE: refreshToken is NOT returned in body - it's set as httpOnly cookie only
        return res.status(200).json({
            success: true,
            message: 'Authentication successful',
            token: accessToken, // Access token for memory storage
            user: {
                id: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                phoneNumber: result.user.phoneNumber,
                role: result.user.role,
                storeUsers: result.user.storeUsers
            }
        });
    } catch (error) {
        logger.error('Verify magic link error:', error);

        // Handle specific error types
        if (error.message.includes('expired') || error.message.includes('already been used') || error.message.includes('Invalid')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to verify magic link'
        });
    }
});

module.exports = router;

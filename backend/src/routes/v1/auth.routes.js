const asyncHandler = require('../../middlewares/asyncHandler');
const express = require('express');
const authController = require('../../controllers/auth/authController');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { authLimiter, refreshLimiter } = require('../../middlewares/rateLimiter');
const {
    signupSchema,
    loginSchema,
    refreshTokenSchema,
} = require('../../validators/auth.validator');
const passport = require('passport');
const { generateTokens } = require('../../services/auth/tokenService');
const logger = require('../../config/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

// Public routes with rate limiting
router.post(
    '/signup',
    authLimiter,
    validate(signupSchema),
    authController.signup
);

router.post(
    '/login',
    authLimiter,
    validate(loginSchema),
    authController.login
);

router.post(
    '/refresh',
    refreshLimiter,
    authController.refresh
);

// Session setup endpoint (for OAuth callback)
// Session setup endpoint (for OAuth callback)
router.post('/set-session', asyncHandler(async (req, res) => {
    const { accessToken, refreshToken } = req.body;

    if (!accessToken || !refreshToken) {
        return res.status(400).json({
            success: false,
            message: 'Access token and refresh token are required'
        });
    }

    // Verify tokens are valid
    const { verifyAccessToken, verifyRefreshToken } = require('../../services/auth/tokenService');
    try {
        verifyAccessToken(accessToken);
        verifyRefreshToken(refreshToken);
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid tokens'
        });
    }
    const isProduction = process.env.NODE_ENV === 'production';

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        partitioned: isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    });

    // Set access token in httpOnly cookie
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        partitioned: isProduction,
        maxAge: 15 * 60 * 1000,
        path: '/'
    });

    res.json({
        success: true,
        message: 'Session established successfully'
    });
}));

// Protected routes
router.post(
    '/logout',
    authenticate,
    authController.logout
);

router.get(
    '/profile',
    authenticate,
    authController.getProfile
);

router.get(
    '/permissions',
    authenticate,
    authController.getPermissions
);

// Magic Link Routes
router.use('/', require('../magicLinkRoutes'));

// Google OAuth Routes
router.get('/google', (req, res, next) => {
    const intent = req.query.intent || 'login'; // 'login' or 'signup'
    const prompt = intent === 'signup' ? 'select_account' : undefined;

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        state: intent, // Pass intent to callback
        prompt: 'select_account' // Always ask to avoid auto-login loops during testing
    })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
        if (err) {
            logger.error('Passport Auth Error:', err);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(`${frontendUrl}/login?error=auth_error`);
        }

        // Handle explicit failure (e.g. strict login check failed)
        if (!user) {
            const errorMessage = info?.message || 'Authentication failed';
            logger.warn(`OAuth Failure Redirect: ${errorMessage}`);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
        }

        // Successful authentication
        const { accessToken, refreshToken } = generateTokens(user.id, user.role);

        // Get IP address for logging
        let ipAddress = req.ip || req.connection.remoteAddress;
        if (req.headers['x-forwarded-for']) {
            const forwardedIps = req.headers['x-forwarded-for'].split(',');
            ipAddress = forwardedIps[0].trim();
        }
        if (ipAddress && ipAddress.startsWith('::ffff:')) {
            ipAddress = ipAddress.substring(7);
        }

        const userAgent = req.headers['user-agent'];

        // Log successful Google OAuth login
        const accessLogService = require('../../services/audit/accessLogService');
        await accessLogService.logAccess({
            userId: user.id,
            eventType: 'login_success',
            ipAddress,
            userAgent,
            deviceInfo: userAgent,
            loginMethod: 'google_oauth' // Track authentication method
        }).catch(err => {
            // Don't fail authentication if logging fails
            logger.error('Failed to log Google OAuth access:', err);
        });

        // Determine production mode securely
        // const isProduction = process.env.NODE_ENV === 'production';

        // CRITICAL: Cookies during redirect don't work reliably cross-origin
        // Instead, pass tokens in URL and let frontend set them via /auth/set-session endpoint
        // This is more reliable than trying to set cookies during OAuth redirect

        // Check if user needs onboarding (no stores)
        const needsOnboarding = !user.storeUsers || user.storeUsers.length === 0;

        // Ensure FRONTEND_URL is defined
        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) {
            logger.error('CRITICAL: FRONTEND_URL is not defined in environment variables.');
            return res.status(500).send('Configuration Error: Login cannot complete.');
        }

        // Redirect to frontend with both tokens
        // Frontend will immediately call /auth/set-session to store them as httpOnly cookies
        res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}${needsOnboarding ? '&onboarding=true' : ''}`);
    })(req, res, next);
});

module.exports = router;

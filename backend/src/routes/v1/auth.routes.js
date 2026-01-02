const express = require('express');
const authController = require('../../controllers/auth/authController');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { authLimiter } = require('../../middlewares/rateLimiter');
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
    authController.refresh
);

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
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err) {
            logger.error('Passport Auth Error:', err);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_error`);
        }

        // Handle explicit failure (e.g. strict login check failed)
        if (!user) {
            const errorMessage = info?.message || 'Authentication failed';
            logger.warn(`OAuth Failure Redirect: ${errorMessage}`);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`);
        }

        // Successful authentication
        const { accessToken, refreshToken } = generateTokens(user.id, user.role);

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        // Set access token in httpOnly cookie (XSS protection)
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/',
        });

        // Check if user needs onboarding (no stores)
        const needsOnboarding = !user.storeUsers || user.storeUsers.length === 0;

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}${needsOnboarding ? '&onboarding=true' : ''}`);
    })(req, res, next);
});

module.exports = router;

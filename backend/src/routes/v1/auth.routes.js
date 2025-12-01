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

module.exports = router;

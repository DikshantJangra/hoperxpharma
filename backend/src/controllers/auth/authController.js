const authService = require('../../services/auth/authService');
const logger = require('../../config/logger');
const accessLogService = require('../../services/audit/accessLogService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { MESSAGES } = require('../../constants');

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phoneNumber
 *               - password
 *               - confirmPassword
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, PHARMACIST, TECHNICIAN, CASHIER]
 *     responses:
 *       201:
 *         description: User registered successfully
 */
const signup = asyncHandler(async (req, res) => {
    try {
        // Validate password complexity (HIPAA requirement)
        const { validatePassword } = require('../../utils/passwordValidator');
        const passwordValidation = validatePassword(req.body.password);

        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Password does not meet security requirements',
                errors: passwordValidation.errors
            });
        }

        const result = await authService.signup(req.body);

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        // Set access token in httpOnly cookie (XSS protection)
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/',
        });

        const response = ApiResponse.created(
            {
                user: result.user,
                accessToken: result.accessToken, // Still return for compatibility
            },
            MESSAGES.AUTH.SIGNUP_SUCCESS
        );

        res.status(response.statusCode).json(response);
    } catch (error) {
        logger.error('Signup error:', error);
        throw error;
    }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Get IP address - handle proxy/load balancer scenarios
    let ipAddress = req.ip || req.connection.remoteAddress;

    // In production (behind proxy/load balancer), use x-forwarded-for header
    if (req.headers['x-forwarded-for']) {
        // x-forwarded-for can be a comma-separated list: "client, proxy1, proxy2"
        // The first IP is the real client IP
        const forwardedIps = req.headers['x-forwarded-for'].split(',');
        ipAddress = forwardedIps[0].trim();
    }

    // Clean up IPv6-mapped IPv4 addresses
    if (ipAddress && ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.substring(7);
    }

    const userAgent = req.headers['user-agent'];

    try {
        const result = await authService.login(normalizedEmail, password, {
            userAgent,
            ipAddress,
        });

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        // Set access token in httpOnly cookie (XSS protection)
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/',
        });

        // Log successful login
        await accessLogService.logAccess({
            userId: result.user.id,
            eventType: 'login_success',
            ipAddress,
            userAgent,
            deviceInfo: userAgent, // Simple mapping for now
            loginMethod: 'password' // Track authentication method
        });

        const response = ApiResponse.success(
            {
                user: result.user,
                accessToken: result.accessToken, // Still return for compatibility
                permissions: result.permissions, // Include permissions
            },
            MESSAGES.AUTH.LOGIN_SUCCESS
        );

        res.status(response.statusCode).json(response);

    } catch (error) {
        // Log failed login attempt
        // Try to find user by email to get userId for failed attempt logging
        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

            if (user) {
                await accessLogService.logAccess({
                    userId: user.id,
                    eventType: 'login_failure',
                    ipAddress,
                    userAgent,
                    deviceInfo: userAgent,
                    loginMethod: 'password' // Track authentication method
                });
            }
        } catch (logError) {
            // Silently fail - don't prevent error throwing due to logging issues
            logger.error('Failed to log failed login attempt:', logError);
        }

        throw error;
    }
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
const refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        logger.info('Refresh attempt without token');
        throw ApiError.unauthorized('Refresh token is required');
    }

    logger.info('Processing token refresh request');
    const tokens = await authService.refreshToken(refreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });

    // Set access token in httpOnly cookie (XSS protection)
    res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
    });

    const response = ApiResponse.success(
        { accessToken: tokens.accessToken }, // Still return for compatibility
        'Token refreshed successfully'
    );

    res.status(response.statusCode).json(response);
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
const logout = asyncHandler(async (req, res) => {
    // Clear both access and refresh token cookies
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('accessToken', { path: '/' });

    // Log logout if authenticated
    if (req.user) {
        // Get IP address - handle proxy/load balancer scenarios
        let ipAddress = req.ip || req.connection.remoteAddress;

        if (req.headers['x-forwarded-for']) {
            const forwardedIps = req.headers['x-forwarded-for'].split(',');
            ipAddress = forwardedIps[0].trim();
        }

        if (ipAddress && ipAddress.startsWith('::ffff:')) {
            ipAddress = ipAddress.substring(7);
        }

        const userAgent = req.headers['user-agent'];

        await accessLogService.logAccess({
            userId: req.user.id,
            eventType: 'logout',
            ipAddress,
            userAgent,
            deviceInfo: userAgent
        });
    }

    const response = ApiResponse.success(null, MESSAGES.AUTH.LOGOUT_SUCCESS);

    res.status(response.statusCode).json(response);
});

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
const getProfile = asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user.id);

    const response = ApiResponse.success(profile, 'Profile retrieved successfully');

    res.status(response.statusCode).json(response);
});

/**
 * @swagger
 * /api/v1/auth/permissions:
 *   get:
 *     summary: Get current user's permissions
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
const getPermissions = asyncHandler(async (req, res) => {
    const permissionService = require('../../services/permissionService');
    const permissions = await permissionService.getUserPermissions(req.user.id);

    const response = ApiResponse.success(
        { permissions },
        'Permissions retrieved successfully'
    );

    res.status(response.statusCode).json(response);
});

module.exports = {
    signup,
    login,
    refresh,
    logout,
    getProfile,
    getPermissions,
};

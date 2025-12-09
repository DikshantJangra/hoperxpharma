const authService = require('../../services/auth/authService');
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
        const result = await authService.signup(req.body);

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        const response = ApiResponse.created(
            {
                user: result.user,
                accessToken: result.accessToken,
            },
            MESSAGES.AUTH.SIGNUP_SUCCESS
        );

        res.status(response.statusCode).json(response);
    } catch (error) {
        console.error('Signup error:', error);
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

    // Get IP and User Agent info
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
        const result = await authService.login(email, password);

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        // Log successful login
        await accessLogService.logAccess({
            userId: result.user.id,
            eventType: 'login_success',
            ipAddress,
            userAgent,
            deviceInfo: userAgent // Simple mapping for now
        });

        const response = ApiResponse.success(
            {
                user: result.user,
                accessToken: result.accessToken,
                permissions: result.permissions, // Include permissions
            },
            MESSAGES.AUTH.LOGIN_SUCCESS
        );

        res.status(response.statusCode).json(response);

    } catch (error) {
        // Log failed login attempt if user exists (handled in service but we don't have user ID here easily unless we fetch it)
        // For security, maybe just log failure without user ID or try to find user by email first?
        // But throwing error prevents us from knowing user ID if invalid credentials.
        // We can just log with email in metadata or if we want to be strict, we'd need to lookup user ID.
        // Given complexity, let's skip failed login logging for now unless we refactor to find user first.
        // Or we can log 'login_failure' without user ID if schema allows (it doesn't, userId is required).
        // So we skip failure logging for now.
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
        console.log('Refresh attempt without token');
        throw ApiError.unauthorized('Refresh token is required');
    }

    console.log('Processing token refresh request');
    const tokens = await authService.refreshToken(refreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });

    const response = ApiResponse.success(
        { accessToken: tokens.accessToken },
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
    // Clear refresh token cookie
    res.clearCookie('refreshToken', { path: '/' });

    // Log logout if authenticated
    if (req.user) {
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
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

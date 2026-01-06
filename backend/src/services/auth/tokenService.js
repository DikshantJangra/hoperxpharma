const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { TOKEN_TYPES, TOKEN_EXPIRY } = require('../../utils/constants');

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { userId, role, type: TOKEN_TYPES.ACCESS },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || TOKEN_EXPIRY.ACCESS }
    );
};

/**
 * Generate JWT refresh token with unique JTI for stateless token rotation
 * Each refresh token has a unique ID - when refreshed, old token is replaced
 * This enables one-time use pattern without database storage
 */
const generateRefreshToken = (userId) => {
    const jti = crypto.randomUUID(); // Unique token identifier
    return jwt.sign(
        { userId, type: TOKEN_TYPES.REFRESH, jti },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || TOKEN_EXPIRY.REFRESH }
    );
};

/**
 * Generate both access and refresh tokens
 */
const generateTokens = (userId, role) => {
    return {
        accessToken: generateAccessToken(userId, role),
        refreshToken: generateRefreshToken(userId),
    };
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
};

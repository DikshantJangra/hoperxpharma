const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../config/logger');
const db = require('../config/database');
const prisma = db.getClient();
const emailService = require('./emailService');

class MagicLinkService {
    constructor() {
        this.SECRET = process.env.MAGIC_LINK_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        this.EXPIRY_MINUTES = 15;
        this.FRONTEND_URL = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://www.hoperxpharma.vercel.app' : 'http://localhost:3000');
    }

    generateToken(email, userId = null) {
        const payload = {
            email,
            userId,
            type: 'magic-link',
            timestamp: Date.now()
        };

        return jwt.sign(payload, this.SECRET, {
            expiresIn: `${this.EXPIRY_MINUTES}m`
        });
    }

    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.SECRET);

            if (decoded.type !== 'magic-link') {
                throw new Error('Invalid token type');
            }

            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Magic link has expired. Please request a new one.');
            }
            throw new Error('Invalid or malformed token.');
        }
    }

    async sendMagicLink(email, mode = 'login') {
        try {
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (mode === 'login' && !user) {
                throw new Error('No account found with this email address.');
            }

            if (mode === 'signup' && user) {
                // Smart Handling: User already exists, so switch to login mode.
                // This ensures they get a "Sign In" link instead of an error.
                // "If the mail already exist all stuff are very well handled!"
                logger.info(`Signup requested for existing user ${email}. Switching to login mode.`);
                mode = 'login';
            }

            // Generate token
            const token = this.generateToken(email, user?.userId);

            // Store in database
            const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000);

            await prisma.magicLink.create({
                data: {
                    token,
                    email,
                    userId: user?.userId,
                    expiresAt,
                    used: false
                }
            });

            // Generate magic link URL
            const magicLink = `${this.FRONTEND_URL}/verify-magic-link?token=${token}`;

            // Send email
            await emailService.sendMagicLinkEmail(email, magicLink, mode);

            logger.info(`Magic link sent to ${email} for ${mode}`);

            return {
                success: true,
                message: 'Magic link sent successfully. Please check your email.'
            };
        } catch (error) {
            logger.error(`Failed to send magic link to ${email}:`, error);
            throw error;
        }
    }

    async verifyMagicLink(token, requestContext = {}) {
        try {
            // Verify JWT token
            const decoded = this.verifyToken(token);

            // Check database record
            const magicLinkRecord = await prisma.magicLink.findUnique({
                where: { token }
            });

            if (!magicLinkRecord) {
                throw new Error('Invalid magic link.');
            }

            if (magicLinkRecord.used) {
                throw new Error('This magic link has already been used.');
            }

            if (new Date() > magicLinkRecord.expiresAt) {
                throw new Error('Magic link has expired. Please request a new one.');
            }

            // Mark as used
            await prisma.magicLink.update({
                where: { token },
                data: { used: true }
            });

            // Get or create user
            let user = await prisma.user.findUnique({
                where: { email: decoded.email },
                include: {
                    storeUsers: {
                        include: {
                            store: true
                        }
                    }
                }
            });

            if (!user) {
                // Create new user for signup flow
                const [firstName, ...lastNameParts] = (decoded.email.split('@')[0]).split('.');
                const lastName = lastNameParts.join(' ') || '';

                user = await prisma.user.create({
                    data: {
                        email: decoded.email,
                        role: 'ADMIN', // Default new magic link users to ADMIN (Owner) so they can create a store
                        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
                        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
                        phoneNumber: '0000000000', // Placeholder
                        passwordHash: 'placeholder_hash_magic_link', // Required by schema
                    },
                    include: {
                        storeUsers: {
                            include: {
                                store: true
                            }
                        }
                    }
                });

                logger.info(`New user created via magic link: ${user.email}`);
            }

            // Generate auth tokens
            const { generateTokens } = require('./auth/tokenService');
            const tokens = generateTokens(user.id, user.role);

            // Log successful magic link login
            if (requestContext.ipAddress) {
                const accessLogService = require('./audit/accessLogService');
                await accessLogService.logAccess({
                    userId: user.id,
                    eventType: 'login_success',
                    ipAddress: requestContext.ipAddress,
                    userAgent: requestContext.userAgent,
                    deviceInfo: requestContext.userAgent,
                    loginMethod: 'magic_link'
                }).catch(err => {
                    logger.error('Failed to log magic link access:', err);
                });
            }

            return {
                success: true,
                user,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            };
        } catch (error) {
            logger.error('Magic link verification failed:', error);
            throw error;
        }
    }

    async cleanupExpiredLinks() {
        try {
            const result = await prisma.magicLink.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            });

            logger.info(`Cleaned up ${result.count} expired magic links`);
            return result.count;
        } catch (error) {
            logger.error('Failed to cleanup expired magic links:', error);
            return 0;
        }
    }
}

module.exports = new MagicLinkService();

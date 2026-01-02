const crypto = require('crypto');
const prisma = require('../../db/prisma');
const emailService = require('../emailService');
const logger = require('../../config/logger');
const ApiError = require('../../utils/ApiError');

const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds

/**
 * Magic Link Service
 * Handles passwordless authentication via email
 */
class MagicLinkService {
    /**
     * Generate a secure magic link token
     * @returns {string} Secure random token
     */
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Send magic link to email
     * Handles both signup (new users) and login (existing users) transparently
     * @param {string} email - User's email address
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async sendMagicLink(email) {
        const normalizedEmail = email.toLowerCase().trim();

        // Rate limiting: Check if a recent magic link was sent
        const recentLink = await prisma.magicLink.findFirst({
            where: {
                email: normalizedEmail,
                createdAt: {
                    gte: new Date(Date.now() - RATE_LIMIT_WINDOW)
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (recentLink) {
            const timeLeft = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - recentLink.createdAt.getTime())) / 1000);
            throw ApiError.tooManyRequests(
                `Please wait ${timeLeft} seconds before requesting another magic link`
            );
        }

        // Generate token and expiry
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);

        // Store magic link
        await prisma.magicLink.create({
            data: {
                email: normalizedEmail,
                token,
                expiresAt,
                used: false
            }
        });

        // Create magic link URL
        const magicLinkUrl = `${process.env.FRONTEND_URL}/magic-link/${token}`;

        // Check if user exists to customize email messaging
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, firstName: true }
        });

        const isNewUser = !existingUser;

        // Prepare email HTML using template-like structure
        const emailHtml = this._generateMagicLinkEmail({
            magicLinkUrl,
            expiryMinutes: 15,
            isNewUser,
            firstName: existingUser?.firstName || ''
        });

        // Send email using a basic transporter (simplified for magic links)
        try {
            const nodemailer = require('nodemailer');

            // Use environment SMTP settings or a default configuration
            const transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: normalizedEmail,
                subject: isNewUser ? 'Welcome to HopeRxPharma - Verify your email' : 'Sign in to HopeRxPharma',
                html: emailHtml
            });

            logger.info(`Magic link sent to ${normalizedEmail}`);

            return {
                success: true,
                message: 'Magic link sent successfully',
                isNewUser
            };
        } catch (error) {
            logger.error('Failed to send magic link email:', error);
            // Clean up the magic link if email fails
            await prisma.magicLink.delete({
                where: { token }
            }).catch(() => { }); // Ignore cleanup errors
            throw ApiError.internal('Failed to send magic link. Please check your email configuration.');
        }
    }

    /**
     * Verify magic link token and authenticate user
     * Creates new user if doesn't exist (signup flow)
     * @param {string} token - Magic link token
     * @returns {Promise<{user: Object, accessToken: string, refreshToken: string, isNewUser: boolean}>}
     */
    async verifyMagicLink(token) {
        // Find the magic link
        const magicLink = await prisma.magicLink.findUnique({
            where: { token }
        });

        // Validate magic link
        if (!magicLink) {
            throw ApiError.badRequest('Invalid magic link');
        }

        if (magicLink.used) {
            throw ApiError.badRequest('This magic link has already been used');
        }

        if (new Date() > magicLink.expiresAt) {
            throw ApiError.badRequest('This magic link has expired');
        }

        // Mark as used
        await prisma.magicLink.update({
            where: { token },
            data: { used: true }
        });

        const email = magicLink.email;
        let user = await prisma.user.findUnique({
            where: { email },
            include: {
                storeUsers: {
                    include: {
                        store: true
                    }
                }
            }
        });

        let isNewUser = false;

        // Create user if doesn't exist (signup flow)
        if (!user) {
            isNewUser = true;

            // Extract name from email for initial setup
            const emailLocalPart = email.split('@')[0];
            const nameParts = emailLocalPart.split(/[._-]/);
            const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
            const lastName = nameParts.length > 1
                ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].slice(1)
                : firstName;

            user = await prisma.user.create({
                data: {
                    email,
                    phoneNumber: '', // Will be collected during onboarding
                    passwordHash: '', // No password for magic link users
                    firstName,
                    lastName,
                    role: 'PHARMACIST',
                    isActive: true
                },
                include: {
                    storeUsers: {
                        include: {
                            store: true
                        }
                    }
                }
            });

            logger.info(`New user created via magic link: ${email}`);
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        // Generate auth tokens
        const authService = require('./authService');
        const tokens = authService.generateTokens(user.id);

        // Clean up user object (remove sensitive data)
        const { passwordHash, pinHash, ...safeUser } = user;

        logger.info(`User authenticated via magic link: ${email}`);

        return {
            user: safeUser,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isNewUser
        };
    }

    /**
     * Clean up expired magic links
     * Should be run periodically (e.g., via cron job)
     */
    async cleanupExpiredLinks() {
        const result = await prisma.magicLink.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    {
                        used: true,
                        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours old
                    }
                ]
            }
        });

        logger.info(`Cleaned up ${result.count} expired magic links`);
        return result.count;
    }
}

module.exports = new MagicLinkService();

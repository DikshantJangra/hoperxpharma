/**
 * Platform Configuration Service
 * Manages platform-wide settings like SMTP configuration for magic links
 */

const nodemailer = require('nodemailer');
const prisma = require('../db/prisma');
const { encryptSMTPPassword, decryptSMTPPassword } = require('../utils/encryption');
const logger = require('../config/logger');

const PLATFORM_EMAIL_CONFIG_ID = 'platform_email';

class PlatformConfigService {
    /**
     * Get platform email configuration (with masked password)
     * @returns {Promise<Object|null>} Email config or null if not configured
     */
    async getEmailConfig() {
        const config = await prisma.platformEmailConfig.findUnique({
            where: { id: PLATFORM_EMAIL_CONFIG_ID }
        });

        if (!config) {
            return null;
        }

        // Return config with masked password
        return {
            id: config.id,
            smtpHost: config.smtpHost,
            smtpPort: config.smtpPort,
            smtpUser: config.smtpUser,
            smtpFromName: config.smtpFromName,
            useTLS: config.useTLS,
            isActive: config.isActive,
            lastTestedAt: config.lastTestedAt,
            lastTestResult: config.lastTestResult,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
            // Password masked for security
            hasPassword: !!config.smtpPasswordEncrypted
        };
    }

    /**
     * Set platform email configuration
     * @param {Object} emailConfig - Email configuration
     * @returns {Promise<Object>} Created/updated config (masked password)
     */
    async setEmailConfig(emailConfig) {
        const {
            smtpHost = 'smtp.gmail.com',
            smtpPort = 587,
            smtpUser,
            smtpPassword,
            smtpFromName = 'HopeRxPharma',
            useTLS = true
        } = emailConfig;

        if (!smtpUser || !smtpPassword) {
            throw new Error('SMTP user and password are required');
        }

        // Encrypt password
        const smtpPasswordEncrypted = encryptSMTPPassword(smtpPassword);

        // Upsert config (create or update)
        const config = await prisma.platformEmailConfig.upsert({
            where: { id: PLATFORM_EMAIL_CONFIG_ID },
            update: {
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPasswordEncrypted,
                smtpFromName,
                useTLS,
                isActive: false, // Needs testing before activation
                lastTestResult: null
            },
            create: {
                id: PLATFORM_EMAIL_CONFIG_ID,
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPasswordEncrypted,
                smtpFromName,
                useTLS,
                isActive: false
            }
        });

        logger.info('Platform email config updated', { smtpUser, smtpHost });

        return this.getEmailConfig();
    }

    /**
     * Test SMTP connection
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async testConnection() {
        const config = await prisma.platformEmailConfig.findUnique({
            where: { id: PLATFORM_EMAIL_CONFIG_ID }
        });

        if (!config) {
            return {
                success: false,
                message: 'Email not configured. Please save configuration first.'
            };
        }

        try {
            const password = decryptSMTPPassword(config.smtpPasswordEncrypted);

            const transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.smtpPort === 465,
                auth: {
                    user: config.smtpUser,
                    pass: password
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 15000, // 15 seconds timeout
                socketTimeout: 15000
            });

            // Verify connection with timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out after 15 seconds')), 15000)
            );

            await Promise.race([transporter.verify(), timeoutPromise]);

            // Update config with test result
            await prisma.platformEmailConfig.update({
                where: { id: PLATFORM_EMAIL_CONFIG_ID },
                data: {
                    lastTestedAt: new Date(),
                    lastTestResult: true,
                    isActive: true
                }
            });

            logger.info('Platform email connection test successful');

            return {
                success: true,
                message: 'Connection successful! Email is now active.'
            };
        } catch (error) {
            logger.error('Platform email connection test failed:', error);

            // Update config with test failure
            await prisma.platformEmailConfig.update({
                where: { id: PLATFORM_EMAIL_CONFIG_ID },
                data: {
                    lastTestedAt: new Date(),
                    lastTestResult: false,
                    isActive: false
                }
            });

            return {
                success: false,
                message: `Connection failed: ${error.message}`
            };
        }
    }

    /**
     * Get nodemailer transporter using platform config
     * @returns {Promise<nodemailer.Transporter|null>}
     */
    async getTransporter() {
        try {
            // Get config from database
            const config = await prisma.platformEmailConfig.findUnique({
                where: { id: PLATFORM_EMAIL_CONFIG_ID }
            });

            if (!config) {
                logger.warn('No platform email config found. Please configure at /setup/hrp-2026ml');
                return null;
            }

            if (!config.isActive) {
                logger.warn('Platform email config exists but is not active. Please test the connection at /setup/hrp-2026ml');
                return null;
            }

            // Decrypt password
            let password;
            try {
                password = decryptSMTPPassword(config.smtpPasswordEncrypted);
            } catch (decryptError) {
                logger.error('Failed to decrypt SMTP password. Check if SMTP_ENCRYPTION_KEY matches:', decryptError.message);
                return null;
            }

            // Create transporter
            const transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.smtpPort === 465,
                auth: {
                    user: config.smtpUser,
                    pass: password
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 30000, // 30 seconds
                socketTimeout: 30000
            });

            logger.info('Created email transporter using platform config', { smtpUser: config.smtpUser });
            return transporter;
        } catch (error) {
            logger.error('Failed to get email transporter:', error);
            return null;
        }
    }

    /**
     * Get the "from" address for emails
     * @returns {Promise<string|null>}
     */
    async getFromAddress() {
        const config = await prisma.platformEmailConfig.findUnique({
            where: { id: PLATFORM_EMAIL_CONFIG_ID }
        });

        if (config && config.isActive) {
            return `${config.smtpFromName} <${config.smtpUser}>`;
        }

        // Fall back to env vars
        if (process.env.SMTP_USER) {
            return process.env.SMTP_FROM || process.env.SMTP_USER;
        }

        return null;
    }

    /**
     * Check if email service is configured and active
     * @returns {Promise<boolean>}
     */
    async isEmailConfigured() {
        const config = await prisma.platformEmailConfig.findUnique({
            where: { id: PLATFORM_EMAIL_CONFIG_ID }
        });

        if (config && config.isActive) {
            return true;
        }

        // Check env fallback
        return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    }

    /**
     * Delete platform email configuration
     * @returns {Promise<boolean>}
     */
    async deleteEmailConfig() {
        try {
            await prisma.platformEmailConfig.delete({
                where: { id: PLATFORM_EMAIL_CONFIG_ID }
            });
            logger.info('Platform email config deleted');
            return true;
        } catch (error) {
            if (error.code === 'P2025') {
                // Record not found
                return false;
            }
            throw error;
        }
    }
}

module.exports = new PlatformConfigService();

/**
 * Platform Gmail OAuth Service
 * Handles platform-wide Gmail OAuth flow for magic link emails
 */

const { google } = require('googleapis');
const prisma = require('../db/prisma');
const { encryptSMTPPassword, decryptSMTPPassword } = require('../utils/encryption');
const logger = require('../config/logger');

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'email'
];

class PlatformGmailOAuthService {
    constructor() {
        this.oauth2Client = null;
        this.initializeClient();
    }

    /**
     * Initialize OAuth2 client using existing Google OAuth credentials
     */
    initializeClient() {
        // Reuse same credentials as Store OAuth
        const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GMAIL_PLATFORM_REDIRECT_URI ||
            `${process.env.API_BASE_URL || 'http://localhost:8000'}/api/v1/platform/gmail/callback`;

        if (!clientId || !clientSecret) {
            logger.warn('Gmail OAuth not configured for Platform. Set GMAIL_CLIENT_ID/SECRET.');
            return;
        }

        this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        logger.info('Platform Gmail OAuth service initialized');
    }

    /**
     * Generate OAuth authorization URL for platform
     * @param {string} secret - Secret key to include in state for redirect back
     * @returns {string} Authorization URL
     */
    getAuthUrl(secret) {
        if (!this.oauth2Client) {
            throw new Error('Gmail OAuth not configured. Contact administrator.');
        }

        // Include secret in state to preserve it through the callback
        const state = Buffer.from(JSON.stringify({ secret })).toString('base64');

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent', // Force consent to always get refresh token
            state
        });
    }

    /**
     * Handle OAuth callback - exchange code for tokens and save to PlatformEmailConfig
     * @param {string} code - Authorization code from Google
     * @returns {Promise<Object>} Result with email
     */
    async handleCallback(code) {
        if (!this.oauth2Client) {
            throw new Error('Gmail OAuth not configured');
        }

        try {
            // Exchange code for tokens
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            // Get user's email address
            const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            const email = userInfo.data.email;

            if (!email) {
                throw new Error('Could not retrieve email from Google account');
            }

            // Encrypt tokens
            const encryptedRefreshToken = tokens.refresh_token
                ? encryptSMTPPassword(tokens.refresh_token)
                : null;
            const encryptedAccessToken = encryptSMTPPassword(tokens.access_token);

            // Upsert PlatformEmailConfig (id is always 'platform_email')
            await prisma.platformEmailConfig.upsert({
                where: { id: 'platform_email' },
                update: {
                    authMethod: 'OAUTH',
                    gmailEmail: email,
                    gmailRefreshToken: encryptedRefreshToken || undefined, // Keep existing if null
                    gmailAccessToken: encryptedAccessToken,
                    gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    connectedAt: new Date(),
                    isActive: true,
                    lastTestedAt: new Date(),
                    lastTestResult: true
                },
                create: {
                    id: 'platform_email',
                    authMethod: 'OAUTH',
                    gmailEmail: email,
                    gmailRefreshToken: encryptedRefreshToken,
                    gmailAccessToken: encryptedAccessToken,
                    gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    connectedAt: new Date(),
                    isActive: true,
                    lastTestedAt: new Date(),
                    lastTestResult: true
                }
            });

            logger.info(`Platform Gmail OAuth connected: ${email}`);
            return { success: true, email };
        } catch (error) {
            logger.error('Platform Gmail OAuth callback failed:', error);
            throw new Error(`OAuth failed: ${error.message}`);
        }
    }

    /**
     * Get authenticated OAuth client for platform
     * @returns {Promise<OAuth2Client|null>}
     */
    async getAuthenticatedClient() {
        if (!this.oauth2Client) {
            return null;
        }

        const config = await prisma.platformEmailConfig.findUnique({
            where: { id: 'platform_email' }
        });

        if (!config || config.authMethod !== 'OAUTH' || !config.gmailRefreshToken) {
            return null;
        }

        try {
            const refreshToken = decryptSMTPPassword(config.gmailRefreshToken);
            let accessToken = config.gmailAccessToken
                ? decryptSMTPPassword(config.gmailAccessToken)
                : null;

            // Check if access token is expired
            const isExpired = !config.gmailTokenExpiry ||
                new Date(config.gmailTokenExpiry) < new Date();

            if (isExpired || !accessToken) {
                // Refresh token
                const client = new google.auth.OAuth2(
                    process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
                    process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
                );
                client.setCredentials({ refresh_token: refreshToken });
                const { credentials } = await client.refreshAccessToken();

                accessToken = credentials.access_token;

                // Update DB
                await prisma.platformEmailConfig.update({
                    where: { id: 'platform_email' },
                    data: {
                        gmailAccessToken: encryptSMTPPassword(accessToken),
                        gmailTokenExpiry: credentials.expiry_date
                            ? new Date(credentials.expiry_date)
                            : new Date(Date.now() + 3600000)
                    }
                });
            }

            const client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
            );
            client.setCredentials({
                access_token: accessToken,
                refresh_token: refreshToken
            });

            return client;
        } catch (error) {
            logger.error('Failed to get authenticated Platform client:', error);
            return null;
        }
    }

    /**
     * Send email via Gmail API
     */
    async sendEmail({ to, subject, html }) {
        const auth = await this.getAuthenticatedClient();

        if (!auth) {
            throw new Error('Platform Gmail not connected. Please configure /setup/hrp-ml-config');
        }

        const config = await prisma.platformEmailConfig.findUnique({
            where: { id: 'platform_email' }
        });

        const fromEmail = config.gmailEmail;

        // RFC 2822 format
        const messageParts = [
            `From: ${fromEmail}`,
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            html
        ];

        const message = messageParts.join('\n');
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const gmail = google.gmail({ version: 'v1', auth });
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage }
        });

        return { success: true, messageId: result.data.id };
    }

    /**
     * Test connection
     */
    async testConnection() {
        const auth = await this.getAuthenticatedClient();
        if (!auth) {
            return { success: false, message: 'Not connected' };
        }

        try {
            const oauth2 = google.oauth2({ version: 'v2', auth });
            const userInfo = await oauth2.userinfo.get();
            return { success: true, message: `Connected to ${userInfo.data.email}` };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async disconnect() {
        await prisma.platformEmailConfig.delete({
            where: { id: 'platform_email' }
        });
        return { success: true, message: 'Disconnected' };
    }

    /**
     * Get current status
     */
    async getStatus() {
        const config = await prisma.platformEmailConfig.findUnique({
            where: { id: 'platform_email' }
        });

        if (!config || config.authMethod !== 'OAUTH') {
            return {
                configured: false,
                isActive: false,
                email: null,
                lastTestResult: null
            };
        }

        return {
            configured: true,
            isActive: config.isActive,
            email: config.gmailEmail,
            lastTestResult: config.lastTestResult,
            connectedAt: config.connectedAt
        };
    }
}

module.exports = new PlatformGmailOAuthService();

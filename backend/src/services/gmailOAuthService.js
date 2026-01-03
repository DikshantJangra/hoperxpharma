/**
 * Gmail OAuth Service
 * Handles Gmail OAuth flow and sending emails via Gmail API
 */

const { google } = require('googleapis');
const prisma = require('../db/prisma');
const { encryptSMTPPassword, decryptSMTPPassword } = require('../utils/encryption');
const logger = require('../config/logger');

const PLATFORM_EMAIL_CONFIG_ID = 'platform_email';
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

class GmailOAuthService {
    constructor() {
        this.oauth2Client = null;
        this.initializeClient();
    }

    /**
     * Initialize OAuth2 client
     */
    initializeClient() {
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        const redirectUri = process.env.GMAIL_REDIRECT_URI;

        if (!clientId || !clientSecret) {
            logger.warn('Gmail OAuth not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET.');
            return;
        }

        this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    }

    /**
     * Check if Gmail OAuth is configured
     */
    isConfigured() {
        return !!this.oauth2Client;
    }

    /**
     * Generate OAuth authorization URL
     * @param {string} state - Optional state parameter
     * @returns {string} Authorization URL
     */
    getAuthUrl(state = '') {
        if (!this.oauth2Client) {
            throw new Error('Gmail OAuth not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET.');
        }

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent', // Force consent to get refresh token
            state
        });
    }

    /**
     * Handle OAuth callback - exchange code for tokens
     * @param {string} code - Authorization code from Google
     * @returns {Promise<Object>} Token info and email
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
            const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
            const profile = await gmail.users.getProfile({ userId: 'me' });
            const email = profile.data.emailAddress;

            // Encrypt tokens for storage
            const encryptedRefreshToken = tokens.refresh_token
                ? encryptSMTPPassword(tokens.refresh_token)
                : null;
            const encryptedAccessToken = encryptSMTPPassword(tokens.access_token);

            // Save to database
            await prisma.platformEmailConfig.upsert({
                where: { id: PLATFORM_EMAIL_CONFIG_ID },
                update: {
                    authMethod: 'OAUTH',
                    gmailEmail: email,
                    gmailRefreshToken: encryptedRefreshToken,
                    gmailAccessToken: encryptedAccessToken,
                    gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    connectedAt: new Date(),
                    isActive: true,
                    lastTestResult: true,
                    lastTestedAt: new Date()
                },
                create: {
                    id: PLATFORM_EMAIL_CONFIG_ID,
                    authMethod: 'OAUTH',
                    gmailEmail: email,
                    gmailRefreshToken: encryptedRefreshToken,
                    gmailAccessToken: encryptedAccessToken,
                    gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    connectedAt: new Date(),
                    isActive: true,
                    lastTestResult: true,
                    lastTestedAt: new Date()
                }
            });

            logger.info('Gmail OAuth connected successfully', { email });

            return { success: true, email };
        } catch (error) {
            logger.error('Gmail OAuth callback failed:', error);
            throw new Error(`OAuth failed: ${error.message}`);
        }
    }

    /**
     * Get authenticated OAuth client with valid tokens
     * @returns {Promise<OAuth2Client|null>}
     */
    async getAuthenticatedClient() {
        if (!this.oauth2Client) {
            return null;
        }

        const config = await prisma.platformEmailConfig.findUnique({
            where: { id: PLATFORM_EMAIL_CONFIG_ID }
        });

        if (!config || config.authMethod !== 'OAUTH' || !config.gmailRefreshToken) {
            return null;
        }

        try {
            // Decrypt tokens
            const refreshToken = decryptSMTPPassword(config.gmailRefreshToken);
            let accessToken = config.gmailAccessToken
                ? decryptSMTPPassword(config.gmailAccessToken)
                : null;

            // Check if access token is expired
            const isExpired = !config.gmailTokenExpiry ||
                new Date(config.gmailTokenExpiry) < new Date();

            if (isExpired || !accessToken) {
                // Refresh the access token
                this.oauth2Client.setCredentials({ refresh_token: refreshToken });
                const { credentials } = await this.oauth2Client.refreshAccessToken();

                accessToken = credentials.access_token;

                // Update stored tokens
                await prisma.platformEmailConfig.update({
                    where: { id: PLATFORM_EMAIL_CONFIG_ID },
                    data: {
                        gmailAccessToken: encryptSMTPPassword(accessToken),
                        gmailTokenExpiry: credentials.expiry_date
                            ? new Date(credentials.expiry_date)
                            : new Date(Date.now() + 3600000)
                    }
                });

                logger.info('Gmail access token refreshed');
            }

            this.oauth2Client.setCredentials({
                access_token: accessToken,
                refresh_token: refreshToken
            });

            return this.oauth2Client;
        } catch (error) {
            logger.error('Failed to get authenticated Gmail client:', error);
            return null;
        }
    }

    /**
     * Send email via Gmail API
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} html - HTML content
     * @returns {Promise<Object>} Send result
     */
    async sendEmail(to, subject, html) {
        const auth = await this.getAuthenticatedClient();

        if (!auth) {
            throw new Error('Gmail not connected. Please configure at /setup/hrp-2026ml');
        }

        const config = await prisma.platformEmailConfig.findUnique({
            where: { id: PLATFORM_EMAIL_CONFIG_ID }
        });

        const fromEmail = config.gmailEmail;

        // Create RFC 2822 formatted email
        const messageParts = [
            `From: HopeRxPharma <${fromEmail}>`,
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            html
        ];
        const message = messageParts.join('\n');

        // Base64 encode the message
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        try {
            const gmail = google.gmail({ version: 'v1', auth });
            const result = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage
                }
            });

            logger.info(`Email sent via Gmail API to ${to}`, { messageId: result.data.id });

            return {
                success: true,
                messageId: result.data.id
            };
        } catch (error) {
            logger.error(`Failed to send email via Gmail API:`, error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Test Gmail connection
     * @returns {Promise<Object>}
     */
    async testConnection() {
        const auth = await this.getAuthenticatedClient();

        if (!auth) {
            return {
                success: false,
                message: 'Gmail not connected. Please connect your Gmail account.'
            };
        }

        try {
            const gmail = google.gmail({ version: 'v1', auth });
            const profile = await gmail.users.getProfile({ userId: 'me' });

            await prisma.platformEmailConfig.update({
                where: { id: PLATFORM_EMAIL_CONFIG_ID },
                data: {
                    lastTestedAt: new Date(),
                    lastTestResult: true,
                    isActive: true
                }
            });

            return {
                success: true,
                message: `Connected to ${profile.data.emailAddress}`
            };
        } catch (error) {
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
     * Disconnect Gmail (revoke tokens)
     * @returns {Promise<Object>}
     */
    async disconnect() {
        try {
            const config = await prisma.platformEmailConfig.findUnique({
                where: { id: PLATFORM_EMAIL_CONFIG_ID }
            });

            if (config && config.gmailAccessToken) {
                try {
                    const accessToken = decryptSMTPPassword(config.gmailAccessToken);
                    await this.oauth2Client.revokeToken(accessToken);
                } catch (e) {
                    // Token might already be revoked, continue
                }
            }

            await prisma.platformEmailConfig.update({
                where: { id: PLATFORM_EMAIL_CONFIG_ID },
                data: {
                    authMethod: 'SMTP',
                    gmailEmail: null,
                    gmailRefreshToken: null,
                    gmailAccessToken: null,
                    gmailTokenExpiry: null,
                    connectedAt: null,
                    isActive: false
                }
            });

            logger.info('Gmail disconnected');

            return { success: true, message: 'Gmail disconnected' };
        } catch (error) {
            logger.error('Failed to disconnect Gmail:', error);
            throw new Error(`Failed to disconnect: ${error.message}`);
        }
    }

    /**
     * Get current configuration status
     * @returns {Promise<Object>}
     */
    async getStatus() {
        const config = await prisma.platformEmailConfig.findUnique({
            where: { id: PLATFORM_EMAIL_CONFIG_ID }
        });

        if (!config) {
            return {
                configured: false,
                authMethod: null,
                email: null,
                isActive: false
            };
        }

        return {
            configured: config.authMethod === 'OAUTH' && !!config.gmailRefreshToken,
            authMethod: config.authMethod,
            email: config.gmailEmail,
            isActive: config.isActive,
            connectedAt: config.connectedAt,
            lastTestedAt: config.lastTestedAt,
            lastTestResult: config.lastTestResult
        };
    }
}

module.exports = new GmailOAuthService();

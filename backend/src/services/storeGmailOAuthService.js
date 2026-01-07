/**
 * Store Gmail OAuth Service
 * Handles per-store Gmail OAuth flow for multi-tenant email sending
 */

const { google } = require('googleapis');
const prisma = require('../db/prisma');
const { encryptSMTPPassword, decryptSMTPPassword } = require('../utils/encryption');
const logger = require('../config/logger');

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'email'  // Required to get user's email address
];

class StoreGmailOAuthService {
    constructor() {
        this.oauth2Client = null;
        if (process.env.DISABLE_GMAIL_INIT !== 'true') {
            this.initializeClient();
        }
    }

    /**
     * Initialize OAuth2 client using existing Google OAuth credentials
     */
    initializeClient() {
        // Use GMAIL_ prefixed vars first, fallback to GOOGLE_ for shared credentials
        const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GMAIL_STORE_REDIRECT_URI ||
            `${process.env.API_BASE_URL || 'http://localhost:8000'}/api/v1/email/gmail/callback`;

        if (!clientId || !clientSecret) {
            logger.warn('Gmail OAuth not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET (or GOOGLE_CLIENT_ID/SECRET).');
            return;
        }

        this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        logger.info('Store Gmail OAuth service initialized');
    }

    /**
     * Check if Gmail OAuth is configured
     */
    isConfigured() {
        return !!this.oauth2Client;
    }

    /**
     * Generate OAuth authorization URL for a store
     * @param {string} storeId - Store ID to include in state
     * @returns {string} Authorization URL
     */
    getAuthUrl(storeId) {
        if (!this.oauth2Client) {
            throw new Error('Gmail OAuth not configured. Contact administrator.');
        }

        // Include storeId in state to identify which store on callback
        const state = Buffer.from(JSON.stringify({ storeId })).toString('base64');

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent', // Force consent to always get refresh token
            state
        });
    }

    /**
     * Handle OAuth callback - exchange code for tokens and save to store
     * @param {string} code - Authorization code from Google
     * @param {string} storeId - Store ID from state
     * @returns {Promise<Object>} Result with email
     */
    async handleCallback(code, storeId) {
        if (!this.oauth2Client) {
            throw new Error('Gmail OAuth not configured');
        }

        try {
            // Exchange code for tokens
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            // Get user's email address from token info (doesn't require extra scopes)
            // Use oauth2 tokeninfo to get email from the access token
            const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            const email = userInfo.data.email;

            if (!email) {
                throw new Error('Could not retrieve email from Google account');
            }

            // Encrypt tokens for storage
            const encryptedRefreshToken = tokens.refresh_token
                ? encryptSMTPPassword(tokens.refresh_token)
                : null;
            const encryptedAccessToken = encryptSMTPPassword(tokens.access_token);

            // Check if this email already exists for this store
            const existingAccount = await prisma.emailAccount.findFirst({
                where: { storeId, email }
            });

            if (existingAccount) {
                // Update existing account with OAuth
                await prisma.emailAccount.update({
                    where: { id: existingAccount.id },
                    data: {
                        authMethod: 'OAUTH',
                        gmailRefreshToken: encryptedRefreshToken || existingAccount.gmailRefreshToken,
                        gmailAccessToken: encryptedAccessToken,
                        gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                        oauthConnectedAt: new Date(),
                        isVerified: true,
                        isActive: true
                    }
                });

                logger.info(`Gmail OAuth updated for store ${storeId}`, { email });
            } else {
                // Check if this is first account for store (make it primary)
                const accountCount = await prisma.emailAccount.count({ where: { storeId } });

                // Create new OAuth email account
                await prisma.emailAccount.create({
                    data: {
                        storeId,
                        email,
                        provider: 'GMAIL',
                        authMethod: 'OAUTH',
                        gmailRefreshToken: encryptedRefreshToken,
                        gmailAccessToken: encryptedAccessToken,
                        gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                        oauthConnectedAt: new Date(),
                        isPrimary: accountCount === 0,
                        isVerified: true,
                        isActive: true
                    }
                });

                logger.info(`Gmail OAuth connected for store ${storeId}`, { email });
            }

            return { success: true, email };
        } catch (error) {
            logger.error('Gmail OAuth callback failed:', error);
            throw new Error(`OAuth failed: ${error.message}`);
        }
    }

    /**
     * Get authenticated OAuth client for a specific email account
     * @param {string} accountId - Email account ID
     * @returns {Promise<OAuth2Client|null>}
     */
    async getAuthenticatedClient(accountId) {
        if (!this.oauth2Client) {
            return null;
        }

        const account = await prisma.emailAccount.findUnique({
            where: { id: accountId }
        });

        if (!account || account.authMethod !== 'OAUTH' || !account.gmailRefreshToken) {
            return null;
        }

        try {
            // Decrypt tokens
            const refreshToken = decryptSMTPPassword(account.gmailRefreshToken);
            let accessToken = account.gmailAccessToken
                ? decryptSMTPPassword(account.gmailAccessToken)
                : null;

            // Check if access token is expired
            const isExpired = !account.gmailTokenExpiry ||
                new Date(account.gmailTokenExpiry) < new Date();

            if (isExpired || !accessToken) {
                // Refresh the access token
                const client = new google.auth.OAuth2(
                    process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
                    process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
                );
                client.setCredentials({ refresh_token: refreshToken });
                const { credentials } = await client.refreshAccessToken();

                accessToken = credentials.access_token;

                // Update stored tokens
                await prisma.emailAccount.update({
                    where: { id: accountId },
                    data: {
                        gmailAccessToken: encryptSMTPPassword(accessToken),
                        gmailTokenExpiry: credentials.expiry_date
                            ? new Date(credentials.expiry_date)
                            : new Date(Date.now() + 3600000)
                    }
                });

                logger.info(`Gmail access token refreshed for account ${accountId}`);
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
            logger.error(`Failed to get authenticated Gmail client for account ${accountId}:`, error);
            return null;
        }
    }

    /**
     * Send email via Gmail API for a specific account
     * @param {string} accountId - Email account ID  
     * @param {Object} emailData - Email data
     * @returns {Promise<Object>} Send result
     */
    async sendEmail(accountId, { to, subject, html, cc, bcc }) {
        const auth = await this.getAuthenticatedClient(accountId);

        if (!auth) {
            throw new Error('Gmail not connected or token expired. Please reconnect.');
        }

        const account = await prisma.emailAccount.findUnique({
            where: { id: accountId }
        });

        const fromEmail = account.email;

        // Create RFC 2822 formatted email
        const toHeader = Array.isArray(to) ? to.join(', ') : to;
        const messageParts = [
            `From: ${fromEmail}`,
            `To: ${toHeader}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8'
        ];

        if (cc && cc.length) {
            messageParts.splice(2, 0, `Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}`);
        }
        if (bcc && bcc.length) {
            messageParts.splice(2, 0, `Bcc: ${Array.isArray(bcc) ? bcc.join(', ') : bcc}`);
        }

        messageParts.push('', html);
        const message = messageParts.join('\n');

        // Base64 encode the message (URL-safe)
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

            logger.info(`Email sent via Gmail API from ${fromEmail}`, { messageId: result.data.id, to: toHeader });

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
     * Test Gmail connection for an account
     * @param {string} accountId - Email account ID
     * @returns {Promise<Object>}
     */
    async testConnection(accountId) {
        const auth = await this.getAuthenticatedClient(accountId);

        if (!auth) {
            return {
                success: false,
                message: 'Gmail not connected. Please connect your Gmail account.'
            };
        }

        try {
            // Use oauth2 userinfo instead of gmail.users.getProfile
            // This doesn't require gmail.readonly scope
            const oauth2 = google.oauth2({ version: 'v2', auth });
            const userInfo = await oauth2.userinfo.get();

            await prisma.emailAccount.update({
                where: { id: accountId },
                data: {
                    lastTestedAt: new Date(),
                    isVerified: true,
                    isActive: true
                }
            });

            return {
                success: true,
                message: `Connected to ${userInfo.data.email}`
            };
        } catch (error) {
            await prisma.emailAccount.update({
                where: { id: accountId },
                data: {
                    lastTestedAt: new Date(),
                    isVerified: false,
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
     * Disconnect Gmail OAuth for an account
     * @param {string} accountId - Email account ID
     * @param {string} storeId - Store ID for permission check
     * @returns {Promise<Object>}
     */
    async disconnect(accountId, storeId) {
        const account = await prisma.emailAccount.findUnique({
            where: { id: accountId }
        });

        if (!account) {
            throw new Error('Email account not found');
        }

        if (account.storeId !== storeId) {
            throw new Error('Access denied');
        }

        try {
            // Try to revoke token
            if (account.gmailAccessToken) {
                try {
                    const accessToken = decryptSMTPPassword(account.gmailAccessToken);
                    const client = new google.auth.OAuth2();
                    await client.revokeToken(accessToken);
                } catch (e) {
                    // Token might already be revoked, continue
                    logger.warn('Token revocation failed (may already be revoked):', e.message);
                }
            }

            // Delete the account or convert back to unconfigured
            await prisma.emailAccount.delete({
                where: { id: accountId }
            });

            logger.info(`Gmail disconnected for account ${accountId}`);

            return { success: true, message: 'Gmail disconnected successfully' };
        } catch (error) {
            logger.error('Failed to disconnect Gmail:', error);
            throw new Error(`Failed to disconnect: ${error.message}`);
        }
    }

    /**
     * Get OAuth status for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<Object>}
     */
    async getStoreOAuthStatus(storeId) {
        const oauthAccounts = await prisma.emailAccount.findMany({
            where: {
                storeId,
                authMethod: 'OAUTH'
            },
            select: {
                id: true,
                email: true,
                isPrimary: true,
                isActive: true,
                oauthConnectedAt: true,
                lastTestedAt: true
            }
        });

        return {
            hasOAuthAccounts: oauthAccounts.length > 0,
            accounts: oauthAccounts
        };
    }
}

module.exports = new StoreGmailOAuthService();

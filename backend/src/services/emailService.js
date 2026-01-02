const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialize();
    }

    initialize() {
        try {
            const smtpConfig = {
                pool: true, // Enable connection pooling for faster delivery
                maxConnections: 5, // Limit concurrent connections
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            };

            if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
                logger.warn('SMTP configuration is missing. Email service will not work.');
                return;
            }

            this.transporter = nodemailer.createTransport(smtpConfig);

            // Verify connection
            this.transporter.verify((error, success) => {
                if (error) {
                    logger.error('SMTP Connection Error:', error);
                } else {
                    logger.info('Email service (SMTP/Gmail) initialized successfully');
                }
            });
        } catch (error) {
            logger.error('Failed to initialize email service:', error);
        }
    }

    async sendMagicLinkEmail(email, magicLink, mode = 'login') {
        if (!this.transporter) {
            logger.error('Email service not initialized (missing SMTP config)');
            throw new Error('Email service configuration missing');
        }

        const subject = mode === 'login'
            ? 'Your Sign-In Link for HopeRxPharma'
            : 'Welcome to HopeRx! Verify your email';

        const html = this.getMagicLinkTemplate(magicLink, mode);

        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                subject,
                html
            });

            logger.info(`Magic link email sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send magic link email to ${email}:`, error);
            throw new Error('Failed to send email via SMTP.');
        }
    }

    // Template with strict user requirements: No emojis, Rx Green Logo, Specific Text
    getMagicLinkTemplate(magicLink, mode) {
        if (mode === 'signup') {
            return this.getSignupTemplate(magicLink);
        }
        return this.getLoginTemplate(magicLink);
    }

    getLoginTemplate(magicLink) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to HopeRxPharma</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F9FAFB; color: #111827;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 48px; text-align: center; border-bottom: 1px solid #F3F4F6;">
                            <div style="display: inline-block; vertical-align: middle;">
                                <div style="display: inline-block; vertical-align: middle; background-color: #10B981; color: white; border-radius: 50%; width: 44px; height: 44px; line-height: 44px; font-weight: 700; font-size: 18px; text-align: center; font-family: sans-serif; margin-right: 12px;">Rx</div>
                                <span style="display: inline-block; vertical-align: middle; font-size: 22px; font-weight: 700; color: #111827;">HopeRxPharma</span>
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 48px 20px;">
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                                Hello,
                            </p>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                                You're receiving this email because a sign-in was requested for your <strong>HopeRxPharma</strong> account.
                            </p>
                            <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #374151;">
                                To continue securely, please use the button below. This will take you directly to your account without requiring a password.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 40px;">
                                        <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background-color: #10B981; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; text-align: center;">
                                            Sign in to HopeRxPharma
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; padding: 24px 0; margin-bottom: 32px;">
                                <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Important security note
                                </p>
                                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #4B5563;">
                                    <li style="margin-bottom: 8px;">This access is temporary and will expire in <strong>15 minutes</strong></li>
                                    <li style="margin-bottom: 8px;">It can only be used once</li>
                                    <li style="margin-bottom: 0;">If the request was not made by you, no action is needed</li>
                                </ul>
                                <p style="margin: 16px 0 0; font-size: 14px; color: #4B5563;">
                                    Your account remains protected.
                                </p>
                            </div>

                            <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #111827;">
                                Button not responding?
                            </p>
                            <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #4B5563;">
                                If the button above does not work, copy and paste the following address into your browser:
                            </p>
                            <div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px; color: #10B981; font-family: monospace; margin-bottom: 32px;">
                                ${magicLink}
                            </div>
                            
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4B5563;">
                                Warm regards,<br>
                                <strong>The HopeRxPharma Team</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 32px 48px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 8px; font-size: 12px; color: #6B7280;">
                                © ${new Date().getFullYear()} HopeRxPharma
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    getSignupTemplate(magicLink) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to HopeRxPharma</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F0FDF4; color: #111827;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F0FDF4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    
                    <!-- Hero Header -->
                    <tr>
                        <td style="padding: 48px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
                            <div style="margin-bottom: 24px;">
                                <div style="display: inline-block; background-color: rgba(255,255,255,0.2); backdrop-filter: blur(4px); padding: 12px; border-radius: 16px;">
                                    <div style="background-color: white; color: #10B981; border-radius: 50%; width: 48px; height: 48px; line-height: 48px; font-weight: 700; font-size: 20px; text-align: center; font-family: sans-serif;">Rx</div>
                                </div>
                            </div>
                            <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px;">Welcome to HopeRxPharma</h1>
                            <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 500;">Your modern pharmacy OS awaits</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 48px 32px;">
                            <p style="margin: 0 0 24px; font-size: 18px; line-height: 1.6; color: #374151; text-align: center;">
                                You are one step away from transforming your pharmacy operations.
                            </p>

                            <!-- Benefits -->
                            <div style="background-color: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding-bottom: 16px;">
                                            <span style="color: #10B981; font-weight: bold; margin-right: 8px;">✓</span> 
                                            <span style="color: #4B5563; font-weight: 500;">Lightning-fast billing & invoicing</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 16px;">
                                            <span style="color: #10B981; font-weight: bold; margin-right: 8px;">✓</span> 
                                            <span style="color: #4B5563; font-weight: 500;">Smart inventory management</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 0;">
                                            <span style="color: #10B981; font-weight: bold; margin-right: 8px;">✓</span> 
                                            <span style="color: #4B5563; font-weight: 500;">Real-time analytics & reports</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 32px;">
                                        <a href="${magicLink}" style="display: inline-block; padding: 16px 40px; background-color: #10B981; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 700; text-align: center; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);">
                                            Verify & Get Started
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280; text-align: center;">
                                This link is valid for 15 minutes.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 24px 48px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                                © ${new Date().getFullYear()} HopeRxPharma • Secure & Compliant
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    async verifyConnection() {
        if (!this.transporter) return false;
        try {
            await this.transporter.verify();
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = new EmailService();

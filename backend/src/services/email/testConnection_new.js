const nodemailer = require('nodemailer');
const emailRepository = require('../../repositories/emailRepository');
const { decryptSMTPPassword } = require('../../utils/encryption');
const ApiError = require('../../utils/ApiError');

class EmailTestService {
    /**
     * Test SMTP connection for a specific account
     * @param {string} accountId - Account ID to test (optional)
     * @param {string} storeId - Store ID
     * @returns {Promise<boolean>} Connection success
     */
    async testConnection(accountId, storeId) {
        let emailAccount;

        if (accountId) {
            // Test specific account by ID
            emailAccount = await emailRepository.getEmailAccountById(accountId);
            if (!emailAccount || emailAccount.storeId !== storeId) {
                throw new ApiError(404, 'Email account not found');
            }
        } else {
            // Fallback to primary account
            emailAccount = await emailRepository.getEmailAccountByStoreId(storeId);
            if (!emailAccount) {
                throw new ApiError(404, 'Email account not found');
            }
        }

        const decryptedPassword = decryptSMTPPassword(emailAccount.smtpPasswordEncrypted);
        const transporter = this._createTransporter(emailAccount, decryptedPassword);

        try {
            await transporter.verify();

            // Update last tested timestamp and verification status
            await emailRepository.updateEmailAccountById(emailAccount.id, {
                lastTestedAt: new Date(),
                isVerified: true,
                isActive: true,
            });

            return true;
        } catch (error) {
            // Mark as failed
            await emailRepository.updateEmailAccountById(emailAccount.id, {
                lastTestedAt: new Date(),
                isVerified: false,
                isActive: false,
            });

            throw new ApiError(500, `SMTP connection failed: ${error.message}`);
        }
    }

    /**
     * Create nodemailer transporter
     * @private
     */
    _createTransporter(emailAccount, decryptedPassword) {
        return nodemailer.createTransport({
            host: emailAccount.smtpHost,
            port: emailAccount.smtpPort,
            secure: emailAccount.smtpPort === 465,
            auth: {
                user: emailAccount.smtpUsername,
                pass: decryptedPassword,
            },
        });
    }
}

module.exports = new EmailTestService();

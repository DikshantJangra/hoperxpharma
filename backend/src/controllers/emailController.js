const emailService = require('../services/email/emailService');
const logger = require('../config/logger');
const templateService = require('../services/email/templateService');
const ApiResponse = require('../utils/ApiResponse');

class EmailController {
    /**
     * Configure email account for a store
     * POST /api/email/configure
     */
    async configureEmailAccount(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;
            const emailConfig = req.body;

            const emailAccount = await emailService.configureEmailAccount(storeId, emailConfig);

            res.status(201).json(
                new ApiResponse(201, emailAccount, 'Email account configured successfully')
            );
        } catch (error) {
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to configure email account')
            );
        }
    }

    /**
     * Get email account for active store
     * GET /api/email/account
     */
    async getEmailAccount(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;

            const emailAccount = await emailService.getEmailAccount(storeId);

            if (!emailAccount) {
                res.status(404).json(
                    new ApiResponse(404, null, 'Email account not configured')
                );
                return;
            }

            res.status(200).json(
                new ApiResponse(200, emailAccount, 'Email account retrieved successfully')
            );
        } catch (error) {
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to retrieve email account')
            );
        }
    }

    /**
     * Update email account
     * PUT /api/email/account
     */
    async updateEmailAccount(req, res) {
        const storeId = req.user.activeStoreId;
        const updates = req.body;

        const emailAccount = await emailService.updateEmailAccount(storeId, updates);

        res.status(200).json(
            new ApiResponse(200, emailAccount, 'Email account updated successfully')
        );
    }

    /**
     * Get all email accounts for active store
     * GET /api/email/accounts
     */
    async getAllEmailAccounts(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;

            const emailAccounts = await emailService.getAllEmailAccounts(storeId);

            res.status(200).json(
                new ApiResponse(200, { accounts: emailAccounts, count: emailAccounts.length }, 'Email accounts retrieved successfully')
            );
        } catch (error) {
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to retrieve email accounts')
            );
        }
    }

    /**
     * Get specific email account by ID
     * GET /api/email/accounts/:accountId
     */
    async getEmailAccountById(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;
            const { accountId } = req.params;

            const emailAccount = await emailService.getEmailAccountById(accountId, storeId);

            res.status(200).json(
                new ApiResponse(200, emailAccount, 'Email account retrieved successfully')
            );
        } catch (error) {
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to retrieve email account')
            );
        }
    }

    /**
     * Set an email account as primary
     * PUT /api/email/accounts/:accountId/primary
     */
    async setPrimaryAccount(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;
            const { accountId } = req.params;

            const emailAccount = await emailService.setPrimaryAccount(accountId, storeId);

            res.status(200).json(
                new ApiResponse(200, emailAccount, 'Primary account set successfully')
            );
        } catch (error) {
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to set primary account')
            );
        }
    }

    /**
     * Update specific email account
     * PUT /api/email/accounts/:accountId
     */
    async updateEmailAccountById(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;
            const { accountId } = req.params;
            const updates = req.body;

            const emailAccount = await emailService.updateEmailAccountById(accountId, storeId, updates);

            res.status(200).json(
                new ApiResponse(200, emailAccount, 'Email account updated successfully')
            );
        } catch (error) {
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to update email account')
            );
        }
    }

    /**
     * Delete specific email account
     * DELETE /api/email/accounts/:accountId
     */
    async deleteEmailAccountById(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;
            const { accountId } = req.params;

            const result = await emailService.deleteEmailAccountById(accountId, storeId);

            res.status(200).json(
                new ApiResponse(200, result, result.message)
            );
        } catch (error) {
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to delete email account')
            );
        }
    }

    /**
     * Delete email account (DEPRECATED - use deleteEmailAccountById)
     * DELETE /api/email/account
     */
    async deleteEmailAccount(req, res) {
        const storeId = req.user.activeStoreId;

        await emailService.deleteEmailAccount(storeId);

        res.status(200).json(
            new ApiResponse(200, null, 'Email account deleted successfully')
        );
    }

    /**
     * Test SMTP connection
     * POST /api/email/test-connection
     */
    async testConnection(req, res) {
        const storeId = req.user.storeId || req.storeId;
        const { accountId } = req.body;
        logger.info("[Test Connection] Received accountId:", accountId, "storeId:", storeId);

        const success = await emailService.testConnection(accountId, storeId);
        res.status(200).json(
            new ApiResponse(200, { success, verified: true }, 'SMTP connection test successful')
        );
    }

    /**
     * Send test email
     * POST /api/email/send-test
     */
    async sendTestEmail(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;
            const userId = req.user.id;

            const result = await emailService.sendTestEmail(storeId, userId);

            res.status(200).json(
                new ApiResponse(200, result, 'Test email sent successfully')
            );
        } catch (error) {
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to send test email')
            );
        }
    }

    /**
     * Send email
     * POST /api/email/send
     */
    async sendEmail(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;
            const userId = req.user.id;
            const { context, ...emailData } = req.body;

            const result = await emailService.sendEmail(storeId, emailData, userId, context);

            res.status(200).json(
                new ApiResponse(200, result, 'Email sent successfully')
            );
        } catch (error) {
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to send email')
            );
        }
    }

    /**
     * Get email logs
     * GET /api/email/logs?page=1&limit=20&search=patient@example.com&status=SENT
     */
    async getEmailLogs(req, res) {
        const storeId = req.user.activeStoreId;
        const { page = 1, limit = 20, search, status } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const filters = {
            limit: parseInt(limit),
            skip,
            search,
            status
        };

        const result = await emailService.getEmailLogs(storeId, filters);

        res.status(200).json(
            new ApiResponse(200, result, 'Email logs retrieved successfully')
        );
    }

    /**
     * Retry failed email
     * POST /api/email/logs/:logId/retry
     */
    async retryFailedEmail(req, res) {
        const { logId } = req.params;
        const userId = req.user.id;

        const result = await emailService.retryFailedEmail(logId, userId);

        res.status(200).json(
            new ApiResponse(200, result, 'Email retry successful')
        );
    }

    /**
     * Create email template
     * POST /api/email/templates
     */
    async createTemplate(req, res) {
        const storeId = req.user.activeStoreId;
        const templateData = req.body;

        const template = await templateService.createTemplate(storeId, templateData);

        res.status(201).json(
            new ApiResponse(201, template, 'Template created successfully')
        );
    }

    /**
     * Get all templates
     * GET /api/email/templates
     */
    async getTemplates(req, res) {
        const storeId = req.user.activeStoreId;

        const templates = await templateService.getTemplates(storeId);

        res.status(200).json(
            new ApiResponse(200, { templates, total: templates.length }, 'Templates retrieved successfully')
        );
    }

    /**
     * Get template by ID
     * GET /api/email/templates/:templateId
     */
    async getTemplateById(req, res) {
        const { templateId } = req.params;
        const storeId = req.user.activeStoreId;

        const template = await templateService.getTemplateById(templateId, storeId);

        res.status(200).json(
            new ApiResponse(200, template, 'Template retrieved successfully')
        );
    }

    /**
     * Update template
     * PUT /api/email/templates/:templateId
     */
    async updateTemplate(req, res) {
        const { templateId } = req.params;
        const storeId = req.user.activeStoreId;
        const updateData = req.body;

        const template = await templateService.updateTemplate(templateId, storeId, updateData);

        res.status(200).json(
            new ApiResponse(200, template, 'Template updated successfully')
        );
    }

    /**
     * Delete template
     * DELETE /api/email/templates/:templateId
     */
    async deleteTemplate(req, res) {
        const { templateId } = req.params;
        const storeId = req.user.activeStoreId;

        await templateService.deleteTemplate(templateId, storeId);

        res.status(200).json(
            new ApiResponse(200, null, 'Template deleted successfully')
        );
    }

    /**
     * Render template with variables
     * POST /api/email/templates/:templateId/render
     */
    async renderTemplate(req, res) {
        const { templateId } = req.params;
        const storeId = req.user.storeId || req.storeId;
        const { variables } = req.body;

        const rendered = await templateService.renderTemplate(templateId, storeId, variables);

        res.status(200).json(
            new ApiResponse(200, rendered, 'Template rendered successfully')
        );
    }
}

module.exports = new EmailController();

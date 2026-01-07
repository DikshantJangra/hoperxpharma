const prisma = require('../db/prisma');

class EmailRepository {
    /**
     * Create an email account configuration
     * @param {Object} data - Email account data
     * @returns {Promise<Object>} Created email account
     */
    async createEmailAccount(data) {
        return await prisma.emailAccount.create({
            data,
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Get email account by store ID (DEPRECATED - use getAllEmailAccounts or getPrimaryEmailAccount)
     * @param {string} storeId - Store ID
     * @returns {Promise<Object|null>} Primary email account or null
     */
    async getEmailAccountByStoreId(storeId) {
        // Return primary account for backward compatibility
        return this.getPrimaryEmailAccount(storeId);
    }

    /**
     * Get all email accounts for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<Array>} Email accounts (primary first)
     */
    async getAllEmailAccounts(storeId) {
        return await prisma.emailAccount.findMany({
            where: { storeId },
            orderBy: [
                { isPrimary: 'desc' }, // Primary accounts first
                { createdAt: 'asc' },
            ],
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Get primary email account for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<Object|null>} Primary email account or null
     */
    async getPrimaryEmailAccount(storeId) {
        return await prisma.emailAccount.findFirst({
            where: {
                storeId,
                isPrimary: true,
            },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Get email account by ID
     * @param {string} accountId - Account ID
     * @returns {Promise<Object|null>} Email account or null
     */
    async getEmailAccountById(accountId) {
        return await prisma.emailAccount.findUnique({
            where: { id: accountId },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Set an account as primary (and unset previous primary)
     * @param {string} accountId - Account ID
     * @param {string} storeId - Store ID
     * @returns {Promise<Object>} Updated email account
     */
    async setPrimaryAccount(accountId, storeId) {
        // Use transaction to ensure atomicity
        return await prisma.$transaction(async (tx) => {
            // Unset current primary
            await tx.emailAccount.updateMany({
                where: {
                    storeId,
                    isPrimary: true,
                },
                data: { isPrimary: false },
            });

            // Set new primary
            return await tx.emailAccount.update({
                where: { id: accountId },
                data: { isPrimary: true },
                include: {
                    store: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
        });
    }

    /**
     * Update email account by ID
     * @param {string} accountId - Account ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated email account
     */
    async updateEmailAccountById(accountId, data) {
        return await prisma.emailAccount.update({
            where: { id: accountId },
            data,
        });
    }

    /**
     * Delete email account by ID
     * @param {string} accountId - Account ID
     * @returns {Promise<Object>} Deleted email account
     */
    async deleteEmailAccountById(accountId) {
        return await prisma.emailAccount.delete({
            where: { id: accountId },
        });
    }

    /**
     * Count email accounts for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<number>} Account count
     */
    async countEmailAccounts(storeId) {
        return await prisma.emailAccount.count({
            where: { storeId },
        });
    }

    /**
     * Update email account (DEPRECATED - use updateEmailAccountById)
     * @param {string} storeId - Store ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated email account
     */
    async updateEmailAccount(storeId, data) {
        const account = await this.getPrimaryEmailAccount(storeId);
        if (!account) {
            throw new Error('No email account found for store');
        }
        return this.updateEmailAccountById(account.id, data);
    }

    /**
     * Delete email account (DEPRECATED - use deleteEmailAccountById)
     * @param {string} storeId - Store ID
     * @returns {Promise<Object>} Deleted email account
     */
    async deleteEmailAccount(storeId) {
        const account = await this.getPrimaryEmailAccount(storeId);
        if (!account) {
            throw new Error('No email account found for store');
        }
        return this.deleteEmailAccountById(account.id);
    }

    /**
     * Create email log entry
     * @param {Object} logData - Log data
     * @returns {Promise<Object>} Created log entry
     */
    async createEmailLog(logData) {
        return await prisma.emailLog.create({
            data: logData,
        });
    }

    /**
     * Get email logs for a store
     * @param {string} storeId - Store ID
     * @param {Object} options - Query options (limit, skip, filters, search)
     * @returns {Promise<Object>} Email logs with pagination info
     */
    async getEmailLogs(storeId, options = {}) {
        const { limit = 50, skip = 0, status, search } = options;

        // Support multiple email accounts for a store
        const emailAccounts = await this.getAllEmailAccounts(storeId);
        if (!emailAccounts || emailAccounts.length === 0) {
            return { logs: [], total: 0, page: Math.floor(skip / limit) + 1, totalPages: 0 };
        }

        const accountIds = emailAccounts.map(acc => acc.id);

        const where = {
            emailAccountId: { in: accountIds },
        };

        if (status) {
            where.status = status;
        }

        // Add search functionality for recipient email or subject
        if (search && search.trim()) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { to: { has: search } },
                { cc: { has: search } },
                { bcc: { has: search } }
            ];
        }

        // Get total count for pagination
        const total = await prisma.emailLog.count({ where });

        // Get paginated logs
        const logs = await prisma.emailLog.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip,
            include: {
                emailAccount: {
                    select: {
                        id: true,
                        email: true,
                        provider: true,
                        isActive: true,
                    },
                },
            },
        });

        return {
            logs,
            total,
            page: Math.floor(skip / limit) + 1,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + limit < total,
        };
    }

    /**
     * Get email log by ID
     * @param {string} logId - Log ID
     * @returns {Promise<Object|null>} Email log or null
     */
    async getEmailLogById(logId) {
        return await prisma.emailLog.findUnique({
            where: { id: logId },
            include: {
                emailAccount: {
                    select: {
                        storeId: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Create email template
     * @param {Object} templateData - Template data
     * @returns {Promise<Object>} Created template
     */
    async createTemplate(templateData) {
        return await prisma.emailTemplate.create({
            data: templateData,
        });
    }

    /**
     * Get templates for an email account
     * @param {string} emailAccountId - Email account ID
     * @returns {Promise<Array>} Templates
     */
    async getTemplates(emailAccountId) {
        return await prisma.emailTemplate.findMany({
            where: { emailAccountId },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * Get template by ID
     * @param {string} templateId - Template ID
     * @returns {Promise<Object|null>} Template or null
     */
    async getTemplateById(templateId) {
        return await prisma.emailTemplate.findUnique({
            where: { id: templateId },
        });
    }

    /**
     * Update template
     * @param {string} templateId - Template ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated template
     */
    async updateTemplate(templateId, data) {
        return await prisma.emailTemplate.update({
            where: { id: templateId },
            data,
        });
    }

    /**
     * Delete template
     * @param {string} templateId - Template ID
     * @returns {Promise<Object>} Deleted template
     */
    async deleteTemplate(templateId) {
        return await prisma.emailTemplate.delete({
            where: { id: templateId },
        });
    }
}

module.exports = new EmailRepository();

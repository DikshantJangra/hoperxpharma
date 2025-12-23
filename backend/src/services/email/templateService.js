const emailRepository = require('../../repositories/emailRepository');
const ApiError = require('../../utils/ApiError');

class TemplateService {
    /**
     * Create an email template
     * @param {string} storeId - Store ID
     * @param {Object} templateData - Template data
     * @returns {Promise<Object>} Created template
     */
    async createTemplate(storeId, templateData) {
        // Get email account for the store
        const emailAccount = await emailRepository.getEmailAccountByStoreId(storeId);
        if (!emailAccount) {
            throw new ApiError(404, 'Email account not configured for this store');
        }

        const { name, subject, bodyHtml, variables = [] } = templateData;

        return await emailRepository.createTemplate({
            emailAccountId: emailAccount.id,
            name,
            subject,
            bodyHtml,
            variables,
        });
    }

    /**
     * Get all templates for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<Array>} Templates
     */
    async getTemplates(storeId) {
        const emailAccount = await emailRepository.getEmailAccountByStoreId(storeId);
        if (!emailAccount) {
            return [];
        }

        return await emailRepository.getTemplates(emailAccount.id);
    }

    /**
     * Get template by ID
     * @param {string} templateId - Template ID
     * @param {string} storeId - Store ID (for authorization)
     * @returns {Promise<Object>} Template
     */
    async getTemplateById(templateId, storeId) {
        const template = await emailRepository.getTemplateById(templateId);
        if (!template) {
            throw new ApiError(404, 'Template not found');
        }

        // Verify template belongs to store
        const emailAccount = await emailRepository.getEmailAccountByStoreId(storeId);
        if (!emailAccount || template.emailAccountId !== emailAccount.id) {
            throw new ApiError(403, 'Template does not belong to this store');
        }

        return template;
    }

    /**
     * Update template
     * @param {string} templateId - Template ID
     * @param {string} storeId - Store ID (for authorization)
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated template
     */
    async updateTemplate(templateId, storeId, updateData) {
        await this.getTemplateById(templateId, storeId); // Authorization check

        return await emailRepository.updateTemplate(templateId, updateData);
    }

    /**
     * Delete template
     * @param {string} templateId - Template ID
     * @param {string} storeId - Store ID (for authorization)
     * @returns {Promise<Object>} Deleted template
     */
    async deleteTemplate(templateId, storeId) {
        await this.getTemplateById(templateId, storeId); // Authorization check

        return await emailRepository.deleteTemplate(templateId);
    }

    /**
     * Render template with variables
     * @param {string} templateId - Template ID
     * @param {string} storeId - Store ID
     * @param {Object} variables - Key-value pairs for variable replacement
     * @returns {Promise<Object>} Rendered template (subject and body)
     */
    async renderTemplate(templateId, storeId, variables = {}) {
        const template = await this.getTemplateById(templateId, storeId);

        let renderedSubject = template.subject;
        let renderedBody = template.bodyHtml;

        // Replace variables in subject and body
        Object.keys(variables).forEach(key => {
            const placeholder = `{{${key}}}`;
            const value = variables[key] || '';

            renderedSubject = renderedSubject.replace(new RegExp(placeholder, 'g'), value);
            renderedBody = renderedBody.replace(new RegExp(placeholder, 'g'), value);
        });

        return {
            subject: renderedSubject,
            bodyHtml: renderedBody,
            variables: template.variables,
        };
    }
}

module.exports = new TemplateService();

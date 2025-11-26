const purchaseOrderRepository = require('../../repositories/purchaseOrderRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * PO Template Service - Business logic for template management
 */
class POTemplateService {
    /**
     * Get all templates for a store
     */
    async getTemplates(storeId, filters = {}) {
        return await purchaseOrderRepository.findTemplates(storeId, filters);
    }

    /**
     * Get template by ID
     */
    async getTemplateById(id, storeId) {
        const template = await purchaseOrderRepository.findTemplateById(id);

        if (!template) {
            throw ApiError.notFound('Template not found');
        }

        if (template.storeId !== storeId) {
            throw ApiError.forbidden('Access denied to this template');
        }

        return template;
    }

    /**
     * Create template from PO
     */
    async createTemplate(storeId, templateData, userId) {
        const { name, description, supplierId, items, paymentTerms, notes } = templateData;

        // Validate items
        if (!items || items.length === 0) {
            throw ApiError.badRequest('Template must have at least one item');
        }

        const template = await purchaseOrderRepository.createTemplate({
            storeId,
            name,
            description,
            supplierId,
            paymentTerms,
            notes,
            items,
            createdBy: userId
        });

        logger.info(`Template created: ${template.name} (ID: ${template.id}) by user ${userId}`);

        return template;
    }

    /**
     * Update template
     */
    async updateTemplate(id, storeId, templateData, userId) {
        const existingTemplate = await this.getTemplateById(id, storeId);

        const updated = await purchaseOrderRepository.updateTemplate(id, {
            ...templateData,
            updatedBy: userId
        });

        logger.info(`Template updated: ${updated.name} (ID: ${updated.id}) by user ${userId}`);

        return updated;
    }

    /**
     * Delete template (soft delete)
     */
    async deleteTemplate(id, storeId) {
        const template = await this.getTemplateById(id, storeId);

        await purchaseOrderRepository.deleteTemplate(id);

        logger.info(`Template deleted: ${template.name} (ID: ${template.id})`);

        return { success: true };
    }

    /**
     * Load template and create PO from it
     */
    async loadTemplate(id, storeId) {
        const template = await this.getTemplateById(id, storeId);

        // Update usage stats
        await purchaseOrderRepository.updateTemplateUsage(id);

        // Return template data formatted for PO creation
        return {
            supplierId: template.supplierId,
            paymentTerms: template.paymentTerms,
            notes: template.notes,
            items: template.items.map(item => ({
                drugId: item.drugId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountPercent: item.discountPercent
            }))
        };
    }

    /**
     * Duplicate template
     */
    async duplicateTemplate(id, storeId, userId) {
        const original = await this.getTemplateById(id, storeId);

        const duplicate = await this.createTemplate(
            storeId,
            {
                name: `${original.name} (Copy)`,
                description: original.description,
                supplierId: original.supplierId,
                paymentTerms: original.paymentTerms,
                notes: original.notes,
                items: original.items.map(item => ({
                    drugId: item.drugId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountPercent: item.discountPercent
                }))
            },
            userId
        );

        logger.info(`Template duplicated: ${original.name} -> ${duplicate.name}`);

        return duplicate;
    }
}

module.exports = new POTemplateService();

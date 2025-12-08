const consolidatedInvoiceRepository = require('../../repositories/consolidatedInvoiceRepository');

class ConsolidatedInvoiceService {
    /**
     * Get GRNs available for invoicing
     */
    async getGRNsForInvoicing(storeId, filters) {
        return await consolidatedInvoiceRepository.getGRNsForInvoicing(storeId, filters);
    }

    /**
     * Create consolidated invoice from selected GRNs
     */
    async createInvoice(data, userId, storeId) {
        // Validate GRN IDs
        if (!data.grnIds || data.grnIds.length === 0) {
            throw new Error('At least one GRN must be selected');
        }

        // Add storeId to data
        data.storeId = storeId;

        return await consolidatedInvoiceRepository.createConsolidatedInvoice(data, userId);
    }

    /**
     * Get invoice by ID with full details
     */
    async getInvoiceById(id, storeId) {
        const invoice = await consolidatedInvoiceRepository.getById(id, storeId);

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        return invoice;
    }

    /**
     * List all consolidated invoices
     */
    async listInvoices(storeId, filters) {
        return await consolidatedInvoiceRepository.list(storeId, filters);
    }

    /**
     * Update invoice status
     */
    async updateInvoiceStatus(id, storeId, status) {
        const validStatuses = ['DRAFT', 'FINALIZED', 'SENT', 'ARCHIVED'];

        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        return await consolidatedInvoiceRepository.updateStatus(id, storeId, status);
    }

    /**
     * Delete invoice (only if DRAFT)
     */
    async deleteInvoice(id, storeId) {
        const invoice = await this.getInvoiceById(id, storeId);

        if (invoice.status !== 'DRAFT') {
            throw new Error('Only draft invoices can be deleted');
        }

        return await consolidatedInvoiceRepository.delete(id, storeId);
    }

    /**
     * Finalize invoice (change from DRAFT to FINALIZED)
     */
    async finalizeInvoice(id, storeId) {
        const invoice = await this.getInvoiceById(id, storeId);

        if (invoice.status !== 'DRAFT') {
            throw new Error('Only draft invoices can be finalized');
        }

        return await this.updateInvoiceStatus(id, storeId, 'FINALIZED');
    }
}

module.exports = new ConsolidatedInvoiceService();

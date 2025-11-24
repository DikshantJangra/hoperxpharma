const supplierRepository = require('../../repositories/supplierRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * Supplier Service - Business logic for supplier management
 */
class SupplierService {
    /**
     * Get all suppliers with pagination
     */
    async getSuppliers(filters) {
        return await supplierRepository.findSuppliers(filters);
    }

    /**
     * Get supplier by ID
     */
    async getSupplierById(id) {
        const supplier = await supplierRepository.findById(id);

        if (!supplier) {
            throw ApiError.notFound('Supplier not found');
        }

        return supplier;
    }

    /**
     * Create new supplier
     */
    async createSupplier(supplierData) {
        // Validate GSTIN format if provided
        if (supplierData.gstin) {
            if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(supplierData.gstin)) {
                throw ApiError.badRequest('Invalid GSTIN format');
            }

            // Check for duplicate GSTIN
            const existingSupplier = await supplierRepository.findByGSTIN(supplierData.gstin);
            if (existingSupplier) {
                throw ApiError.conflict('Supplier with this GSTIN already exists');
            }
        }

        const supplier = await supplierRepository.create(supplierData);
        logger.info(`Supplier created: ${supplier.name} (ID: ${supplier.id})`);

        return supplier;
    }

    /**
     * Update supplier
     */
    async updateSupplier(id, supplierData) {
        const existingSupplier = await supplierRepository.findById(id);

        if (!existingSupplier) {
            throw ApiError.notFound('Supplier not found');
        }

        // Validate GSTIN if being updated
        if (supplierData.gstin && supplierData.gstin !== existingSupplier.gstin) {
            if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(supplierData.gstin)) {
                throw ApiError.badRequest('Invalid GSTIN format');
            }

            const duplicate = await supplierRepository.findByGSTIN(supplierData.gstin);
            if (duplicate) {
                throw ApiError.conflict('Supplier with this GSTIN already exists');
            }
        }

        const supplier = await supplierRepository.update(id, supplierData);
        logger.info(`Supplier updated: ${supplier.name} (ID: ${supplier.id})`);

        return supplier;
    }

    /**
     * Delete supplier (soft delete)
     */
    async deleteSupplier(id) {
        const existingSupplier = await supplierRepository.findById(id);

        if (!existingSupplier) {
            throw ApiError.notFound('Supplier not found');
        }

        await supplierRepository.softDelete(id);
        logger.info(`Supplier deleted: ${existingSupplier.name} (ID: ${id})`);

        return { success: true, message: 'Supplier deleted successfully' };
    }

    /**
     * Get supplier statistics
     */
    async getSupplierStats() {
        return await supplierRepository.getStats();
    }
}

module.exports = new SupplierService();

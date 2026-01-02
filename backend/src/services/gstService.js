const gstRepository = require('../repositories/gstRepository');
const { validateGSTIN } = require('../utils/gstCalculator');

class GSTService {
    // ======== TAX SLABS ========

    async createTaxSlab(data, storeId) {
        // Validate input
        if (!data.name || data.rate === undefined) {
            throw new Error('Tax slab name and rate are required');
        }

        if (data.rate < 0 || data.rate > 100) {
            throw new Error('Tax rate must be between 0 and 100');
        }

        // Auto-compute CGST/SGST if not provided
        if (data.isSplit && (!data.cgstRate || !data.sgstRate)) {
            data.cgstRate = data.rate / 2;
            data.sgstRate = data.rate / 2;
        }

        if (!data.igstRate) {
            data.igstRate = data.rate;
        }

        return gstRepository.createTaxSlab({
            ...data,
            storeId
        });
    }

    async getTaxSlabById(id) {
        const taxSlab = await gstRepository.findTaxSlabById(id);
        if (!taxSlab) {
            throw new Error('Tax slab not found');
        }
        return taxSlab;
    }

    async getTaxSlabsByStore(storeId, options = {}) {
        return gstRepository.findTaxSlabsByStore(storeId, options);
    }

    async updateTaxSlab(id, data) {
        // Validate
        if (data.rate !== undefined && (data.rate < 0 || data.rate > 100)) {
            throw new Error('Tax rate must be between 0 and 100');
        }

        // Recompute CGST/SGST if rate changed
        if (data.rate !== undefined && data.isSplit) {
            data.cgstRate = data.rate / 2;
            data.sgstRate = data.rate / 2;
            data.igstRate = data.rate;
        }

        return gstRepository.updateTaxSlab(id, data);
    }

    async deleteTaxSlab(id) {
        // Check if any HSN codes are using this slab
        const taxSlab = await gstRepository.findTaxSlabById(id);
        if (taxSlab.hsnCodes && taxSlab.hsnCodes.length > 0) {
            throw new Error('Cannot delete tax slab with linked HSN codes');
        }

        return gstRepository.deleteTaxSlab(id);
    }

    // ======== HSN CODES ========

    async createHsnCode(data, storeId) {
        // Validate
        if (!data.code || !data.description || !data.taxSlabId) {
            throw new Error('HSN code, description, and tax slab are required');
        }

        // Validate HSN code format (should be 4, 6, or 8 digits)
        if (!/^\d{4}(\.\d{2}(\.\d{2})?)?$/.test(data.code)) {
            throw new Error('Invalid HSN code format. Expected format: XXXX.XX.XX');
        }

        // Check if tax slab exists
        await this.getTaxSlabById(data.taxSlabId);

        return gstRepository.createHsnCode({
            ...data,
            storeId
        });
    }

    async getHsnCodeById(id) {
        const hsnCode = await gstRepository.findHsnCodeById(id);
        if (!hsnCode) {
            throw new Error('HSN code not found');
        }
        return hsnCode;
    }

    async getHsnCodeByCode(code, storeId) {
        return gstRepository.findHsnCodeByCode(code, storeId);
    }

    async getHsnCodesByStore(storeId, options = {}) {
        return gstRepository.findHsnCodesByStore(storeId, options);
    }

    async updateHsnCode(id, data) {
        // Validate HSN code format if being updated
        if (data.code && !/^\d{4}(\.\d{2}(\.\d{2})?)?$/.test(data.code)) {
            throw new Error('Invalid HSN code format');
        }

        // Validate tax slab exists if being updated
        if (data.taxSlabId) {
            await this.getTaxSlabById(data.taxSlabId);
        }

        return gstRepository.updateHsnCode(id, data);
    }

    async deleteHsnCode(id) {
        // Check if any drugs are using this HSN code
        const hsnCode = await gstRepository.findHsnCodeById(id);
        if (hsnCode.drugs && hsnCode.drugs.length > 0) {
            throw new Error('Cannot delete HSN code linked to products');
        }

        return gstRepository.deleteHsnCode(id);
    }

    // ======== SEEDING & INITIALIZATION ========

    async seedDefaults(storeId) {
        // Check if already seeded
        const existingSlabs = await gstRepository.findTaxSlabsByStore(storeId);
        if (existingSlabs.length > 0) {
            throw new Error('Default tax slabs already exist for this store');
        }

        // Seed tax slabs
        await gstRepository.seedDefaultTaxSlabs(storeId);

        // Seed HSN codes
        await gstRepository.seedPharmacyHsnCodes(storeId);

        return {
            success: true,
            message: 'Default tax slabs and HSN codes seeded successfully'
        };
    }

    // ======== VALIDATION UTILITIES ========

    validateGSTIN(gstin) {
        return validateGSTIN(gstin);
    }
}

module.exports = new GSTService();

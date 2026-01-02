const gstService = require('../services/gstService');

class GSTController {
    // ======== TAX SLABS ========

    async createTaxSlab(req, res, next) {
        try {
            const { storeId } = req.user;
            const taxSlab = await gstService.createTaxSlab(req.body, storeId);

            res.status(201).json({
                success: true,
                data: taxSlab
            });
        } catch (error) {
            next(error);
        }
    }

    async getTaxSlabs(req, res, next) {
        try {
            const { storeId } = req.user;
            const { isActive } = req.query;

            const options = {};
            if (isActive !== undefined) {
                options.isActive = isActive === 'true';
            }

            const taxSlabs = await gstService.getTaxSlabsByStore(storeId, options);

            res.json({
                success: true,
                data: taxSlabs
            });
        } catch (error) {
            next(error);
        }
    }

    async getTaxSlabById(req, res, next) {
        try {
            const { id } = req.params;
            const taxSlab = await gstService.getTaxSlabById(id);

            res.json({
                success: true,
                data: taxSlab
            });
        } catch (error) {
            next(error);
        }
    }

    async updateTaxSlab(req, res, next) {
        try {
            const { id } = req.params;
            const taxSlab = await gstService.updateTaxSlab(id, req.body);

            res.json({
                success: true,
                data: taxSlab
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteTaxSlab(req, res, next) {
        try {
            const { id } = req.params;
            await gstService.deleteTaxSlab(id);

            res.json({
                success: true,
                message: 'Tax slab marked inactive'
            });
        } catch (error) {
            next(error);
        }
    }

    // ======== HSN CODES ========

    async createHsnCode(req, res, next) {
        try {
            const { storeId } = req.user;
            const hsnCode = await gstService.createHsnCode(req.body, storeId);

            res.status(201).json({
                success: true,
                data: hsnCode
            });
        } catch (error) {
            next(error);
        }
    }

    async getHsnCodes(req, res, next) {
        try {
            const { storeId } = req.user;
            const { search, category, isActive } = req.query;

            const options = {};
            if (search) options.search = search;
            if (category) options.category = category;
            if (isActive !== undefined) options.isActive = isActive === 'true';

            const hsnCodes = await gstService.getHsnCodesByStore(storeId, options);

            res.json({
                success: true,
                data: hsnCodes
            });
        } catch (error) {
            next(error);
        }
    }

    async getHsnCodeById(req, res, next) {
        try {
            const { id } = req.params;
            const hsnCode = await gstService.getHsnCodeById(id);

            res.json({
                success: true,
                data: hsnCode
            });
        } catch (error) {
            next(error);
        }
    }

    async updateHsnCode(req, res, next) {
        try {
            const { id } = req.params;
            const hsnCode = await gstService.updateHsnCode(id, req.body);

            res.json({
                success: true,
                data: hsnCode
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteHsnCode(req, res, next) {
        try {
            const { id } = req.params;
            await gstService.deleteHsnCode(id);

            res.json({
                success: true,
                message: 'HSN code marked inactive'
            });
        } catch (error) {
            next(error);
        }
    }

    // ======== UTILITIES ========

    async seedDefaults(req, res, next) {
        try {
            const { storeId } = req.user;
            const result = await gstService.seedDefaults(storeId);

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    async validateGSTIN(req, res, next) {
        try {
            const { gstin } = req.body;
            const isValid = gstService.validateGSTIN(gstin);

            res.json({
                success: true,
                data: {
                    gstin,
                    isValid
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new GSTController();

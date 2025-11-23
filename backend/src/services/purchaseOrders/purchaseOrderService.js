const purchaseOrderRepository = require('../../repositories/purchaseOrderRepository');
const ApiError = require('../../Utils/ApiError');
const logger = require('../../config/logger');

/**
 * Purchase Order Service - Business logic for PO management
 */
class PurchaseOrderService {
    /**
     * Get all suppliers
     */
    async getSuppliers(filters) {
        return await purchaseOrderRepository.findSuppliers(filters);
    }

    /**
     * Get supplier by ID
     */
    async getSupplierById(id) {
        const supplier = await purchaseOrderRepository.findSupplierById(id);

        if (!supplier) {
            throw ApiError.notFound('Supplier not found');
        }

        return supplier;
    }

    /**
     * Create supplier
     */
    async createSupplier(supplierData) {
        const supplier = await purchaseOrderRepository.createSupplier(supplierData);
        logger.info(`Supplier created: ${supplier.name} (ID: ${supplier.id})`);

        return supplier;
    }

    /**
     * Update supplier
     */
    async updateSupplier(id, supplierData) {
        const existingSupplier = await purchaseOrderRepository.findSupplierById(id);

        if (!existingSupplier) {
            throw ApiError.notFound('Supplier not found');
        }

        const supplier = await purchaseOrderRepository.updateSupplier(id, supplierData);
        logger.info(`Supplier updated: ${supplier.name} (ID: ${supplier.id})`);

        return supplier;
    }

    /**
     * Get all purchase orders
     */
    async getPurchaseOrders(filters) {
        return await purchaseOrderRepository.findPurchaseOrders(filters);
    }

    /**
     * Get PO by ID
     */
    async getPOById(id) {
        const po = await purchaseOrderRepository.findPOById(id);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        return po;
    }

    /**
     * Create purchase order
     */
    async createPO(poData) {
        const { items, ...poInfo } = poData;

        // Generate PO number
        const poNumber = await purchaseOrderRepository.generatePONumber(poInfo.storeId);

        // Create PO
        const result = await purchaseOrderRepository.createPO(
            { ...poInfo, poNumber, status: 'DRAFT' },
            items
        );

        logger.info(`Purchase order created: ${poNumber} - Total: ${poInfo.total}`);

        return {
            ...result.po,
            items: result.items,
        };
    }

    /**
     * Approve purchase order
     */
    async approvePO(id, approvedBy) {
        const po = await purchaseOrderRepository.findPOById(id);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        if (po.status !== 'PENDING_APPROVAL' && po.status !== 'DRAFT') {
            throw ApiError.badRequest(`Cannot approve PO with status: ${po.status}`);
        }

        const updatedPO = await purchaseOrderRepository.updatePOStatus(id, 'APPROVED', approvedBy);
        logger.info(`Purchase order approved: ${po.poNumber} by ${approvedBy}`);

        return updatedPO;
    }

    /**
     * Send purchase order to supplier
     */
    async sendPO(id) {
        const po = await purchaseOrderRepository.findPOById(id);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        if (po.status !== 'APPROVED') {
            throw ApiError.badRequest('Only approved POs can be sent');
        }

        const updatedPO = await purchaseOrderRepository.updatePOStatus(id, 'SENT');
        logger.info(`Purchase order sent: ${po.poNumber}`);

        return updatedPO;
    }

    /**
     * Create PO receipt
     */
    async createReceipt(receiptData) {
        const po = await purchaseOrderRepository.findPOById(receiptData.poId);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        if (po.status !== 'SENT' && po.status !== 'PARTIALLY_RECEIVED') {
            throw ApiError.badRequest('Can only receive items for sent POs');
        }

        // Add store and supplier info to receipt data
        const enrichedReceiptData = {
            ...receiptData,
            storeId: po.storeId,
            supplierId: po.supplierId,
        };

        const receipt = await purchaseOrderRepository.createReceipt(enrichedReceiptData);
        logger.info(`PO receipt created for ${po.poNumber}`);

        return receipt;
    }

    /**
     * Get PO statistics
     */
    async getPOStats(storeId) {
        return await purchaseOrderRepository.getPOStats(storeId);
    }
}

module.exports = new PurchaseOrderService();

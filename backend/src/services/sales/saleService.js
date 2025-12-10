const saleRepository = require('../../repositories/saleRepository');
const inventoryService = require('../inventory/inventoryService');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Sale Service - Business logic for sales management
 */
class SaleService {
    /**
     * Get all sales with pagination
     */
    async getSales(filters) {
        return await saleRepository.findSales(filters);
    }

    /**
     * Get sale by ID
     */
    async getSaleById(id) {
        const sale = await saleRepository.findById(id);

        if (!sale) {
            throw ApiError.notFound('Sale not found');
        }

        return sale;
    }

    /**
     * Create new sale
     */
    async createSale(saleData) {
        const { items, paymentSplits, ...saleInfo } = saleData;

        // Generate invoice number
        const invoiceNumber = await saleRepository.generateInvoiceNumber(saleInfo.storeId);

        // Validations & Logic based on Invoice Type
        if (saleInfo.invoiceType === 'ESTIMATE') {
            saleInfo.status = 'QUOTATION';
            // ESTIMATES do not deduct stock or validate payment
        } else {
            // Validate stock availability for all items (ONLY for real sales)
            for (const item of items) {
                const batch = await inventoryService.getBatchById(item.batchId);

                if (batch.quantityInStock < item.quantity) {
                    throw ApiError.badRequest(
                        `Insufficient stock for ${batch.drug.name}. Available: ${batch.quantityInStock}, Required: ${item.quantity}`
                    );
                }
            }

            // Validate payment total matches sale total
            const paymentTotal = paymentSplits.reduce((sum, p) => sum + p.amount, 0);
            // Allow small float diff
            if (Math.abs(paymentTotal - saleInfo.total) > 0.1) {
                // throw ApiError.badRequest('Payment total does not match sale total'); 
                // Note: For now, we allow partial payments or credit later, but strictly warning here is good.
                // Keeping it loose for MVP interactions if needed, but strict is safer.
                // Re-enabling strict check:
                if (Math.abs(paymentTotal - saleInfo.total) > 0.01) {
                    throw ApiError.badRequest('Payment total does not match sale total');
                }
            }
        }

        // Create sale with transaction
        // Repository handles prescription status update within the transaction
        const result = await saleRepository.createSale(
            { ...saleInfo, invoiceNumber },
            items,
            paymentSplits
        );

        logger.info(`Sale created: ${invoiceNumber} - Total: ${saleInfo.total}`);

        return {
            ...result.sale,
            items: result.items,
            paymentSplits: result.payments,
        };
    }

    /**
     * Get sales statistics
     */
    async getSalesStats(storeId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // First day of month
        const end = endDate ? new Date(endDate) : new Date();

        return await saleRepository.getSalesStats(storeId, start, end);
    }

    /**
     * Get top selling drugs
     */
    async getTopSellingDrugs(storeId, limit = 10) {
        return await saleRepository.getTopSellingDrugs(storeId, limit);
    }

    /**
     * Get sale by invoice number
     */
    async getSaleByInvoiceNumber(invoiceNumber) {
        const sale = await saleRepository.findByInvoiceNumber(invoiceNumber);

        if (!sale) {
            throw ApiError.notFound('Sale not found');
        }

        return sale;
    }

    /**
     * Get next invoice number
     */
    async getNextInvoiceNumber(storeId) {
        return await saleRepository.generateInvoiceNumber(storeId);
    }
}

module.exports = new SaleService();

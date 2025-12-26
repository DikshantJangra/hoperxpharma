const saleRepository = require('../../repositories/saleRepository');
const inventoryService = require('../inventory/inventoryService');
const prescriptionService = require('../prescriptions/prescriptionService');
const dispenseService = require('../prescriptions/dispenseService');
const versionService = require('../prescriptions/versionService');
const refillService = require('../prescriptions/refillService');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Sale Service (Refactored with Dispense Integration)
 * Business logic for sales management with new prescription architecture
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
     * Create sale from Dispense (NEW ARCHITECTURE)
     * Imports clinical data as snapshot, allows financial edits only
     */
    async createSaleFromDispense(dispenseId, saleData, userId) {
        // 1. Get dispense with full prescription context
        const dispense = await dispenseService.getDispenseById(dispenseId);

        if (!dispense) {
            throw ApiError.notFound('Dispense not found');
        }

        if (dispense.status !== 'READY') {
            throw ApiError.badRequest(`Dispense must be READY for sale. Current status: ${dispense.status}`);
        }

        const prescription = dispense.refill.prescription;
        const prescriptionVersion = dispense.prescriptionVersion;

        // 2. Build sale items from prescription version (clinical snapshot)
        const items = prescriptionVersion.items.map(item => ({
            drugId: item.drugId,
            batchId: item.batchId || saleData.batches?.[item.drugId], // Use prescribed batch or POS selected batch
            quantity: item.quantityPrescribed,
            mrp: saleData.itemPrices?.[item.drugId]?.mrp || 0, // Financial: editable
            discount: saleData.itemPrices?.[item.drugId]?.discount || 0, // Financial: editable
            gstRate: item.drug.gstRate || 12,
            lineTotal: 0 // Will be calculated
        }));

        // Calculate line totals
        items.forEach(item => {
            const basePrice = item.mrp * item.quantity;
            const discountAmount = (item.discount / 100) * basePrice;
            const taxableAmount = basePrice - discountAmount;
            const gstAmount = (item.gstRate / 100) * taxableAmount;
            item.lineTotal = taxableAmount + gstAmount;
        });

        // 3. Prepare sale data
        const { paymentSplits, ...saleInfo } = saleData;

        // Generate invoice number
        const invoiceNumber = await saleRepository.generateInvoiceNumber(saleInfo.storeId);

        // Link to dispense (not prescription directly)
        const saleDataWithDispense = {
            ...saleInfo,
            invoiceNumber,
            dispenseId: dispense.id, // NEW: Link to dispense
            prescriptionId: prescription.id, // Legacy: Keep for backward compatibility
            patientId: prescription.patientId,
            status: 'COMPLETED'
        };

        // 4. Create sale using existing repository method
        const result = await saleRepository.createSale(
            saleDataWithDispense,
            items,
            paymentSplits
        );

        // 5. Complete dispense workflow
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        await dispenseService.completeDispense(dispenseId, userId, totalQuantity);

        // 6. Update prescription status if all refills exhausted
        await prescriptionService.updatePrescriptionStatus(prescription.id);

        logger.info(`Sale created from dispense: ${invoiceNumber} - Dispense: ${dispenseId}`);

        return {
            ...result.sale,
            items: result.items,
            paymentSplits: result.payments,
        };
    }

    /**
     * Create Quick Sale (Walk-in without prescription)
     * Auto-creates minimal ONE_TIME prescription in background
     */
    async createQuickSale(saleData, userId) {
        const { items, paymentSplits, patientId, ...saleInfo } = saleData;

        // 1. Create minimal ONE_TIME prescription in background
        const prescriptionData = {
            storeId: saleInfo.storeId,
            patientId: patientId || null, // Optional for quick sales
            type: 'ONE_TIME',
            totalRefills: 0, // No refills for quick sales
            expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
            items: items.map(item => ({
                drugId: item.drugId,
                batchId: item.batchId,
                quantity: item.quantity,
                sig: 'As directed', // Default instruction
                substitutionAllowed: true
            })),
            instructions: 'Quick Sale - Walk-in customer'
        };

        const prescription = await prescriptionService.createPrescription(prescriptionData, userId);

        // 2. Auto-activate prescription
        await prescriptionService.activatePrescription(prescription.id, userId);

        // 3. Get refill and create dispense
        const refill = await refillService.getNextAvailableRefill(prescription.id);
        const version = await versionService.getLatestVersion(prescription.id);

        const dispense = await dispenseService.createDispense(
            refill.id,
            version.id,
            userId
        );

        // 4. Auto-progress dispense to READY (skip workflow for quick sales)
        await dispenseService.updateStatus(dispense.id, 'READY', userId, 'Quick Sale - Auto-progressed');

        // 5. Create sale from dispense
        return await this.createSaleFromDispense(
            dispense.id,
            {
                ...saleInfo,
                itemPrices: items.reduce((acc, item) => ({
                    ...acc,
                    [item.drugId]: {
                        mrp: item.mrp,
                        discount: item.discount || 0
                    }
                }), {}),
                batches: items.reduce((acc, item) => ({
                    ...acc,
                    [item.drugId]: item.batchId
                }), {}),
                paymentSplits
            },
            userId
        );
    }

    /**
     * Legacy: Create sale (OLD ARCHITECTURE - kept for backward compatibility)
     * Will be deprecated once frontend migrates to dispense-based flow
     */
    async createSale(saleData) {
        const { items, paymentSplits, ...saleInfo } = saleData;

        // Generate invoice number
        const invoiceNumber = await saleRepository.generateInvoiceNumber(saleInfo.storeId);

        // Validations & Logic based on Invoice Type
        if (saleInfo.invoiceType === 'ESTIMATE') {
            saleInfo.status = 'QUOTATION';
        } else {
            // Validate stock availability for all items
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
            if (Math.abs(paymentTotal - saleInfo.total) > 0.01) {
                throw ApiError.badRequest('Payment total does not match sale total');
            }
        }

        // Create sale with transaction
        const result = await saleRepository.createSale(
            { ...saleInfo, invoiceNumber },
            items,
            paymentSplits
        );

        logger.info(`Sale created (legacy): ${invoiceNumber} - Total: ${saleInfo.total}`);

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
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
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

    /**
     * Get ready dispenses for POS (replaces getVerifiedPrescriptions)
     * Returns dispenses that are READY for sale
     */
    async getReadyDispensesForPOS(storeId) {
        return await dispenseService.getWorkbenchDispenses(storeId, 'READY');
    }
}

module.exports = new SaleService();

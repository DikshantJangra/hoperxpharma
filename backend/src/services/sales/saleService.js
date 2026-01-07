const saleRepository = require('../../repositories/saleRepository');
const inventoryService = require('../inventory/inventoryService');
const prescriptionService = require('../prescriptions/prescriptionService');
const refillService = require('../prescriptions/refillService');
const versionService = require('../prescriptions/versionService');
const dispenseService = require('../prescriptions/dispenseService');
const logger = require('../../config/logger');
const ApiError = require('../../utils/ApiError');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../../db/prisma');
const loyaltyService = require('../loyaltyService');
const gstCalculator = require('../../utils/gstCalculator');
const gstRepository = require('../../repositories/gstRepository');
const configService = require('../configService');

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
        try {
            logger.info('createSaleFromDispense: Starting', { dispenseId, userId });

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

            logger.info('createSaleFromDispense: Got dispense details', {
                prescriptionId: prescription.id,
                versionId: prescriptionVersion.id,
                itemCount: prescriptionVersion.items.length
            });

            // Get defaults from config
            const defaultGSTRate = await configService.getDefaultGSTRate(saleData.storeId || prescription.storeId);
            const enableGSTBilling = await configService.getEnableGSTBilling(saleData.storeId || prescription.storeId);
            const autoRounding = await configService.getAutoRounding(saleData.storeId || prescription.storeId);

            // 2. Build sale items from prescription version (clinical snapshot)
            const items = prescriptionVersion.items.map(item => {
                const quantity = saleData.itemQuantities?.[item.drugId] || item.quantityPrescribed;
                return {
                    drugId: item.drugId,
                    batchId: item.batchId || saleData.batches?.[item.drugId], // Use prescribed batch or POS selected batch
                    quantity: Number(quantity), // Ensure it's a number
                    mrp: saleData.itemPrices?.[item.drugId]?.mrp || 0, // Financial: editable
                    discount: saleData.itemPrices?.[item.drugId]?.discount || 0, // Financial: editable
                    gstRate: enableGSTBilling ? (item.drug?.gstRate || defaultGSTRate) : 0,
                    lineTotal: 0, // Will be calculated
                    originalQuantity: Number(item.quantityPrescribed) // Track distinct from sold quantity
                };
            });

            logger.info('createSaleFromDispense: Built sale items', { items: items.map(i => ({ d: i.drugId, q: i.quantity })) });

            // Calculate line totals
            let saleTotal = 0;
            let saleTaxTotal = 0;

            items.forEach(item => {
                const basePrice = item.mrp * item.quantity;
                const discountAmount = (item.discount / 100) * basePrice;
                const taxableAmount = basePrice - discountAmount;
                const gstAmount = (item.gstRate / 100) * taxableAmount;
                item.lineTotal = taxableAmount + gstAmount;

                saleTotal += item.lineTotal;
                saleTaxTotal += gstAmount;
            });

            // Apply auto-rounding if enabled
            let roundOff = 0;
            if (autoRounding) {
                const roundedTotal = Math.round(saleTotal);
                roundOff = roundedTotal - saleTotal;
                saleTotal = roundedTotal;
            }

            logger.info('createSaleFromDispense: Calculated totals', { saleTotal, saleTaxTotal, roundOff });

            // 3. Prepare sale data
            const { paymentSplits, ...saleInfo } = saleData;
            saleInfo.total = saleTotal;
            saleInfo.taxAmount = saleTaxTotal;
            saleInfo.subtotal = saleTotal - saleTaxTotal;
            saleInfo.roundOff = roundOff;

            // Generate invoice number
            const invoiceNumber = await saleRepository.generateInvoiceNumber(saleInfo.storeId);
            logger.info('createSaleFromDispense: Generated invoice number', { invoiceNumber });

            // Link to dispense (not prescription directly)
            const saleDataWithDispense = {
                ...saleInfo,
                invoiceNumber,
                dispenseId: dispense.id, // NEW: Link to dispense
                prescriptionId: prescription.id, // Legacy: Keep for backward compatibility
                patientId: prescription.patientId,
                soldBy: userId, // Add soldBy field
                status: 'COMPLETED'
            };

            // 4. Create sale using existing repository method
            logger.info('createSaleFromDispense: Creating sale in database');
            const result = await saleRepository.createSale(
                saleDataWithDispense,
                items,
                paymentSplits
            );
            logger.info('createSaleFromDispense: Sale created in database', { saleId: result.sale.id });

            // 5. Complete dispense workflow (this will update refill and prescription status)
            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
            logger.info('createSaleFromDispense: Completing dispense');
            await dispenseService.completeDispense(dispenseId, userId, totalQuantity);
            logger.info('createSaleFromDispense: Dispense completed (refill and prescription status auto-updated)');

            logger.info(`Sale created from dispense: ${invoiceNumber} - Dispense: ${dispenseId}`);

            // 6. Track loyalty event (async, don't block sale completion)
            if (prescription.patientId) {
                try {
                    await loyaltyService.processPurchase(
                        result.sale.id,
                        prescription.patientId,
                        saleInfo.storeId,
                        parseFloat(result.sale.total),
                        items.length
                    );
                    logger.info(`Loyalty event tracked for patient: ${prescription.patientId}`);
                } catch (loyaltyError) {
                    // Log error but don't fail the sale
                    logger.error('Failed to track loyalty event:', loyaltyError);
                }
            }

            // 7. Create audit log for Sale/Dispense (showing deviations)
            try {
                const deviations = items.filter(i =>
                    i.quantity !== i.originalQuantity ||
                    i.discount > 0 ||
                    i.mrp !== (saleData.itemPrices?.[i.drugId]?.originalMrp || i.mrp)
                ).map(i => ({
                    drugId: i.drugId,
                    quantityChanged: i.quantity !== i.originalQuantity,
                    originalQty: i.originalQuantity,
                    soldQty: i.quantity,
                    discount: i.discount,
                    price: i.mrp
                }));

                await prisma.auditLog.create({
                    data: {
                        storeId: saleInfo.storeId,
                        userId,
                        action: 'PRESCRIPTION_DISPENSED',
                        entityType: 'Prescription',
                        entityId: prescription.id,
                        metadata: {
                            invoiceNumber,
                            saleId: result.sale.id,
                            totalAmount: result.sale.total,
                            deviations: deviations.length > 0 ? deviations : null,
                            itemCount: items.length
                        },
                        changes: {
                            dispensedItems: items.map(i => ({
                                drugId: i.drugId,
                                quantity: i.quantity,
                                price: i.mrp,
                                discount: i.discount
                            }))
                        }
                    }
                });
            } catch (auditError) {
                logger.error('Failed to create dispense audit log:', auditError);
            }

            return {
                ...result.sale,
                items: result.items,
                paymentSplits: result.payments,
            };
        } catch (error) {
            logger.error('createSaleFromDispense: Error creating sale', {
                error: error.message,
                stack: error.stack,
                dispenseId,
                userId
            });
            throw error;
        }
    }

    /**
     * Create Quick Sale (Walk-in without prescription)
     * Auto-creates minimal ONE_TIME prescription in background
     */
    async createQuickSale(saleData, userId) {
        try {
            const { items, paymentSplits, patientId, ...saleInfo } = saleData;

            logger.info('createQuickSale: Starting quick sale creation', { storeId: saleInfo.storeId, userId, itemCount: items.length });

            // Ensure we have a patient (create walk-in if not provided)
            let actualPatientId = patientId;
            if (!actualPatientId) {
                logger.info('createQuickSale: Creating walk-in patient');
                // Create a walk-in patient
                const walkInPatient = await prisma.patient.create({
                    data: {
                        storeId: saleInfo.storeId,
                        firstName: 'Walk-in',
                        lastName: 'Customer',
                        phoneNumber: `WALKIN-${Date.now()}`
                    }
                });
                actualPatientId = walkInPatient.id;
                logger.info('createQuickSale: Walk-in patient created', { patientId: actualPatientId });
            }

            // 1. Create minimal ONE_TIME prescription in background
            logger.info('createQuickSale: Creating ONE_TIME prescription');
            const prescriptionData = {
                storeId: saleInfo.storeId,
                patientId: actualPatientId,
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
            logger.info('createQuickSale: Prescription created', { prescriptionId: prescription.id });

            // 2. Auto-activate prescription
            logger.info('createQuickSale: Activating prescription');
            await prescriptionService.activatePrescription(prescription.id, userId);
            logger.info('createQuickSale: Prescription activated');

            // 3. Get refill and create dispense
            logger.info('createQuickSale: Getting refill and version');
            const refill = await refillService.getNextAvailableRefill(prescription.id);
            const version = await versionService.getLatestVersion(prescription.id);
            logger.info('createQuickSale: Got refill and version', { refillId: refill.id, versionId: version.id });

            logger.info('createQuickSale: Creating dispense');
            const dispense = await dispenseService.createDispense(
                refill.id,
                version.id,
                userId
            );
            logger.info('createQuickSale: Dispense created', { dispenseId: dispense.id });

            // 4. Auto-progress dispense to READY (skip workflow for quick sales)
            logger.info('createQuickSale: Marking dispense as READY');
            await dispenseService.updateStatus(dispense.id, 'READY', userId, 'Quick Sale - Auto-progressed');
            logger.info('createQuickSale: Dispense marked as READY');

            // 5. Create sale from dispense
            logger.info('createQuickSale: Creating sale from dispense');
            const sale = await this.createSaleFromDispense(
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
            logger.info('createQuickSale: Sale created successfully', { saleId: sale.id, invoiceNumber: sale.invoiceNumber });

            return sale;
        } catch (error) {
            logger.error('createQuickSale: Error in quick sale creation', {
                error: error.message,
                stack: error.stack,
                storeId: saleData.storeId,
                userId
            });
            throw error;
        }
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
                        `Insufficient stock for ${batch.drug.name}.Available: ${batch.quantityInStock}, Required: ${item.quantity} `
                    );
                }

                // Attach drug details to item for GST computation
                item.drug = batch.drug;
            }

            // Validate payment total matches sale total
            const paymentTotal = paymentSplits.reduce((sum, p) => sum + p.amount, 0);
            if (Math.abs(paymentTotal - saleInfo.total) > 0.01) {
                throw ApiError.badRequest('Payment total does not match sale total');
            }
        }

        // Fetch store details for place of supply
        const store = await prisma.store.findUnique({
            where: { id: saleInfo.storeId },
            select: { state: true }
        });

        // Compute GST for items
        const gstResult = await this.computeGSTForItems(
            items,
            store.state,
            saleData.buyerGstin,
            saleData.customerState
        );

        // Enrich sale data with GST totals and rounding
        const enrichedSaleData = await this.enrichSaleDataWithGST(
            saleInfo,
            gstResult.saleTotals,
            saleData.buyerGstin
        );

        // Create sale with transaction
        const result = await saleRepository.createSale(
            { ...enrichedSaleData, invoiceNumber },
            gstResult.items,
            paymentSplits
        );

        logger.info(`Sale created(legacy): ${invoiceNumber} - Total: ${saleInfo.total} - GST: ${gstResult.saleTotals.totalTax}`);

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

    /**
     * Compute GST for sale items
     * @private
     */
    async computeGSTForItems(items, storeState, customerGstin = null, customerState = null) {
        const storeId = items[0]?.storeId || items[0]?.drug?.storeId;
        const enableGSTBilling = storeId ? await configService.getEnableGSTBilling(storeId) : true;

        // Determine place of supply and whether to apply IGST
        const placeOfSupply = gstCalculator.determinePlaceOfSupply(
            { gstin: customerGstin, state: customerState },
            storeState
        );
        const isIgst = placeOfSupply !== storeState;

        // Compute GST for each item
        const itemsWithGST = [];

        for (const item of items) {
            // Get tax slab for this item
            let taxSlab;

            // Try to get from drug's linked HSN code first
            if (item.drug?.hsnCodeId) {
                const hsnCode = await gstRepository.findHsnCodeById(item.drug.hsnCodeId);
                if (hsnCode) {
                    taxSlab = hsnCode.taxSlab;
                }
            }

            // Fallback: construct tax slab from drug's gstRate
            if (!taxSlab) {
                const defaultGSTRate = await configService.getDefaultGSTRate(items[0].storeId || storeState);
                // If GST billing is disabled, rate is 0
                const rate = enableGSTBilling ? (item.gstRate || item.drug?.gstRate || defaultGSTRate) : 0;

                taxSlab = {
                    rate,
                    taxType: enableGSTBilling ? 'GST' : 'EXEMPT',
                    cgstRate: rate / 2,
                    sgstRate: rate / 2,
                    igstRate: rate,
                    cessRate: 0
                };
            } else if (!enableGSTBilling) {
                // Force exempt if GST billing is disabled
                taxSlab = { ...taxSlab, rate: 0, taxType: 'EXEMPT', cgstRate: 0, sgstRate: 0, igstRate: 0, cessRate: 0 };
            }

            // Compute tax breakup using calculator
            const taxBreakup = gstCalculator.computeItemTax(
                {
                    quantity: item.quantity,
                    mrp: item.mrp,
                    discount: item.discount || 0
                },
                taxSlab,
                isIgst
            );

            itemsWithGST.push({
                ...item,
                hsnCode: item.drug?.hsnCode || null,
                taxSlabId: taxSlab.id || null,
                taxableAmount: taxBreakup.taxableAmount,
                cgstAmount: taxBreakup.cgstAmount,
                sgstAmount: taxBreakup.sgstAmount,
                igstAmount: taxBreakup.igstAmount,
                cessAmount: taxBreakup.cessAmount,
                lineTotal: taxBreakup.lineTotal
            });
        }

        // Compute sale-level totals
        const saleTaxTotals = gstCalculator.computeSaleTax(itemsWithGST);

        return {
            items: itemsWithGST,
            saleTotals: {
                taxableAmount: saleTaxTotals.taxableAmount,
                cgstAmount: saleTaxTotals.cgstAmount,
                sgstAmount: saleTaxTotals.sgstAmount,
                igstAmount: saleTaxTotals.igstAmount,
                cessAmount: saleTaxTotals.cessAmount,
                totalTax: saleTaxTotals.totalTax,
                isIgst,
                placeOfSupply,
                gstrCategory: null // Will be set later
            }
        };
    }

    /**
     * Enrich sale data with GST fields and handle rounding
     * @private
     */
    async enrichSaleDataWithGST(saleData, gstTotals, customerGstin = null) {
        let total = saleData.total;
        let roundOff = 0;

        // Apply auto-rounding if enabled
        const autoRounding = await configService.getAutoRounding(saleData.storeId);
        if (autoRounding) {
            const roundedTotal = Math.round(total);
            roundOff = roundedTotal - total;
            total = roundedTotal;
        }

        return {
            ...saleData,
            total: total,
            roundOff: roundOff,
            buyerGstin: customerGstin,
            placeOfSupply: gstTotals.placeOfSupply,
            isIgst: gstTotals.isIgst,
            cgstAmount: gstTotals.cgstAmount,
            sgstAmount: gstTotals.sgstAmount,
            igstAmount: gstTotals.igstAmount,
            cessAmount: gstTotals.cessAmount,
            taxableAmount: gstTotals.taxableAmount,
            taxAmount: gstTotals.totalTax,
            gstrCategory: gstCalculator.classifyGSTRCategory({
                buyerGstin: customerGstin,
                total: total,
                isExport: false
            })
        };
    }
}

module.exports = new SaleService();

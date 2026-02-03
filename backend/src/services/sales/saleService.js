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
const configService = require('../configService');
const gstCalculator = require('../../utils/gstCalculator'); // CRITICAL FIX: Add missing import
const gstRepository = require('../../repositories/gstRepository'); // CRITICAL FIX: For HSN code lookups

// Extracted services
const gstCalculationService = require('./gstCalculationService');
const saleAnalyticsService = require('./saleAnalyticsService');

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
                loyaltyService.processPurchase(
                    result.sale.id,
                    prescription.patientId,
                    saleInfo.storeId,
                    parseFloat(result.sale.total),
                    items.length
                ).catch(loyaltyError => {
                    // Log error but don't fail the sale
                    logger.error('Failed to track loyalty event:', loyaltyError);
                });
                logger.info(`Loyalty event tracking initiated for patient: ${prescription.patientId}`);
            }

            // 7. Calculate & Record Margin (Async)
            // Added by Margin System Implementation
            try {
                const marginService = require('../../services/margin/marginService');
                marginService.calculateAndRecordSaleMargin(result.sale.id, saleInfo.storeId)
                    .catch(err => logger.error(`[Margin] Failed to record margin for dispense sale ${result.sale.id}`, err));
            } catch (e) {
                logger.error('[Margin] Failed to init margin calc', e);
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
     * PRODUCTION-GRADE: Fast + Scalable + Auditable
     */
    async createQuickSale(saleData, userId) {
        try {
            const { items, paymentSplits, patientId, ...saleInfo } = saleData;

            logger.info('createQuickSale: Starting quick sale creation', { storeId: saleInfo.storeId, userId, itemCount: items.length });

            // 1. Get or create patient (outside transaction - can be cached)
            let actualPatientId = patientId;
            if (!actualPatientId) {
                // Find or create a single walk-in patient per store (reuse existing)
                let walkInPatient = await prisma.patient.findFirst({
                    where: {
                        storeId: saleInfo.storeId,
                        phoneNumber: 'WALKIN-CUSTOMER',
                        deletedAt: null
                    }
                });

                if (!walkInPatient) {
                    walkInPatient = await prisma.patient.create({
                        data: {
                            storeId: saleInfo.storeId,
                            firstName: 'Walk-in',
                            lastName: 'Customer',
                            phoneNumber: 'WALKIN-CUSTOMER'
                        }
                    });
                    logger.info('Created new walk-in patient', { patientId: walkInPatient.id, storeId: saleInfo.storeId });
                } else {
                    logger.info('Reusing existing walk-in patient', { patientId: walkInPatient.id, storeId: saleInfo.storeId });
                }

                actualPatientId = walkInPatient.id;
            }

            // 2. Validate Stock & Prepare Items
            const preparedItems = [];
            for (const item of items) {
                const batch = await inventoryService.getBatchById(item.batchId);

                if (!batch) {
                    throw ApiError.badRequest(`Batch not found: ${item.batchId}`);
                }

                if (batch.baseUnitQuantity < item.quantity) {
                    throw ApiError.badRequest(
                        `Insufficient stock for ${batch.drug.name}. Available: ${batch.baseUnitQuantity}, Required: ${item.quantity}`
                    );
                }
                preparedItems.push({
                    ...item,
                    drug: batch.drug, // Needed for GST calc
                });
            }

            // 3. Get Store State (for GST)
            const store = await prisma.store.findUnique({
                where: { id: saleInfo.storeId },
                select: { state: true }
            });

            if (!store) {
                throw ApiError.notFound('Store not found');
            }

            // 4. Compute GST
            const gstResult = await this.computeGSTForItems(
                preparedItems,
                store.state,
                saleData.buyerGstin,
                saleData.customerState
            );

            // 5. Enrich Sale Data
            const enrichedSaleData = await this.enrichSaleDataWithGST(
                {
                    ...saleInfo,
                    patientId: actualPatientId,
                    soldBy: userId,
                    status: 'COMPLETED'
                },
                gstResult.saleTotals,
                saleData.buyerGstin
            );

            // 6. Generate Invoice Number
            const invoiceNumber = await saleRepository.generateInvoiceNumber(saleInfo.storeId);
            enrichedSaleData.invoiceNumber = invoiceNumber;

            // 7. Create Sale
            const result = await saleRepository.createSale(
                enrichedSaleData,
                gstResult.items,
                paymentSplits
            );

            logger.info('createQuickSale: Sale created successfully', { saleId: result.sale.id, invoiceNumber });

            // 8. Update prescription status if linked
            if (saleData.prescriptionId) {
                try {
                    const prescriptionService = require('../prescriptions/prescriptionService');
                    await prescriptionService.updatePrescriptionStatus(saleData.prescriptionId, userId);
                    logger.info(`Prescription ${saleData.prescriptionId} status updated after sale`);
                } catch (error) {
                    logger.error('Failed to update prescription status after sale:', error);
                }
            }

            // 9. Track loyalty event (async)
            if (actualPatientId) {
                loyaltyService.processPurchase(
                    result.sale.id,
                    actualPatientId,
                    saleInfo.storeId,
                    parseFloat(result.sale.total),
                    items.length
                ).catch(loyaltyError => {
                    logger.error('Failed to track loyalty event:', loyaltyError);
                });
            }

            // 9. Calculate & Record Margin (Async - Fire & Forget)
            // Added by Margin System Implementation
            const marginService = require('../../services/margin/marginService');
            marginService.calculateAndRecordSaleMargin(result.sale.id, saleInfo.storeId)
                .catch(err => logger.error(`[Margin] Failed to record margin for sale ${result.sale.id}`, err));

            return {
                ...result.sale,
                items: result.items,
                paymentSplits: result.payments,
            };
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
     * @deprecated LEGACY METHOD - Use createQuickSale() or createSaleFromDispense() instead
     * 
     * This method bypasses the prescription workflow and should only be used for:
     * - Backward compatibility with old frontend code
     * - Emergency situations where prescription workflow is unavailable
     * 
     * RECOMMENDED ALTERNATIVES:
     * - For walk-in customers: createQuickSale()
     * - For prescription-based sales: createSaleFromDispense()
     * 
     * MIGRATION GUIDE:
     * Old: await saleService.createSale({ items, paymentSplits, ... })
     * New: await saleService.createQuickSale({ items, paymentSplits, ... }, userId)
     */
    async createSale(saleData) {
        logger.warn('⚠️  DEPRECATED: createSale() called. Please migrate to createQuickSale() or createSaleFromDispense()');

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

                if (batch.baseUnitQuantity < item.quantity) {
                    throw ApiError.badRequest(
                        `Insufficient stock for ${batch.drug.name}.Available: ${batch.baseUnitQuantity}, Required: ${item.quantity} `
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

        // Update prescription status if this sale is linked to a prescription
        if (saleInfo.prescriptionId) {
            try {
                const prescriptionService = require('../prescriptions/prescriptionService');
                const prescription = await prisma.prescription.findUnique({
                    where: { id: saleInfo.prescriptionId },
                    select: { type: true, status: true }
                });

                if (prescription) {
                    // For ONE_TIME prescriptions, mark as COMPLETED after sale
                    if (prescription.type === 'ONE_TIME' && prescription.status !== 'COMPLETED') {
                        await prisma.prescription.update({
                            where: { id: saleInfo.prescriptionId },
                            data: { status: 'COMPLETED' }
                        });
                        logger.info(`Prescription ${saleInfo.prescriptionId} marked as COMPLETED (ONE_TIME, legacy sale)`);
                    }
                    // For REGULAR prescriptions, update status based on refills
                    else if (prescription.type === 'REGULAR') {
                        await prescriptionService.updatePrescriptionStatus(saleInfo.prescriptionId, null);
                        logger.info(`Prescription ${saleInfo.prescriptionId} status updated (REGULAR, legacy sale)`);
                    }
                }
            } catch (error) {
                logger.error('Failed to update prescription status after legacy sale:', error);
                // Don't fail the sale if prescription update fails
            }
        }

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

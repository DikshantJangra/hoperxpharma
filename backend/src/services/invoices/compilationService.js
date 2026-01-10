const prisma = require('../../db/prisma');
const logger = require('../../config/logger');

/**
 * Supplier Invoice Compilation Service
 * Handles creation and management of consolidated supplier invoices
 */

/**
 * Fetch all uninvoiced GRN items for a supplier within a period
 * @param {Object} params
 * @param {string} params.supplierId
 * @param {string} params.storeId
 * @param {Date} params.periodStart
 * @param {Date} params.periodEnd
 * @returns {Promise<Array>} Eligible GRN items
 */
async function getEligibleItems({ supplierId, storeId, periodStart, periodEnd }) {
    try {
        console.log('Fetching GRNs for:', { supplierId, storeId, periodStart, periodEnd });

        // Fetch completed GRNs for the supplier within period
        const grns = await prisma.goodsReceivedNote.findMany({
            where: {
                supplierId,
                storeId,
                status: 'COMPLETED',
                completedAt: {
                    gte: periodStart,
                    lte: periodEnd
                }
            },
            include: {
                items: {
                    include: {
                        drug: true,
                        invoiceItems: true // Check if already invoiced
                    }
                },
                po: {
                    select: {
                        poNumber: true
                    }
                }
            }
        });

        console.log(`Found ${grns.length} GRNs`);

        // Flatten to individual items and filter uninvoiced ones
        const eligibleItems = [];

        for (const grn of grns) {
            for (const item of grn.items) {
                // Skip if already invoiced
                if (item.invoiceItems && item.invoiceItems.length > 0) {
                    continue;
                }

                // Skip split parent items (they don't have actual stock)
                if (item.isSplit && item.children && item.children.length > 0) {
                    continue;
                }

                eligibleItems.push({
                    grnItemId: item.id,
                    grnId: grn.id,
                    grnNumber: grn.grnNumber,
                    poNumber: grn.po?.poNumber || 'N/A',
                    receivedDate: grn.completedAt,

                    drugId: item.drugId,
                    drugName: item.drug.name,
                    batchNumber: item.batchNumber,
                    expiryDate: item.expiryDate,

                    receivedQty: item.receivedQty,
                    freeQty: item.freeQty || 0,

                    unitPrice: item.unitPrice,
                    discountPercent: item.discountPercent || 0,
                    gstPercent: item.gstPercent,

                    // Calculate line total
                    subtotal: item.lineTotal,
                    calculatedTotal: item.lineTotal
                });
            }
        }

        return eligibleItems;
    } catch (error) {
        logger.error('Error fetching eligible items for invoice compilation:', error);
        throw error;
    }
}

/**
 * Create a draft supplier invoice from selected items
 * @param {Object} params
 * @param {string} params.supplierId
 * @param {string} params.storeId
 * @param {Date} params.periodStart
 * @param {Date} params.periodEnd
 * @param {Array<string>} params.selectedGrnItemIds
 * @param {string} params.userId
 * @returns {Promise<Object>} Created draft invoice
 */
async function createDraftInvoice({ supplierId, storeId, periodStart, periodEnd, selectedGrnItemIds, userId }) {
    try {
        // Fetch the selected GRN items with full details
        const grnItems = await prisma.gRNItem.findMany({
            where: {
                id: { in: selectedGrnItemIds }
            },
            include: {
                drug: true,
                grn: {
                    include: {
                        po: {
                            select: { poNumber: true }
                        }
                    }
                },
                invoiceItems: true
            }
        });

        // Validate: ensure items aren't already invoiced
        const alreadyInvoiced = grnItems.filter(item => item.invoiceItems && item.invoiceItems.length > 0);
        if (alreadyInvoiced.length > 0) {
            throw new Error(`Some items are already invoiced: ${alreadyInvoiced.map(i => i.id).join(', ')}`);
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        const invoiceItems = grnItems.map(item => {
            const itemSubtotal = parseFloat(item.lineTotal);
            const itemTax = parseFloat(item.lineTotal) * (parseFloat(item.gstPercent) / 100);

            subtotal += itemSubtotal;
            taxAmount += itemTax;

            return {
                grnItemId: item.id,
                drugId: item.drugId,
                drugName: item.drug.name,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,

                receivedQty: item.receivedQty,
                freeQty: item.freeQty,
                billedQty: item.receivedQty, // Default to received qty

                unit: item.drug.unit || 'UNIT',
                unitPrice: item.unitPrice,
                gstPercent: item.gstPercent,
                discountPercent: item.discountPercent,
                subtotal: itemSubtotal,
                taxAmount: itemTax,
                lineTotal: itemSubtotal + itemTax,

                poNumber: item.grn.po.poNumber,
                grnNumber: item.grn.grnNumber,
                receivedDate: item.grn.completedAt,

                isExcluded: false,
                isDisputed: false
            };
        });

        const total = subtotal + taxAmount;

        // Generate invoice number (DRAFT prefix)
        const draftNumber = `DRAFT-${Date.now()}`;

        // Create draft invoice
        const invoice = await prisma.consolidatedInvoice.create({
            data: {
                invoiceNumber: draftNumber,
                storeId,
                supplierId,
                periodStart,
                periodEnd,
                subtotal,
                taxAmount,
                total,
                status: 'DRAFT',
                paymentStatus: 'UNPAID',
                createdBy: userId,

                items: {
                    create: invoiceItems
                },

                // Link GRNs
                grns: {
                    create: [...new Set(grnItems.map(i => i.grnId))].map(grnId => ({
                        grnId
                    }))
                }
            },
            include: {
                items: true,
                grns: true,
                supplier: true
            }
        });

        logger.info(`Created draft supplier invoice: ${invoice.invoiceNumber}`);
        return invoice;
    } catch (error) {
        logger.error('Error creating draft invoice:', error);
        throw error;
    }
}

/**
 * Confirm a draft invoice (locks it and generates final invoice number)
 * @param {Object} params
 * @param {string} params.invoiceId
 * @param {string} params.userId
 * @returns {Promise<Object>} Confirmed invoice
 */
async function confirmInvoice({ invoiceId, userId }) {
    try {
        const invoice = await prisma.consolidatedInvoice.findUnique({
            where: { id: invoiceId },
            include: { items: true }
        });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (invoice.status !== 'DRAFT') {
            throw new Error('Only draft invoices can be confirmed');
        }

        // Generate final invoice number
        const count = await prisma.consolidatedInvoice.count({
            where: {
                storeId: invoice.storeId,
                status: { not: 'DRAFT' }
            }
        });

        const invoiceNumber = `SI-${String(count + 1).padStart(4, '0')}`;

        // Update invoice
        const confirmed = await prisma.consolidatedInvoice.update({
            where: { id: invoiceId },
            data: {
                invoiceNumber,
                status: 'CONFIRMED',
                confirmedAt: new Date(),
                confirmedBy: userId
            },
            include: {
                items: true,
                grns: true,
                supplier: true
            }
        });

        logger.info(`Confirmed supplier invoice: ${confirmed.invoiceNumber}`);
        return confirmed;
    } catch (error) {
        logger.error('Error confirming invoice:', error);
        throw error;
    }
}

/**
 * Record a payment against an invoice
 * @param {Object} params
 * @param {string} params.invoiceId
 * @param {number} params.amount
 * @param {Date} params.paymentDate
 * @param {string} params.paymentMethod
 * @param {string} params.referenceNumber
 * @param {string} params.notes
 * @param {string} params.userId
 * @returns {Promise<Object>} Updated invoice with payment
 */
async function recordPayment({ invoiceId, amount, paymentDate, paymentMethod, referenceNumber, notes, userId }) {
    try {
        const invoice = await prisma.consolidatedInvoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true }
        });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (invoice.status === 'DRAFT') {
            throw new Error('Cannot record payment on draft invoice');
        }

        // Calculate new paid amount
        const currentPaid = parseFloat(invoice.paidAmount);
        const paymentAmount = parseFloat(amount);
        const newPaidAmount = currentPaid + paymentAmount;
        const totalAmount = parseFloat(invoice.total);

        if (newPaidAmount > totalAmount) {
            throw new Error('Payment amount exceeds invoice total');
        }

        // Determine new payment status
        let newPaymentStatus;
        if (newPaidAmount >= totalAmount) {
            newPaymentStatus = 'PAID';
        } else if (newPaidAmount > 0) {
            newPaymentStatus = 'PARTIALLY_PAID';
        } else {
            newPaymentStatus = 'UNPAID';
        }

        // Create payment record and update invoice
        const result = await prisma.$transaction(async (tx) => {
            // Create payment
            await tx.supplierInvoicePayment.create({
                data: {
                    consolidatedInvoiceId: invoiceId,
                    amount: paymentAmount,
                    paymentDate,
                    paymentMethod,
                    referenceNumber,
                    notes,
                    createdBy: userId
                }
            });

            // Update invoice
            const updated = await tx.consolidatedInvoice.update({
                where: { id: invoiceId },
                data: {
                    paidAmount: newPaidAmount,
                    paymentStatus: newPaymentStatus,
                    paymentDate: newPaymentStatus === 'PAID' ? paymentDate : invoice.paymentDate,
                    status: newPaymentStatus === 'PAID' ? 'PAID' : invoice.status
                },
                include: {
                    payments: true,
                    supplier: true
                }
            });

            return updated;
        });

        logger.info(`Recorded payment of ${amount} for invoice: ${invoice.invoiceNumber}`);
        return result;
    } catch (error) {
        logger.error('Error recording payment:', error);
        throw error;
    }
}

module.exports = {
    getEligibleItems,
    createDraftInvoice,
    confirmInvoice,
    recordPayment
};

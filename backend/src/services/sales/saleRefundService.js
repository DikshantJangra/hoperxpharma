
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const prisma = require('../../db/prisma');
const returnEligibilityService = require('./returnEligibilityService');
const creditNoteService = require('./creditNoteService');

/**
 * Sale Refund Service - Handles refund workflow for sales
 */
class SaleRefundService {
    /**
     * Initiate a refund request
     */
    async initiateRefund(saleId, refundData) {
        const { items, refundType, requestedBy, storeId, refundAmount: frontendRefundAmount } = refundData;

        // Verify sale exists
        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: {
                items: {
                    include: {
                        drug: true,
                        batch: true,
                    },
                },
            },
        });

        if (!sale) {
            throw ApiError.notFound('Sale not found');
        }

        // Use frontend refund amount if provided, otherwise calculate
        let refundAmount = frontendRefundAmount || 0;

        // Prepare refund items data
        const refundItemsData = await Promise.all(items.map(async (item) => {
            // 1. Check Eligibility
            const eligibility = await returnEligibilityService.checkEligibility(item.saleItemId, item.intent, item.quantity);
            if (!eligibility.isEligible) {
                throw ApiError.badRequest(`Item ineligible for return: ${eligibility.reasons.join(', ')}`);
            }

            const saleItem = sale.items.find(si => si.id === item.saleItemId);
            if (!saleItem) {
                throw ApiError.badRequest(`Sale item ${item.saleItemId} not found`);
            }

            // Validate quantity
            if (item.quantity > saleItem.quantity) {
                throw ApiError.badRequest(
                    `Cannot refund ${item.quantity} units of ${saleItem.drug.name}. Only ${saleItem.quantity} were sold.`
                );
            }

            // 2. Calculate Refund Amount for this item
            // Safety Check: Refund should never exceed MRP (Maximum Retail Price)
            // Legacy sales might have lineTotal > mrp * quantity due to tax-exclusive bug
            const calculatedUnitPrice = Number(saleItem.lineTotal) / saleItem.quantity;
            const unitPrice = Math.min(calculatedUnitPrice, Number(saleItem.mrp));
            const itemRefundAmount = unitPrice * item.quantity;

            // Only accumulate if frontend didn't provide total
            if (!frontendRefundAmount) {
                refundAmount += itemRefundAmount;
            }

            // Calculate resellability based on intent and condition
            const isResellable = item.intent === 'UNOPENED_UNUSED' && item.condition === 'Sealed';

            return {
                saleItemId: item.saleItemId,
                drugId: saleItem.drugId,
                batchId: saleItem.batchId,
                quantity: item.quantity,
                refundAmount: itemRefundAmount,
                isResellable: isResellable,
                reason: `${item.reason || 'Customer Return'} [${item.intent}${item.condition ? ', ' + item.condition : ''}]`
            };
        }));

        // Generate refund number
        const refundNumber = await this.generateRefundNumber(storeId);

        // Create refund and auto-approve to update inventory
        const refund = await prisma.saleRefund.create({
            data: {
                refundNumber,
                originalSaleId: saleId,
                storeId,
                refundAmount,
                refundReason: items.map(i => `${i.reason || 'Customer Return'} (${i.intent})`).join('; ') || 'Customer Return',
                status: 'APPROVED',
                requestedBy,
                approvedBy: requestedBy,
                approvedAt: new Date(),
                completedAt: new Date(),
                items: {
                    create: refundItemsData
                }
            },
            include: {
                items: true,
            }
        });

        // Process inventory impact immediately
        await this.processInventoryImpact(refundItemsData.map((item, idx) => ({
            ...item,
            refundId: refund.id,
            batchId: refundItemsData[idx].batchId
        })), storeId);

        // Update original sale status
        const allRefunds = await prisma.saleRefund.findMany({
            where: { originalSaleId: saleId, status: 'APPROVED' },
            include: { items: true }
        });

        // Calculate total returned quantity for each item
        const returnedQuantities = {};
        allRefunds.forEach(r => {
            r.items.forEach(ri => {
                returnedQuantities[ri.saleItemId] = (returnedQuantities[ri.saleItemId] || 0) + ri.quantity;
            });
        });

        const isFullyRefunded = sale.items.every(si =>
            returnedQuantities[si.id] >= si.quantity
        );

        await prisma.sale.update({
            where: { id: saleId },
            data: {
                status: isFullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
            }
        });

        // Handle credit note if needed
        if (refundType === 'STORE_CREDIT') {
            await creditNoteService.issueCreditNote({
                storeId,
                amount: Number(refundAmount),
                issuedToId: sale.patientId || undefined,
                issuedById: requestedBy,
                refundId: refund.id,
                notes: `Refund for Sale #${sale.invoiceNumber}`
            });
            logger.info(`Credit note issued for refund ${refundNumber}, patient: ${sale.patientId}`);
        }

        // Create audit log for refund
        await prisma.auditLog.create({
            data: {
                storeId,
                userId: requestedBy,
                action: 'REFUND_PROCESSED',
                entityType: 'Sale',
                entityId: saleId,
                metadata: {
                    refundId: refund.id,
                    refundNumber,
                    refundAmount,
                    itemCount: items.length,
                    refundType
                },
                changes: {
                    items: items.map(i => ({
                        saleItemId: i.saleItemId,
                        quantity: i.quantity,
                        intent: i.intent
                    }))
                }
            }
        });

        logger.info(`Refund initiated and approved: ${refundNumber} for sale ${sale.invoiceNumber}`);
        return refund;
    }

    /**
     * Approve refund
     */
    async approveRefund(refundId, approverId) {
        const refund = await prisma.saleRefund.findUnique({
            where: { id: refundId },
            include: { items: true, originalSale: true }
        });

        if (!refund) {
            throw ApiError.notFound('Refund not found');
        }

        if (refund.status !== 'PENDING') {
            throw ApiError.badRequest(`Refund is already ${refund.status.toLowerCase()}`);
        }

        // 1. Process Inventory Impact (The Bucket Strategy)
        await this.processInventoryImpact(refund.items, refund.storeId);

        // 2. Financial Handling: Credit Note vs Cash
        if (refund.refundType === 'STORE_CREDIT') {
            await creditNoteService.issueCreditNote({
                storeId: refund.storeId,
                amount: Number(refund.refundAmount),
                issuedToId: refund.originalSale.patientId || undefined,
                issuedById: approverId,
                refundId: refund.id, // Link to this refund
                notes: `Refund for Sale #${refund.originalSale.invoiceNumber}`
            });
        }

        // 3. Update original sale status
        const allRefunds = await prisma.saleRefund.findMany({
            where: { originalSaleId: refund.originalSaleId, status: 'APPROVED' },
            include: { items: true }
        });

        const saleItems = await prisma.saleItem.findMany({
            where: { saleId: refund.originalSaleId }
        });

        const returnedQuantities = {};
        allRefunds.forEach(r => {
            r.items.forEach(ri => {
                returnedQuantities[ri.saleItemId] = (returnedQuantities[ri.saleItemId] || 0) + ri.quantity;
            });
        });

        const isFullyRefunded = saleItems.every(si =>
            returnedQuantities[si.id] >= si.quantity
        );

        await prisma.sale.update({
            where: { id: refund.originalSaleId },
            data: {
                status: isFullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
            }
        });

        const updatedRefund = await prisma.saleRefund.update({
            where: { id: refundId },
            data: {
                status: 'APPROVED',
                approvedBy: approverId,
                approvedAt: new Date(),
                completedAt: new Date() // Immediate completion
            },
        });

        logger.info(`Refund approved: ${refund.refundNumber} by ${approverId}`);
        return updatedRefund;
    }

    /**
     * Reject refund
     */
    async rejectRefund(refundId, reason) {
        const refund = await prisma.saleRefund.findUnique({
            where: { id: refundId },
        });

        if (!refund) {
            throw ApiError.notFound('Refund not found');
        }

        if (refund.status !== 'PENDING') {
            throw ApiError.badRequest(`Refund is already ${refund.status.toLowerCase()}`);
        }

        const updatedRefund = await prisma.saleRefund.update({
            where: { id: refundId },
            data: {
                status: 'REJECTED',
                refundReason: `${refund.refundReason || ''}\n\nRejection Reason: ${reason}`,
            },
        });

        logger.info(`Refund rejected: ${refund.refundNumber}`);
        return updatedRefund;
    }

    /**
     * Process inventory impact
     */
    async processInventoryImpact(items, storeId) {
        for (const item of items) {
            if (item.isResellable) {
                // Add back to main stock
                await prisma.inventoryBatch.update({
                    where: { id: item.batchId },
                    data: {
                        baseUnitQuantity: { increment: item.quantity }
                    }
                });
                // Log movement
                await prisma.stockMovement.create({
                    data: {
                        batchId: item.batchId,
                        movementType: 'IN',
                        quantity: item.quantity,
                        reason: 'Refund (Restock)',
                        referenceType: 'refund',
                        referenceId: item.refundId
                    }
                });
            } else {
                // Log quarantined items (not added back to stock)
                await prisma.stockMovement.create({
                    data: {
                        batchId: item.batchId,
                        movementType: 'OUT',
                        quantity: item.quantity,
                        reason: 'Refund (Quarantine - Not Resellable)',
                        referenceType: 'refund',
                        referenceId: item.refundId
                    }
                });
                logger.info(`Item quarantined (not restocked): Batch ${item.batchId}, Qty: ${item.quantity}`);
            }
        }
    }

    /**
     * Get refunds with filters
     */
    async getRefunds(storeId, filters = {}) {
        const { page = 1, limit = 20, status } = filters;
        const skip = (page - 1) * limit;

        const where = {
            storeId,
            ...(status && { status }),
        };

        const [refunds, total] = await Promise.all([
            prisma.saleRefund.findMany({
                where,
                skip,
                take: limit,
                include: {
                    items: true,
                    originalSale: {
                        select: {
                            invoiceNumber: true,
                            total: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.saleRefund.count({ where }),
        ]);

        return { refunds, total };
    }

    /**
     * Get refund by ID
     */
    async getRefundById(refundId) {
        const refund = await prisma.saleRefund.findUnique({
            where: { id: refundId },
            include: {
                items: true,
                originalSale: {
                    include: {
                        items: {
                            include: {
                                drug: true,
                            },
                        },
                        patient: true,
                    },
                },
                creditNote: true, // Include generated Credit Note
            },
        });

        if (!refund) {
            throw ApiError.notFound('Refund not found');
        }

        return refund;
    }

    /**
     * Generate refund number
     */
    async generateRefundNumber(storeId) {
        const today = new Date();
        const prefix = `RFD${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

        const lastRefund = await prisma.saleRefund.findFirst({
            where: {
                storeId,
                refundNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        let sequence = 1;
        if (lastRefund) {
            const lastSequence = parseInt(lastRefund.refundNumber.slice(-4));
            sequence = lastSequence + 1;
        }

        return `${prefix}${String(sequence).padStart(4, '0')}`;
    }
}

module.exports = new SaleRefundService();

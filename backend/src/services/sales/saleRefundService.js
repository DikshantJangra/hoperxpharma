
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

const prisma = require('../../db/prisma');

/**
 * Sale Refund Service - Handles refund workflow for sales
 */
class SaleRefundService {
    /**
     * Initiate a refund request
     */
    async initiateRefund(saleId, refundData) {
        const { items, reason, requestedBy, storeId } = refundData;

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

        if (sale.status === 'REFUNDED') {
            throw ApiError.badRequest('Sale has already been fully refunded');
        }

        // Calculate refund amount
        let refundAmount = 0;
        const refundItems = [];

        for (const item of items) {
            const saleItem = sale.items.find(si => si.id === item.saleItemId);
            if (!saleItem) {
                throw ApiError.badRequest(`Sale item ${item.saleItemId} not found`);
            }

            if (item.quantity > saleItem.quantity) {
                throw ApiError.badRequest(`Refund quantity exceeds sold quantity for item ${saleItem.drug.name}`);
            }

            const itemRefundAmount = (saleItem.lineTotal / saleItem.quantity) * item.quantity;
            refundAmount += itemRefundAmount;

            refundItems.push({
                saleItemId: item.saleItemId,
                drugId: saleItem.drugId,
                batchId: saleItem.batchId,
                quantity: item.quantity,
                refundAmount: itemRefundAmount,
                reason: item.reason || reason,
            });
        }

        // Generate refund number
        const refundNumber = await this.generateRefundNumber(storeId);

        // Create refund in transaction
        const refund = await prisma.$transaction(async (tx) => {
            const newRefund = await tx.saleRefund.create({
                data: {
                    refundNumber,
                    originalSaleId: saleId,
                    storeId,
                    refundAmount,
                    refundReason: reason,
                    requestedBy,
                    status: 'PENDING',
                },
            });

            // Create refund items
            await Promise.all(
                refundItems.map(item =>
                    tx.saleRefundItem.create({
                        data: {
                            ...item,
                            refundId: newRefund.id,
                        },
                    })
                )
            );

            return newRefund;
        });

        logger.info(`Refund initiated: ${refundNumber} for sale ${sale.invoiceNumber}`);
        return await this.getRefundById(refund.id);
    }

    /**
     * Approve refund
     */
    async approveRefund(refundId, approverId) {
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
                status: 'APPROVED',
                approvedBy: approverId,
                approvedAt: new Date(),
            },
        });

        logger.info(`Refund approved: ${refund.refundNumber} by ${approverId}`);
        return await this.getRefundById(updatedRefund.id);
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
                refundReason: `${refund.refundReason}\n\nRejection Reason: ${reason}`,
            },
        });

        logger.info(`Refund rejected: ${refund.refundNumber}`);
        return await this.getRefundById(updatedRefund.id);
    }

    /**
     * Process refund (complete and restore inventory)
     */
    async processRefund(refundId) {
        const refund = await prisma.saleRefund.findUnique({
            where: { id: refundId },
            include: {
                items: true,
                originalSale: true,
            },
        });

        if (!refund) {
            throw ApiError.notFound('Refund not found');
        }

        if (refund.status !== 'APPROVED') {
            throw ApiError.badRequest('Refund must be approved before processing');
        }

        // Process refund in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Restore inventory for each item
            for (const item of refund.items) {
                // Increment batch quantity
                await tx.inventoryBatch.update({
                    where: { id: item.batchId },
                    data: {
                        quantityInStock: {
                            increment: item.quantity,
                        },
                    },
                });

                // Create stock movement
                await tx.stockMovement.create({
                    data: {
                        batchId: item.batchId,
                        movementType: 'IN',
                        quantity: item.quantity,
                        reason: 'Refund',
                        referenceType: 'refund',
                        referenceId: refund.id,
                    },
                });
            }

            // Update refund status
            const updatedRefund = await tx.saleRefund.update({
                where: { id: refundId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });

            // Update original sale status
            const totalRefunded = await tx.saleRefund.aggregate({
                where: {
                    originalSaleId: refund.originalSaleId,
                    status: 'COMPLETED',
                },
                _sum: {
                    refundAmount: true,
                },
            });

            const saleStatus =
                totalRefunded._sum.refundAmount >= refund.originalSale.total
                    ? 'REFUNDED'
                    : 'PARTIALLY_REFUNDED';

            await tx.sale.update({
                where: { id: refund.originalSaleId },
                data: { status: saleStatus },
            });

            return updatedRefund;
        });

        logger.info(`Refund processed: ${refund.refundNumber}, inventory restored`);
        return await this.getRefundById(result.id);
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

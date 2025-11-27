const database = require('../config/database');
const prisma = database.getClient();

/**
 * GRN Repository - Database operations for Goods Received Notes
 */
class GRNRepository {

    /**
     * Create new GRN
     */
    async createGRN(grnData) {
        const { items, ...grnInfo } = grnData;

        return await prisma.$transaction(async (tx) => {
            // Create GRN
            const grn = await tx.goodsReceivedNote.create({
                data: {
                    ...grnInfo,
                    status: 'DRAFT'
                }
            });

            // Create GRN items if provided
            if (items && items.length > 0) {
                await tx.gRNItem.createMany({
                    data: items.map(item => ({
                        ...item,
                        grnId: grn.id
                    }))
                });
            }

            return await tx.goodsReceivedNote.findUnique({
                where: { id: grn.id },
                include: {
                    items: true,
                    discrepancies: true,
                    po: {
                        include: {
                            items: {
                                include: {
                                    drug: true
                                }
                            },
                            supplier: true
                        }
                    },
                    receivedByUser: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });
        });
    }

    /**
     * Get GRN by ID
     */
    async getGRNById(id) {
        return await prisma.goodsReceivedNote.findUnique({
            where: { id },
            include: {
                items: true,
                discrepancies: true,
                po: {
                    include: {
                        items: {
                            include: {
                                drug: true
                            }
                        },
                        supplier: true
                    }
                },
                receivedByUser: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
    }

    /**
     * Update GRN item
     */
    async updateGRNItem(grnId, itemId, itemData) {
        return await prisma.gRNItem.update({
            where: { id: itemId },
            data: itemData
        });
    }

    /**
     * Create GRN item (for batch splitting)
     */
    async createGRNItem(itemData) {
        return await prisma.gRNItem.create({
            data: itemData
        });
    }

    /**
     * Delete GRN item
     */
    async deleteGRNItem(itemId) {
        return await prisma.gRNItem.delete({
            where: { id: itemId }
        });
    }

    /**
     * Record discrepancy
     */
    async recordDiscrepancy(discrepancyData) {
        return await prisma.gRNDiscrepancy.create({
            data: discrepancyData
        });
    }

    /**
     * Update discrepancy resolution
     */
    async updateDiscrepancy(discrepancyId, data) {
        return await prisma.gRNDiscrepancy.update({
            where: { id: discrepancyId },
            data
        });
    }

    /**
     * Update GRN status and totals
     */
    async updateGRN(grnId, data) {
        return await prisma.goodsReceivedNote.update({
            where: { id: grnId },
            data,
            include: {
                items: true,
                discrepancies: true
            }
        });
    }

    /**
     * Complete GRN - Update inventory, PO status, create stock movements
     */
    async completeGRN(grnId, userId) {
        return await prisma.$transaction(async (tx) => {
            // Get GRN with all details
            const grn = await tx.goodsReceivedNote.findUnique({
                where: { id: grnId },
                include: {
                    items: true,
                    po: {
                        include: {
                            items: true
                        }
                    }
                }
            });

            if (!grn) {
                throw new Error('GRN not found');
            }

            if (grn.status !== 'DRAFT' && grn.status !== 'IN_PROGRESS') {
                throw new Error('Can only complete draft or in-progress GRNs');
            }

            // 1. Create inventory batches for each GRN item
            for (const item of grn.items) {
                const totalQty = item.receivedQty + item.freeQty;

                if (totalQty > 0) {
                    await tx.inventoryBatch.create({
                        data: {
                            storeId: grn.storeId,
                            drugId: item.drugId,
                            batchNumber: item.batchNumber,
                            expiryDate: item.expiryDate,
                            quantityInStock: totalQty,
                            mrp: item.mrp,
                            purchasePrice: item.unitPrice,
                            supplierId: grn.supplierId
                        }
                    });

                    // Create stock movement
                    const batch = await tx.inventoryBatch.findFirst({
                        where: {
                            storeId: grn.storeId,
                            drugId: item.drugId,
                            batchNumber: item.batchNumber
                        }
                    });

                    if (batch) {
                        await tx.stockMovement.create({
                            data: {
                                batchId: batch.id,
                                movementType: 'IN',
                                quantity: totalQty,
                                reason: `GRN ${grn.grnNumber}`,
                                referenceType: 'grn',
                                referenceId: grn.id,
                                userId
                            }
                        });
                    }
                }
            }

            // 2. Update PO item received quantities
            for (const grnItem of grn.items) {
                const totalReceived = grnItem.receivedQty + grnItem.freeQty;

                await tx.purchaseOrderItem.update({
                    where: { id: grnItem.poItemId },
                    data: {
                        receivedQty: {
                            increment: totalReceived
                        }
                    }
                });
            }

            // 3. Determine PO status
            const updatedPO = await tx.purchaseOrder.findUnique({
                where: { id: grn.poId },
                include: { items: true }
            });

            let newPOStatus = 'RECEIVED';
            for (const poItem of updatedPO.items) {
                if (poItem.receivedQty < poItem.quantity) {
                    newPOStatus = 'PARTIALLY_RECEIVED';
                    break;
                }
            }

            // Update PO status
            await tx.purchaseOrder.update({
                where: { id: grn.poId },
                data: { status: newPOStatus }
            });

            // 4. Mark GRN as completed
            const completedGRN = await tx.goodsReceivedNote.update({
                where: { id: grnId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                },
                include: {
                    items: true,
                    discrepancies: true,
                    po: {
                        include: {
                            items: true,
                            supplier: true
                        }
                    }
                }
            });

            return completedGRN;
        });
    }

    /**
     * Cancel GRN
     */
    async cancelGRN(grnId) {
        return await prisma.goodsReceivedNote.update({
            where: { id: grnId },
            data: {
                status: 'CANCELLED'
            }
        });
    }

    /**
     * Get GRNs by PO ID
     */
    async getGRNsByPOId(poId) {
        return await prisma.goodsReceivedNote.findMany({
            where: { poId },
            include: {
                items: true,
                discrepancies: true,
                po: {
                    include: {
                        items: {
                            include: {
                                drug: true
                            }
                        },
                        supplier: true
                    }
                },
                receivedByUser: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    /**
     * Get GRNs by store with filters
     */
    async getGRNs(filters = {}) {
        const { storeId, status, limit = 50, offset = 0 } = filters;

        const where = {};
        if (storeId) where.storeId = storeId;
        if (status) where.status = status;

        return await prisma.goodsReceivedNote.findMany({
            where,
            include: {
                po: {
                    include: {
                        supplier: true
                    }
                },
                items: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });
    }
    /**
     * Generate GRN number
     */
    async generateGRNNumber(storeId) {
        const today = new Date();
        const prefix = `GRN${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

        const lastGRN = await prisma.goodsReceivedNote.findFirst({
            where: {
                storeId,
                grnNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        let sequence = 1;
        if (lastGRN) {
            const lastSequence = parseInt(lastGRN.grnNumber.slice(-4));
            sequence = lastSequence + 1;
        }

        return `${prefix}${String(sequence).padStart(4, '0')}`;
    }
}

module.exports = new GRNRepository();

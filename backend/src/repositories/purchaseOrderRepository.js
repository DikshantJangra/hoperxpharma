const database = require('../config/database');

const prisma = database.getClient();

/**
 * Purchase Order Repository - Data access layer for PO operations
 */
class PurchaseOrderRepository {
    /**
     * Find suppliers with pagination
     */
    async findSuppliers({ page = 1, limit = 20, search = '', status }) {
        const skip = (page - 1) * limit;

        const where = {
            deletedAt: null,
            ...(status && { status }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { contactName: { contains: search, mode: 'insensitive' } },
                    { gstin: { contains: search } },
                ],
            }),
        };

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.supplier.count({ where }),
        ]);

        return { suppliers, total };
    }

    /**
     * Find supplier by ID
     */
    async findSupplierById(id) {
        return await prisma.supplier.findUnique({
            where: { id, deletedAt: null },
            include: {
                licenses: true,
                purchaseOrders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    /**
     * Create supplier
     */
    async createSupplier(supplierData) {
        return await prisma.supplier.create({
            data: supplierData,
        });
    }

    /**
     * Update supplier
     */
    async updateSupplier(id, supplierData) {
        return await prisma.supplier.update({
            where: { id },
            data: supplierData,
        });
    }

    /**
     * Find purchase orders with pagination
     */
    async findPurchaseOrders({ storeId, page = 1, limit = 20, status, supplierId }) {
        const skip = (page - 1) * limit;

        const where = {
            storeId,
            deletedAt: null,
            ...(status && { status }),
            ...(supplierId && { supplierId }),
        };

        const [orders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                skip,
                take: limit,
                include: {
                    supplier: true,
                    items: {
                        include: {
                            drug: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.purchaseOrder.count({ where }),
        ]);

        return { orders, total };
    }

    /**
     * Find PO by ID
     */
    async findPOById(id) {
        return await prisma.purchaseOrder.findUnique({
            where: { id, deletedAt: null },
            include: {
                supplier: true,
                items: {
                    include: {
                        drug: true,
                    },
                },
                receipts: true,
            },
        });
    }

    /**
     * Generate PO number
     */
    async generatePONumber(storeId) {
        const today = new Date();
        const prefix = `PO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

        const lastPO = await prisma.purchaseOrder.findFirst({
            where: {
                storeId,
                poNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        let sequence = 1;
        if (lastPO) {
            const lastSequence = parseInt(lastPO.poNumber.slice(-4));
            sequence = lastSequence + 1;
        }

        return `${prefix}${String(sequence).padStart(4, '0')}`;
    }

    /**
     * Create purchase order with items
     */
    async createPO(poData, items) {
        return await prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.create({
                data: poData,
            });

            const poItems = await Promise.all(
                items.map((item) =>
                    tx.purchaseOrderItem.create({
                        data: {
                            ...item,
                            poId: po.id,
                        },
                    })
                )
            );

            return { po, items: poItems };
        });
    }

    /**
     * Update PO status
     */
    async updatePOStatus(id, status, approvedBy = null) {
        return await prisma.purchaseOrder.update({
            where: { id },
            data: {
                status,
                ...(approvedBy && { approvedBy, approvedAt: new Date() }),
            },
        });
    }

    /**
     * Create PO receipt and update inventory
     */
    async createReceipt(receiptData) {
        return await prisma.$transaction(async (tx) => {
            const receipt = await tx.pOReceipt.create({
                data: receiptData,
            });

            // Update inventory for received items
            const itemsReceived = receiptData.itemsReceived;

            for (const item of itemsReceived) {
                // Create or update inventory batch
                await tx.inventoryBatch.create({
                    data: {
                        storeId: receiptData.storeId,
                        drugId: item.drugId,
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate,
                        quantityInStock: item.quantityReceived,
                        mrp: item.mrp,
                        purchasePrice: item.purchasePrice,
                        supplierId: receiptData.supplierId,
                    },
                });

                // Create stock movement
                await tx.stockMovement.create({
                    data: {
                        batchId: item.batchId,
                        movementType: 'IN',
                        quantity: item.quantityReceived,
                        reason: 'Purchase Order Receipt',
                        referenceType: 'purchase',
                        referenceId: receiptData.poId,
                    },
                });
            }

            // Update PO status
            const po = await tx.purchaseOrder.findUnique({
                where: { id: receiptData.poId },
                include: { items: true },
            });

            const totalOrdered = po.items.reduce((sum, item) => sum + item.quantity, 0);
            const totalReceived = itemsReceived.reduce((sum, item) => sum + item.quantityReceived, 0);

            let newStatus = 'PARTIALLY_RECEIVED';
            if (totalReceived >= totalOrdered) {
                newStatus = 'RECEIVED';
            }

            await tx.purchaseOrder.update({
                where: { id: receiptData.poId },
                data: { status: newStatus },
            });

            return receipt;
        });
    }

    /**
     * Get PO statistics
     */
    async getPOStats(storeId) {
        const result = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as "totalPOs",
        COUNT(CASE WHEN status = 'PENDING_APPROVAL' THEN 1 END) as "pendingApproval",
        COUNT(CASE WHEN status = 'SENT' THEN 1 END) as "sent",
        COUNT(CASE WHEN status = 'PARTIALLY_RECEIVED' THEN 1 END) as "partiallyReceived",
        SUM(total) as "totalValue"
      FROM "PurchaseOrder"
      WHERE "storeId" = ${storeId}
        AND "deletedAt" IS NULL
    `;

        return result[0];
    }
}

module.exports = new PurchaseOrderRepository();

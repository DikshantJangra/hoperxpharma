const database = require('../config/database');

const prisma = database.getClient();

/**
 * Purchase Order Repository - Data access layer for PO operations
 */
class PurchaseOrderRepository {
    /**
     * Find suppliers with pagination
     */
    async findSuppliers({ storeId, page = 1, limit = 20, search = '', status }) {
        if (!storeId) {
            throw new Error('storeId is required for findSuppliers');
        }

        const skip = (page - 1) * limit;

        const where = {
            storeId,
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
    async findSupplierById(id, storeId = null) {
        const where = {
            id,
            deletedAt: null,
            ...(storeId && { storeId })
        };

        return await prisma.supplier.findUnique({
            where,
            include: {
                licenses: true,
                purchaseOrders: {
                    where: storeId ? { storeId } : {},
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
        if (!supplierData.storeId) {
            throw new Error('storeId is required to create a supplier');
        }

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
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Handle comma-separated status values
        const statusFilter = status
            ? (status.includes(',')
                ? { in: status.split(',').map(s => s.trim()) }
                : status)
            : undefined;

        const where = {
            storeId,
            deletedAt: null,
            ...(statusFilter && { status: statusFilter }),
            ...(supplierId && { supplierId }),
        };

        const [orders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                skip,
                take: limitNum,
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
                store: true,
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

            // For each item, ensure the drug exists in the Drug table
            // If drugId doesn't exist, create it from the item description
            const itemsWithValidDrugs = await Promise.all(
                items.map(async (item) => {
                    let drugId = item.drugId;

                    // Check if drug exists
                    const drugExists = await tx.drug.findUnique({
                        where: { id: drugId }
                    });

                    // If drug doesn't exist, create it
                    if (!drugExists) {
                        // Extract drug info from description
                        const description = item.description || '';
                        const parts = description.split(' - ');
                        const name = parts[0] || 'Unknown Medicine';
                        const composition = parts[1] || '';

                        const newDrug = await tx.drug.create({
                            data: {
                                id: drugId, // Use the catalog medicine ID
                                name: name,
                                genericName: composition || name,
                                strength: '', // Will be updated later
                                form: 'Tablet', // Default
                                manufacturer: '', // Will be updated later
                                schedule: 'OTC', // Default
                                gstRate: item.gstPercent || 12,
                                storeId: poData.storeId,
                            }
                        });

                        drugId = newDrug.id;
                    }

                    return { ...item, drugId };
                })
            );

            // Transform items to match Prisma schema
            const poItems = await Promise.all(
                itemsWithValidDrugs.map((item) =>
                    tx.purchaseOrderItem.create({
                        data: {
                            poId: po.id,
                            drugId: item.drugId,
                            quantity: item.qty,  // Transform qty → quantity
                            unitPrice: item.pricePerUnit,  // Transform pricePerUnit → unitPrice
                            discountPercent: item.discountPercent || 0,
                            gstPercent: item.gstPercent,
                            lineTotal: item.lineNet,  // Transform lineNet → lineTotal
                        },
                    })
                )
            );

            return { po, items: poItems };
        });
    }

    /**
     * Update purchase order and items
     */
    async updatePO(id, poData, items) {
        return await prisma.$transaction(async (tx) => {
            // Update PO details
            const po = await tx.purchaseOrder.update({
                where: { id },
                data: poData,
            });

            // Delete existing items
            await tx.purchaseOrderItem.deleteMany({
                where: { poId: id },
            });

            // Create new items
            const poItems = await Promise.all(
                items.map((item) =>
                    tx.purchaseOrderItem.create({
                        data: {
                            poId: po.id,
                            ...(item.drugId && { drugId: item.drugId }), // Only include drugId if it exists
                            quantity: item.qty,
                            unitPrice: item.pricePerUnit,
                            discountPercent: item.discountPercent || 0,
                            gstPercent: item.gstPercent,
                            lineTotal: item.lineNet,
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

    /**
     * Get last purchase price for a drug from a specific supplier
     */
    async getLastPurchasePrice(drugId, supplierId) {
        if (!supplierId) return null;

        const lastItem = await prisma.purchaseOrderItem.findFirst({
            where: {
                drugId,
                po: {
                    supplierId,
                    status: { in: ['SENT', 'RECEIVED', 'PARTIALLY_RECEIVED', 'CLOSED'] },
                    deletedAt: null
                }
            },
            orderBy: {
                po: {
                    createdAt: 'desc'
                }
            },
            select: {
                unitPrice: true,
                quantity: true
            }
        });

        return lastItem;
    }

    /**
     * Template Methods
     */

    async findTemplates(storeId, { isActive = true, limit = 50 } = {}) {
        return await prisma.pOTemplate.findMany({
            where: {
                storeId,
                isActive,
                deletedAt: null
            },
            include: {
                items: {
                    include: {
                        drug: {
                            select: {
                                id: true,
                                name: true,
                                strength: true,
                                form: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { lastUsedAt: 'desc' },
                { usageCount: 'desc' },
                { createdAt: 'desc' }
            ],
            take: limit
        });
    }

    async findTemplateById(id) {
        return await prisma.pOTemplate.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        drug: {
                            select: {
                                id: true,
                                name: true,
                                strength: true,
                                form: true,
                                gstRate: true
                            }
                        }
                    }
                }
            }
        });
    }

    async createTemplate(templateData) {
        const { items, ...templateInfo } = templateData;

        return await prisma.pOTemplate.create({
            data: {
                ...templateInfo,
                items: {
                    create: items.map(item => ({
                        drugId: item.drugId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discountPercent: item.discountPercent || 0
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        drug: {
                            select: {
                                id: true,
                                name: true,
                                strength: true,
                                form: true
                            }
                        }
                    }
                }
            }
        });
    }

    async updateTemplate(id, templateData) {
        const { items, ...templateInfo } = templateData;

        // If items are provided, replace all items
        if (items) {
            await prisma.$transaction(async (tx) => {
                // Delete existing items
                await tx.pOTemplateItem.deleteMany({
                    where: { templateId: id }
                });

                // Update template and create new items
                await tx.pOTemplate.update({
                    where: { id },
                    data: {
                        ...templateInfo,
                        items: {
                            create: items.map(item => ({
                                drugId: item.drugId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                discountPercent: item.discountPercent || 0
                            }))
                        }
                    }
                });
            });
        } else {
            // Just update template info
            await prisma.pOTemplate.update({
                where: { id },
                data: templateInfo
            });
        }

        return await this.findTemplateById(id);
    }

    async deleteTemplate(id) {
        return await prisma.pOTemplate.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false
            }
        });
    }

    async updateTemplateUsage(id) {
        return await prisma.pOTemplate.update({
            where: { id },
            data: {
                usageCount: { increment: 1 },
                lastUsedAt: new Date()
            }
        });
    }
}

module.exports = new PurchaseOrderRepository();

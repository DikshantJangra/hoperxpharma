
const prisma = require('../db/prisma');
const logger = require('../config/logger');

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
                    items: {
                        include: {
                            drug: true
                        }
                    },
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
                    },
                    attachments: {
                        orderBy: {
                            uploadedAt: 'desc'
                        }
                    }
                }
            });
        }, {
            maxWait: 10000,
            timeout: 15000
        });
    }

    /**
     * Get GRN by ID
     */
    async getGRNById(id) {
        const grn = await prisma.goodsReceivedNote.findUnique({
            where: { id },
            include: {
                items: {
                    where: {
                        parentItemId: null  // Only get top-level items (exclude children)
                    },
                    orderBy: {
                        id: 'asc'  // Order by ID (insertion order) - GRNItem doesn't have createdAt
                    },
                    include: {
                        drug: true,  // Include drug information directly on GRN items
                        children: {
                            orderBy: {
                                id: 'asc'  // Also order child batches by ID
                            },
                            include: {
                                drug: true  // Include drug information on child items too
                            }
                        }
                    }
                },
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
                },

                attachments: {
                    orderBy: {
                        uploadedAt: 'desc'
                    }
                }
            }
        });

        // Convert BigInt to Number for attachments
        if (grn && grn.attachments && grn.attachments.length > 0) {
            grn.attachments = grn.attachments.map(att => ({
                ...att,
                originalSize: Number(att.originalSize),
                compressedSize: Number(att.compressedSize),
            }));
        }

        return grn;
    }

    /**
     * Update GRN item
     */
    async updateGRNItem(grnId, itemId, itemData) {
        // CRITICAL FIX #3: Prevent MRP regression and completed GRN modification

        // Fetch current item and GRN status
        const current = await prisma.gRNItem.findUnique({
            where: { id: itemId },
            select: {
                mrp: true,
                grnId: true,
                grn: {
                    select: { status: true }
                }
            }
        });

        if (!current) {
            throw new Error('GRN item not found');
        }

        // Prevent modification of completed GRNs
        if (current.grn.status === 'COMPLETED') {
            throw new Error('Cannot modify items in completed GRN');
        }

        // Prevent MRP regression (valid value → 0)
        if (itemData.mrp !== undefined && itemData.mrp === 0) {
            if (current.mrp > 0) {
                throw new Error(
                    `Cannot reset MRP from ${current.mrp} to 0. ` +
                    `If this is intentional, set MRP to 0.01 instead, or contact support.`
                );
            }
        }

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
        // Check if discrepancy already exists for this item
        if (discrepancyData.grnItemId) {
            const existing = await prisma.gRNDiscrepancy.findFirst({
                where: { grnItemId: discrepancyData.grnItemId }
            });

            if (existing) {
                return await prisma.gRNDiscrepancy.update({
                    where: { id: existing.id },
                    data: discrepancyData
                });
            }
        }

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
     * Complete GRN - Delegates to GRNCompletionService
     * Repository now only handles data access, business logic extracted to service
     */
    async completeGRN(grnId, status, userId) {
        const grnCompletionService = require('../services/grn/grnCompletionService');
        return await grnCompletionService.complete(grnId, status, userId);
    }

    async cancelGRN(grnId) {
    return await prisma.goodsReceivedNote.update({
        where: { id: grnId },
        data: {
            status: 'CANCELLED'
        }
    });
}

    /**
     * Delete GRN (Hard Delete)
     * Must delete children first due to Restrict constraint
     */
    async deleteGRN(grnId) {
    return await prisma.$transaction(async (tx) => {
        // 1. Delete all child GRN items first (those with parentItemId)
        await tx.gRNItem.deleteMany({
            where: {
                grnId,
                parentItemId: { not: null }
            }
        });

        // 2. Delete all parent GRN items (those without parentItemId)
        await tx.gRNItem.deleteMany({
            where: {
                grnId,
                parentItemId: null
            }
        });

        // 3. Delete discrepancies (if any)
        await tx.gRNDiscrepancy.deleteMany({
            where: { grnId }
        });

        // 4. Delete attachments (handled by Cascade, but explicit for clarity)
        await tx.gRNAttachment.deleteMany({
            where: { grnId }
        });

        // 5. Finally delete the GRN itself
        return await tx.goodsReceivedNote.delete({
            where: { id: grnId }
        });
    });
}

    /**
     * Get GRNs by PO ID
     */
    async getGRNsByPOId(poId) {
    const grns = await prisma.goodsReceivedNote.findMany({
        where: { poId },
        include: {
            items: {
                where: {
                    parentItemId: null  // Only get top-level items (exclude children)
                },
                orderBy: {
                    id: 'asc'  // Stable ordering
                },
                include: {
                    drug: true,  // Include drug information directly on GRN items
                    children: {
                        orderBy: {
                            id: 'asc'  // Also order child batches
                        },
                        include: {
                            drug: true  // Include drug information on child items too
                        }
                    }
                }
            },
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
            },

            attachments: {
                orderBy: {
                    uploadedAt: 'desc'
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Convert BigInt to Number for attachments
    return grns.map(grn => ({
        ...grn,
        attachments: grn.attachments?.map(att => ({
            ...att,
            originalSize: Number(att.originalSize),
            compressedSize: Number(att.compressedSize),
        })) || []
    }));
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
     * Generate GRN number with race condition handling
     */
    async generateGRNNumber(storeId) {
    const today = new Date();
    const prefix = `GRN${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')} `;

    // Try up to 5 times to generate a unique GRN number
    for (let attempt = 0; attempt < 5; attempt++) {
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

        const grnNumber = `${prefix}${String(sequence).padStart(4, '0')} `;

        // Check if this number already exists
        const existing = await prisma.goodsReceivedNote.findUnique({
            where: { grnNumber },
            select: { id: true }
        });

        if (!existing) {
            return grnNumber;
        }

        // If it exists, add a small delay and retry
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
    }

    // Fallback: use timestamp-based unique number
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp} `;
}
}

module.exports = new GRNRepository();

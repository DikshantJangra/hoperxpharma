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
                    items: {
                        include: {
                            drug: true  // Include drug information on GRN items
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

    // logger.info(`GRN completed: ${completedGRN.grnNumber} - Inventory updated, PO status: ${updatedPO.status}`);
    /**
     * Complete GRN - Update inventory, PO status, create stock movements
     */
    async completeGRN(grnId, status, userId) {
        return await prisma.$transaction(async (tx) => {
            // Get GRN with all details
            const grn = await tx.goodsReceivedNote.findUnique({
                where: { id: grnId },
                include: {
                    items: {
                        include: {
                            children: true
                        }
                    },
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

            // Ensure all drugs exist in this store (create copies if needed)
            // This handles the case where a PO was created with drugs from other stores
            const drugIds = new Set(grn.items.map(item => item.drugId));
            for (const drugId of drugIds) {
                const drug = await tx.drug.findUnique({
                    where: { id: drugId }
                });

                if (!drug) {
                    throw new Error(`Drug ${drugId} not found`);
                }

                // Check if this drug exists in the GRN's store
                if (drug.storeId !== grn.storeId) {
                    // Drug belongs to a different store, create a copy for this store
                    const existingDrugInStore = await tx.drug.findFirst({
                        where: {
                            storeId: grn.storeId,
                            name: drug.name,
                            strength: drug.strength,
                            form: drug.form
                        }
                    });

                    let storeDrugId;
                    if (existingDrugInStore) {
                        // Use existing drug in this store
                        storeDrugId = existingDrugInStore.id;
                    } else {
                        // Create a new drug for this store
                        const newDrug = await tx.drug.create({
                            data: {
                                storeId: grn.storeId,
                                rxcui: drug.rxcui,
                                name: drug.name,
                                genericName: drug.genericName,
                                strength: drug.strength,
                                form: drug.form,
                                manufacturer: drug.manufacturer,
                                schedule: drug.schedule,
                                hsnCode: drug.hsnCode,
                                gstRate: drug.gstRate,
                                requiresPrescription: drug.requiresPrescription,
                                defaultUnit: drug.defaultUnit,
                                lowStockThreshold: drug.lowStockThreshold,
                                description: drug.description
                            }
                        });
                        storeDrugId = newDrug.id;
                    }

                    // Update all GRN items that reference the old drug to use the store-specific drug
                    await tx.gRNItem.updateMany({
                        where: {
                            grnId: grn.id,
                            drugId: drugId
                        },
                        data: {
                            drugId: storeDrugId
                        }
                    });
                }
            }

            // Re-fetch GRN with updated drugIds
            const updatedGrn = await tx.goodsReceivedNote.findUnique({
                where: { id: grnId },
                include: {
                    items: {
                        where: { parentItemId: null },
                        include: { children: true }
                    },
                    po: true
                }
            });

            // 1. Create inventory batches for each GRN item
            // Flatten items to include children of split batches
            // console.log('🔍 GRN Items before flattening:', updatedGrn.items.length);
            // console.log('🔍 Items:', JSON.stringify(updatedGrn.items.map(i => ({
            //     id: i.id,
            //     batchNumber: i.batchNumber,
            //     isSplit: i.isSplit,
            //     hasChildren: !!i.children,
            //     childrenCount: i.children?.length || 0,
            //     receivedQty: i.receivedQty,
            //     freeQty: i.freeQty
            // })), null, 2));

            const allItems = updatedGrn.items.flatMap(item => {
                // Skip parent items that are split - only return their children
                if (item.isSplit) {
                    // console.log(`🔍 Item ${item.batchNumber} is SPLIT, returning ${item.children?.length || 0} children`);
                    return item.children || [];
                }
                // Return non-split items
                // console.log(`🔍 Item ${item.batchNumber} is NOT split, returning itself`);
                return [item];
            });

            // console.log('🔍 Flattened items count:', allItems.length);
            // console.log('🔍 Flattened items:', JSON.stringify(allItems.map(i => ({
            //     id: i.id,
            //     batchNumber: i.batchNumber,
            //     receivedQty: i.receivedQty,
            //     freeQty: i.freeQty
            // })), null, 2));

            // Validate: No TBD batches allowed
            const tbdItems = allItems.filter(item => item.batchNumber === 'TBD');
            if (tbdItems.length > 0) {
                throw new Error(`Cannot complete GRN: ${tbdItems.length} item(s) still have batch number "TBD". Please update all batch numbers before completing.`);
            }

            for (const item of allItems) {
                const totalQty = item.receivedQty + item.freeQty;
                // console.log(`🔍 Processing item ${item.batchNumber}, totalQty: ${totalQty}`);

                if (totalQty > 0) {
                    // console.log(`🔍 Creating/updating inventory for batch ${item.batchNumber}`);
                    const batch = await tx.inventoryBatch.upsert({
                        where: {
                            storeId_batchNumber_drugId: {
                                storeId: grn.storeId,
                                batchNumber: item.batchNumber,
                                drugId: item.drugId
                            }
                        },
                        update: {
                            quantityInStock: {
                                increment: totalQty
                            },
                            // Update price/location if necessary, or keep existing?
                            // Usually new GRN means new price, so we should update purchasePrice and MRP
                            mrp: item.mrp,
                            purchasePrice: item.unitPrice,
                            location: item.location || undefined // Only update if provided
                        },
                        create: {
                            storeId: grn.storeId,
                            drugId: item.drugId,
                            batchNumber: item.batchNumber,
                            expiryDate: item.expiryDate,
                            quantityInStock: totalQty,
                            mrp: item.mrp,
                            purchasePrice: item.unitPrice,
                            supplierId: grn.supplierId,
                            location: item.location || null
                        }
                    });

                    // console.log(`✅ Inventory batch ${item.batchNumber} created/updated, qty: ${totalQty}`);

                    // Create stock movement
                    const createdBatch = await tx.inventoryBatch.findFirst({
                        where: {
                            storeId: grn.storeId,
                            drugId: item.drugId,
                            batchNumber: item.batchNumber
                        }
                    });

                    if (createdBatch) {
                        await tx.stockMovement.create({
                            data: {
                                batchId: createdBatch.id,
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
            // IMPORTANT: Only count receivedQty, NOT freeQty for shortage detection
            // Free items are bonus from supplier, not part of the ordered quantity
            for (const grnItem of grn.items) {
                // Update receivedQty with ONLY the actual received quantity (not free)
                await tx.purchaseOrderItem.update({
                    where: { id: grnItem.poItemId },
                    data: {
                        receivedQty: {
                            increment: grnItem.receivedQty  // Only actual received, NOT including freeQty
                        }
                    }
                });
            }

            // 3. Determine PO status based on received quantities
            const updatedPO = await tx.purchaseOrder.findUnique({
                where: { id: grn.poId },
                include: { items: true }
            });

            let newPOStatus = 'RECEIVED';
            for (const poItem of updatedPO.items) {
                // Check if receivedQty (not including free qty) meets orderedQty
                if (poItem.receivedQty < poItem.quantity) {
                    newPOStatus = 'PARTIALLY_RECEIVED';
                    break;
                }
            }

            // Override: If user explicitly marked GRN as COMPLETED, accept shortages
            // So we force the PO status to RECEIVED
            if (status === 'COMPLETED') {
                newPOStatus = 'RECEIVED';
            }

            // Update PO status
            await tx.purchaseOrder.update({
                where: { id: grn.poId },
                data: { status: newPOStatus }
            });

            // 4. Mark GRN as completed with the specified status
            const completedGRN = await tx.goodsReceivedNote.update({
                where: { id: grnId },
                data: {
                    status: status || 'COMPLETED',  // Use provided status or default to COMPLETED
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
        }, {
            maxWait: 10000, // Wait up to 10s to start transaction
            timeout: 15000  // Transaction can run for up to 15s
        });
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
     */
    async deleteGRN(grnId) {
        return await prisma.goodsReceivedNote.delete({
            where: { id: grnId }
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

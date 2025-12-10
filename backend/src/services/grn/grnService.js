const grnRepository = require('../../repositories/grnRepository');
const purchaseOrderRepository = require('../../repositories/purchaseOrderRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * GRN Service - Business logic for Goods Received Notes
 */
class GRNService {
    /**
     * Initialize GRN from PO
     */
    async initializeGRN({ poId, userId, receivedBy }) {
        // Get PO details
        const po = await purchaseOrderRepository.findPOById(poId);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        if (po.status !== 'SENT' && po.status !== 'PARTIALLY_RECEIVED') {
            throw ApiError.badRequest('Can only receive items for sent or partially received POs');
        }

        // Check if there's already an IN_PROGRESS GRN for this PO
        const existingGrns = await grnRepository.getGRNsByPOId(poId);
        const draftGrn = existingGrns.find(g => g.status === 'IN_PROGRESS' || g.status === 'DRAFT');

        if (draftGrn) {
            logger.info(`Returning existing draft GRN: ${draftGrn.grnNumber} for PO ${po.poNumber}`);
            return draftGrn;
        }

        // Retry logic for GRN creation (handle unique constraint failures)
        let grn;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                // Generate GRN number
                const grnNumber = await grnRepository.generateGRNNumber(po.storeId);

                // Prepare GRN items from PO items
                // Use a reasonable default expiry (2 years from now) instead of sentinel date
                const defaultExpiry = new Date();
                defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 2);

                const grnItems = po.items.map(poItem => ({
                    poItemId: poItem.id,
                    drugId: poItem.drugId,
                    orderedQty: poItem.quantity,
                    receivedQty: poItem.quantity - (poItem.receivedQty || 0), // Default to remaining qty
                    freeQty: 0,
                    rejectedQty: 0,
                    batchNumber: 'TBD', // To be filled by user
                    expiryDate: defaultExpiry, // Default expiry (sentinel), to be updated by user
                    mrp: poItem.drug?.mrp || 0, // Get from drug master or to be filled by user
                    unitPrice: poItem.unitPrice,
                    discountPercent: poItem.discountPercent,
                    discountType: 'BEFORE_GST', // Default discount type
                    gstPercent: poItem.gstPercent,
                    lineTotal: 0 // Will be calculated
                }));

                // Create GRN
                grn = await grnRepository.createGRN({
                    grnNumber,
                    poId: po.id,
                    storeId: po.storeId,
                    supplierId: po.supplierId,
                    receivedBy: receivedBy || userId,
                    subtotal: 0,
                    taxAmount: 0,
                    total: 0,
                    items: grnItems
                });

                logger.info(`GRN initialized: ${grnNumber} for PO ${po.poNumber}`);
                break; // Success, exit retry loop
            } catch (error) {
                if (error.code === 'P2002' && attempt < 2) {
                    // Unique constraint violation, retry
                    logger.warn(`GRN number collision, retrying... (attempt ${attempt + 1})`);
                    await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
                    continue;
                }
                throw error; // Re-throw if not a unique constraint error or max retries reached
            }
        }

        return grn;
    }

    /**
     * Update receiving details for an item
     */
    async updateReceivingDetails({ grnId, itemId, details, userId }) {
        const grn = await grnRepository.getGRNById(grnId);

        if (!grn) {
            throw ApiError.notFound('GRN not found');
        }

        if (grn.status === 'COMPLETED' || grn.status === 'CANCELLED') {
            throw ApiError.badRequest('Cannot update completed or cancelled GRN');
        }

        const item = grn.items.find(i => i.id === itemId);
        if (!item) {
            throw ApiError.notFound('GRN item not found');
        }

        // Merge with existing values for calculation
        const receivedQty = details.receivedQty !== undefined ? details.receivedQty : item.receivedQty;
        const unitPrice = details.unitPrice !== undefined ? details.unitPrice : item.unitPrice;
        const discountPercent = details.discountPercent !== undefined ? details.discountPercent : item.discountPercent;
        const discountType = details.discountType !== undefined ? details.discountType : (item.discountType || 'BEFORE_GST');
        const gstPercent = details.gstPercent !== undefined ? details.gstPercent : item.gstPercent;

        // Calculate line total based on discount type
        let lineTotal;

        if (discountType === 'AFTER_GST') {
            // After GST: Apply discount on (amount + GST)
            const grossAmount = receivedQty * unitPrice;
            const taxAmount = grossAmount * (gstPercent / 100);
            const subtotalWithTax = grossAmount + taxAmount;
            const discountAmount = subtotalWithTax * ((discountPercent || 0) / 100);
            lineTotal = subtotalWithTax - discountAmount;
        } else {
            // Before GST (default): Apply discount first, then GST
            const netAmount = receivedQty * unitPrice * (1 - (discountPercent || 0) / 100);
            const taxAmount = netAmount * (gstPercent / 100);
            lineTotal = netAmount + taxAmount;
        }

        // Update item
        const updatedItem = await grnRepository.updateGRNItem(grnId, itemId, {
            ...details,
            lineTotal
        });

        // Recalculate GRN totals
        await this.recalculateGRNTotals(grnId);

        // Check for discrepancies
        if (details.receivedQty !== undefined && details.receivedQty !== item.orderedQty) {
            await this.autoDetectDiscrepancy(grnId, itemId, item.orderedQty, details.receivedQty);
        }

        // logger.info(`GRN item updated: ${itemId} in GRN ${grn.grnNumber}`);

        return updatedItem;
    }

    /**
     * Split batch - create child items with parent reference
     */
    async splitBatch({ grnId, itemId, splitData, userId }) {
        const grn = await grnRepository.getGRNById(grnId);

        if (!grn) {
            throw ApiError.notFound('GRN not found');
        }

        const originalItem = grn.items.find(i => i.id === itemId);
        if (!originalItem) {
            throw ApiError.notFound('GRN item not found');
        }

        // Prevent splitting already-split items
        if (originalItem.isSplit) {
            throw ApiError.badRequest('This item has already been split');
        }

        // Prevent splitting child items
        if (originalItem.parentItemId) {
            throw ApiError.badRequest('Cannot split a batch that is already a split');
        }

        // Validate split quantities
        const totalSplitQty = splitData.reduce((sum, split) => sum + split.receivedQty, 0);
        if (totalSplitQty !== originalItem.receivedQty) {
            throw ApiError.badRequest('Split quantities must equal original received quantity');
        }

        // Mark parent as split (don't delete it)
        await grnRepository.updateGRNItem(grnId, itemId, {
            isSplit: true
        });

        // Create child items for each split
        const newItems = [];
        for (const split of splitData) {
            // Calculate proportional orderedQty based on receivedQty ratio
            // This prevents false "shortage" discrepancies
            let proportionalOrderedQty = 0;
            if (originalItem.receivedQty > 0) {
                const qtyRatio = split.receivedQty / originalItem.receivedQty;
                proportionalOrderedQty = Math.round(originalItem.orderedQty * qtyRatio);
            }

            const netAmount = split.receivedQty * split.unitPrice * (1 - (split.discountPercent || 0) / 100);
            const taxAmount = netAmount * (split.gstPercent / 100);
            const lineTotal = netAmount + taxAmount;

            const newItem = await grnRepository.createGRNItem({
                grnId,
                poItemId: originalItem.poItemId,
                drugId: originalItem.drugId,
                orderedQty: proportionalOrderedQty,
                receivedQty: split.receivedQty,
                freeQty: split.freeQty || 0,
                rejectedQty: 0,
                batchNumber: split.batchNumber,
                expiryDate: split.expiryDate,
                mrp: split.mrp,
                unitPrice: split.unitPrice,
                discountPercent: split.discountPercent || 0,
                discountType: split.discountType || 'BEFORE_GST',
                gstPercent: split.gstPercent,
                location: split.location || null,
                parentItemId: itemId,  // Link to parent
                lineTotal
            });

            newItems.push(newItem);
        }

        // Recalculate totals
        await this.recalculateGRNTotals(grnId);

        logger.info(`Batch split for item ${itemId} in GRN ${grn.grnNumber} - created ${newItems.length} child items`);

        return newItems;
    }

    /**
     * Delete GRN item (child batch)
     */
    async deleteGRNItem({ grnId, itemId, userId }) {
        const grn = await grnRepository.getGRNById(grnId);

        if (!grn) {
            throw ApiError.notFound('GRN not found');
        }

        if (grn.status === 'COMPLETED' || grn.status === 'CANCELLED') {
            throw ApiError.badRequest('Cannot delete items from completed or cancelled GRN');
        }

        // Search in items (including children which might be flattened or nested depending on repo fetch)
        // Repo returns items with children nested, but we need to find the child item to delete
        let itemToDelete = null;
        let parentItem = null;

        for (const item of grn.items) {
            if (item.id === itemId) {
                itemToDelete = item;
                break;
            }
            if (item.children) {
                const child = item.children.find(c => c.id === itemId);
                if (child) {
                    itemToDelete = child;
                    parentItem = item;
                    break;
                }
            }
        }

        if (!itemToDelete) {
            throw ApiError.notFound('GRN item not found');
        }

        if (!itemToDelete.parentItemId) {
            throw ApiError.badRequest('Only split batch items (child items) can be deleted');
        }

        await grnRepository.deleteGRNItem(itemId);

        // Check if parent has any children left
        if (parentItem) {
            // Need to refresh/check parent to see if it still has children
            const freshParent = await grnRepository.getGRNById(grnId); // Heavy, but safe
            const freshParentItem = freshParent.items.find(i => i.id === parentItem.id);

            if (freshParentItem && (!freshParentItem.children || freshParentItem.children.length === 0)) {
                // No children left, unmark split
                await grnRepository.updateGRNItem(grnId, parentItem.id, {
                    isSplit: false
                });
            }
        }

        await this.recalculateGRNTotals(grnId);

        logger.info(`GRN item deleted: ${itemId} in GRN ${grn.grnNumber}`);
        return { success: true };
    }

    /**
     * Handle discrepancy
     */
    async handleDiscrepancy({ grnId, grnItemId, reason, resolution, description, debitNoteValue, userId }) {
        const grn = await grnRepository.getGRNById(grnId);

        if (!grn) {
            throw ApiError.notFound('GRN not found');
        }

        let item = null;
        let expectedQty = null;
        let actualQty = null;
        let discrepancyQty = 0;

        if (grnItemId) {
            item = grn.items.find(i => i.id === grnItemId);
            if (item) {
                expectedQty = item.orderedQty;
                actualQty = item.receivedQty;
                discrepancyQty = Math.abs(expectedQty - actualQty);
            }
        }

        const discrepancy = await grnRepository.recordDiscrepancy({
            grnId,
            grnItemId,
            reason,
            resolution,
            expectedQty,
            actualQty,
            discrepancyQty,
            description,
            debitNoteValue,
            debitNoteGenerated: false
        });

        logger.info(`Discrepancy recorded for GRN ${grn.grnNumber}: ${reason}`);

        return discrepancy;
    }

    /**
     * Complete GRN
     */
    async completeGRN({ grnId, userId, supplierInvoiceNo, supplierInvoiceDate, notes }) {
        const grn = await grnRepository.getGRNById(grnId);

        if (!grn) {
            throw ApiError.notFound('GRN not found');
        }

        if (grn.status === 'COMPLETED') {
            throw ApiError.badRequest('GRN already completed');
        }

        // Refresh GRN to get latest data
        const latestGrn = await grnRepository.getGRNById(grnId);

        // Validate all items have batch and expiry
        for (const item of latestGrn.items) {
            // Skip parent items that have been split - they don't need batch/expiry as children have them
            if (item.isSplit) {
                continue;
            }

            const poItem = latestGrn.po.items.find(pi => pi.id === item.poItemId);
            const drugName = poItem?.drug ? `${poItem.drug.name}${poItem.drug.strength ? ` ${poItem.drug.strength}` : ''}` : 'Unknown Drug';

            if (!item.batchNumber || !item.batchNumber.trim()) {
                throw ApiError.badRequest(`${drugName}: Batch number is required`);
            }

            if (!item.expiryDate) {
                throw ApiError.badRequest(`${drugName}: Expiry date is required`);
            }

            if (!item.mrp || item.mrp === 0) {
                throw ApiError.badRequest(`${drugName}: MRP is required`);
            }

            if (item.receivedQty === 0 && item.freeQty === 0) {
                throw ApiError.badRequest(`${drugName}: Received quantity cannot be zero`);
            }
        }

        // Update invoice details if provided
        if (supplierInvoiceNo || supplierInvoiceDate || notes) {
            await grnRepository.updateGRN(grnId, {
                supplierInvoiceNo,
                supplierInvoiceDate,
                notes
            });
        }

        // CRITICAL: Recalculate totals from items before completing
        // This ensures updated prices during receiving are reflected in the final GRN
        await this.recalculateGRNTotals(grnId);

        // Complete GRN (updates inventory, PO status, creates stock movements)
        const completedGRN = await grnRepository.completeGRN(grnId, userId);

        // logger.info(`GRN completed: ${grn.grnNumber} - Inventory updated, PO status: ${completedGRN.po.status}`);

        return completedGRN;
    }

    /**
     * Update GRN (for draft saving)
     */
    async updateGRN({ grnId, updates, userId }) {
        const grn = await grnRepository.getGRNById(grnId);

        if (!grn) {
            throw ApiError.notFound('GRN not found');
        }

        if (grn.status === 'COMPLETED' || grn.status === 'CANCELLED') {
            throw ApiError.badRequest('Cannot update completed or cancelled GRN');
        }

        const updatedGRN = await grnRepository.updateGRN(grnId, updates);

        logger.info(`GRN updated: ${grn.grnNumber} by user ${userId}`);

        return updatedGRN;
    }

    /**
     * Cancel GRN
     */
    async cancelGRN({ grnId, userId }) {
        const grn = await grnRepository.getGRNById(grnId);

        if (!grn) {
            throw ApiError.notFound('GRN not found');
        }

        if (grn.status === 'COMPLETED') {
            throw ApiError.badRequest('Cannot cancel completed GRN');
        }

        const cancelledGRN = await grnRepository.cancelGRN(grnId);

        logger.info(`GRN cancelled: ${grn.grnNumber} by user ${userId}`);

        return cancelledGRN;
    }

    /**
     * Get GRN by ID
     */
    async getGRNById(id) {
        const grn = await grnRepository.getGRNById(id);

        if (!grn) {
            throw ApiError.notFound('GRN not found');
        }

        return grn;
    }

    /**
     * Get GRNs by PO
     */
    async getGRNsByPO(poId) {
        return await grnRepository.getGRNsByPOId(poId);
    }

    /**
     * Get GRNs with filters
     */
    async getGRNs(filters) {
        return await grnRepository.getGRNs(filters);
    }

    // ========== HELPER METHODS ==========

    /**
     * Recalculate GRN totals
     */
    async recalculateGRNTotals(grnId) {
        const grn = await grnRepository.getGRNById(grnId);

        let subtotal = 0;
        let taxAmount = 0;

        for (const item of grn.items) {
            // Skip parent items that have been split (only count actual batches)
            if (item.isSplit) {
                continue;
            }

            const discountType = item.discountType || 'BEFORE_GST';

            if (discountType === 'AFTER_GST') {
                // After GST: Calculate gross + tax, then apply discount
                const grossAmount = item.receivedQty * item.unitPrice;
                const tax = grossAmount * (item.gstPercent / 100);
                const subtotalWithTax = grossAmount + tax;
                const discountAmount = subtotalWithTax * ((item.discountPercent || 0) / 100);

                // For totals, we need to separate base and tax
                // Approximate: distribute discount proportionally
                const discountRatio = 1 - ((item.discountPercent || 0) / 100);
                subtotal += grossAmount * discountRatio;
                taxAmount += tax * discountRatio;
            } else {
                // Before GST: Apply discount first, then GST
                const netAmount = item.receivedQty * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
                const tax = netAmount * (item.gstPercent / 100);

                subtotal += netAmount;
                taxAmount += tax;
            }
        }

        const total = subtotal + taxAmount;

        await grnRepository.updateGRN(grnId, {
            subtotal,
            taxAmount,
            total
        });

        return { subtotal, taxAmount, total };
    }

    /**
     * Auto-detect discrepancy
     */
    async autoDetectDiscrepancy(grnId, itemId, expectedQty, actualQty) {
        if (expectedQty === actualQty) {
            return null;
        }

        // Check if discrepancy already exists for this item
        const grn = await grnRepository.getGRNById(grnId);
        const existingDiscrepancy = grn.discrepancies?.find(d => d.grnItemId === itemId);

        if (existingDiscrepancy) {
            return null; // Don't create duplicate
        }

        const reason = actualQty < expectedQty ? 'SHORTAGE' : 'OVERAGE';
        const discrepancyQty = Math.abs(expectedQty - actualQty);

        return await grnRepository.recordDiscrepancy({
            grnId,
            grnItemId: itemId,
            reason,
            expectedQty,
            actualQty,
            discrepancyQty,
            description: `Auto-detected ${reason.toLowerCase()}: Expected ${expectedQty}, Received ${actualQty}`
        });
    }
}

module.exports = new GRNService();

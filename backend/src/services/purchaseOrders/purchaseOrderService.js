const purchaseOrderRepository = require('../../repositories/purchaseOrderRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const { normalizeGSTRate } = require('../../utils/gst-utils');
const { GSTEventType } = require('../../lib/gst/GSTEngine');
const gstEventBus = require('../../lib/gst/GSTEventBus');
const drugRepository = require('../../repositories/drugRepository');

/**
 * Purchase Order Service - Business logic for PO management
 */
class PurchaseOrderService {
    /**
     * Get all suppliers
     */
    async getSuppliers(filters) {
        return await purchaseOrderRepository.findSuppliers(filters);
    }

    /**
     * Get supplier by ID
     */
    async getSupplierById(id, storeId) {
        const supplier = await purchaseOrderRepository.findSupplierById(id);

        if (!supplier) {
            throw ApiError.notFound('Supplier not found');
        }

        if (storeId && supplier.storeId && supplier.storeId !== storeId) {
            throw ApiError.forbidden('Access to this supplier is denied');
        }

        return supplier;
    }

    /**
     * Create supplier
     */
    async createSupplier(supplierData) {
        const supplier = await purchaseOrderRepository.createSupplier(supplierData);
        logger.info(`Supplier created: ${supplier.name} (ID: ${supplier.id})`);

        return supplier;
    }

    /**
     * Update supplier
     */
    async updateSupplier(id, supplierData) {
        const existingSupplier = await purchaseOrderRepository.findSupplierById(id);

        if (!existingSupplier) {
            throw ApiError.notFound('Supplier not found');
        }

        const supplier = await purchaseOrderRepository.updateSupplier(id, supplierData);
        logger.info(`Supplier updated: ${supplier.name} (ID: ${supplier.id})`);

        return supplier;
    }

    /**
     * Get all purchase orders
     */
    async getPurchaseOrders(filters) {
        return await purchaseOrderRepository.findPurchaseOrders(filters);
    }

    /**
     * Get PO by ID
     */
    async getPOById(id, storeId) {
        const po = await purchaseOrderRepository.findPOById(id);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        if (storeId && po.storeId !== storeId) {
            throw ApiError.forbidden('Access to this purchase order is denied');
        }

        // Transform attachments to convert BigInt to Number for JSON serialization
        if (po.attachments && po.attachments.length > 0) {
            po.attachments = po.attachments.map(att => ({
                ...att,
                originalSize: Number(att.originalSize),
                compressedSize: Number(att.compressedSize),
            }));
        }

        return po;
    }

    /**
     * Create purchase order
     */
    async createPO(poData) {
        const { items, ...poInfo } = poData;

        // Generate PO number
        const poNumber = await purchaseOrderRepository.generatePONumber(poInfo.storeId);

        // Create PO
        const result = await purchaseOrderRepository.createPO(
            { ...poInfo, poNumber, status: 'DRAFT' },
            items
        );

        // logger.info(`Purchase order created: ${poNumber} - Total: ${poInfo.total}`);

        return {
            ...result.po,
            items: result.items,
        };
    }

    /**
     * Update purchase order
     */
    async updatePO(id, poData) {
        const { items, ...poInfo } = poData;

        // Check if PO exists
        const existingPO = await purchaseOrderRepository.findPOById(id);
        if (!existingPO) {
            throw ApiError.notFound('Purchase order not found');
        }

        // Check status
        if (existingPO.status !== 'DRAFT') {
            throw ApiError.badRequest('Only draft purchase orders can be updated');
        }

        // Update PO
        const result = await purchaseOrderRepository.updatePO(
            id,
            poInfo,
            items
        );

        logger.info(`Purchase order updated: ${existingPO.poNumber}`);

        return {
            ...result.po,
            items: result.items,
        };
    }

    /**
     * Approve purchase order
     */
    async approvePO(id, approvedBy) {
        const po = await purchaseOrderRepository.findPOById(id);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        if (po.status !== 'PENDING_APPROVAL' && po.status !== 'DRAFT') {
            throw ApiError.badRequest(`Cannot approve PO with status: ${po.status}`);
        }

        const updatedPO = await purchaseOrderRepository.updatePOStatus(id, 'APPROVED', approvedBy);
        logger.info(`Purchase order approved: ${po.poNumber} by ${approvedBy}`);

        return updatedPO;
    }

    /**
     * Send purchase order to supplier
     */
    async sendPO(id) {
        const po = await purchaseOrderRepository.findPOById(id);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        if (po.status !== 'APPROVED' && po.status !== 'DRAFT') {
            throw ApiError.badRequest('Only draft or approved POs can be sent');
        }

        const updatedPO = await purchaseOrderRepository.updatePOStatus(id, 'SENT');
        // logger.info(`Purchase order sent: ${po.poNumber}`);

        return updatedPO;
    }

    /**
     * Create PO receipt
     */
    async createReceipt(receiptData) {
        const po = await purchaseOrderRepository.findPOById(receiptData.poId);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        if (po.status !== 'SENT' && po.status !== 'PARTIALLY_RECEIVED') {
            throw ApiError.badRequest('Can only receive items for sent POs');
        }

        // Add store and supplier info to receipt data
        const enrichedReceiptData = {
            ...receiptData,
            storeId: po.storeId,
            supplierId: po.supplierId,
        };

        const receipt = await purchaseOrderRepository.createReceipt(enrichedReceiptData);
        logger.info(`PO receipt created for ${po.poNumber}`);

        // Emit GST Event (Async)
        try {
            const items = enrichedReceiptData.itemsReceived;
            // Fetch relevant drugs to get HSN codes
            const drugProms = items.map(item => drugRepository.findDrugById(item.drugId));
            const drugs = await Promise.all(drugProms);
            const drugMap = {};
            drugs.forEach(d => { if (d) drugMap[d.id] = d; });

            const gstPayload = {
                eventId: receipt.id,
                storeId: po.storeId,
                date: new Date(), // Receipt Date
                eventType: GSTEventType.PURCHASE,
                supplierState: po.supplier?.state || po.store.state, // Fallback if supplier state missing
                items: items.map(item => ({
                    itemId: item.batchNumber,
                    hsnCode: drugMap[item.drugId]?.hsnCode || '3004', // Default HSN if missing
                    taxableValue: item.quantityReceived * item.purchasePrice,
                    eligibility: 'ELIGIBLE'
                }))
            };

            gstEventBus.emitEvent(GSTEventType.PURCHASE, gstPayload);
        } catch (error) {
            logger.error(`[GST] Failed to emit purchase event for receipt ${receipt.id}`, error);
        }

        return receipt;
    }

    /**
     * Get PO statistics
     */
    async getPOStats(storeId) {
        return await purchaseOrderRepository.getPOStats(storeId);
    }

    /**
     * Validate PO before approval/sending
     */
    async validatePO(poData) {
        const errors = [];
        const warnings = [];

        // Check supplier
        if (!poData.supplier && !poData.supplierId) {
            errors.push('Supplier is required');
        }

        // Check line items
        if (!poData.lines || poData.lines.length === 0) {
            errors.push('At least one line item is required');
        } else {
            poData.lines.forEach((line, index) => {
                if (!line.drugId) {
                    errors.push(`Line ${index + 1}: Drug is required`);
                }
                if (!line.qty || line.qty <= 0) {
                    errors.push(`Line ${index + 1}: Quantity must be greater than 0`);
                }
                if (line.pricePerUnit === undefined || line.pricePerUnit < 0) {
                    errors.push(`Line ${index + 1}: Valid price is required`);
                }
                if (![0, 5, 12, 18, 28].includes(line.gstPercent)) {
                    errors.push(`Line ${index + 1}: GST rate must be 0, 5, 12, 18, or 28`);
                }
            });
        }

        // Check totals
        if (poData.total === undefined || poData.total < 0) {
            errors.push('Valid total amount is required');
        }

        // Validate calculations
        if (poData.lines && poData.lines.length > 0) {
            const calculatedSubtotal = poData.lines.reduce((sum, line) => {
                const lineTotal = line.qty * line.pricePerUnit * (1 - (line.discountPercent || 0) / 100);
                return sum + lineTotal;
            }, 0);

            const calculatedTax = poData.lines.reduce((sum, line) => {
                const lineNet = line.qty * line.pricePerUnit * (1 - (line.discountPercent || 0) / 100);
                const tax = lineNet * (line.gstPercent / 100);
                return sum + tax;
            }, 0);

            const calculatedTotal = calculatedSubtotal + calculatedTax;

            // Allow small rounding differences (0.01)
            if (Math.abs(calculatedSubtotal - poData.subtotal) > 0.01) {
                warnings.push('Subtotal calculation mismatch - please verify');
            }

            if (Math.abs(calculatedTotal - poData.total) > 0.01) {
                warnings.push('Total calculation mismatch - please verify');
            }
        }

        // Check supplier credit limit if available
        if (poData.supplierId) {
            try {
                const supplier = await purchaseOrderRepository.findSupplierById(poData.supplierId);
                if (supplier && supplier.creditLimit && poData.total > supplier.creditLimit) {
                    warnings.push(`PO total (₹${poData.total}) exceeds supplier credit limit (₹${supplier.creditLimit})`);
                }
            } catch (error) {
                logger.warn('Could not check supplier credit limit', error);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Request approval for PO
     */
    async requestApproval({ poId, requestedBy, approvers, note }) {
        const po = await purchaseOrderRepository.findPOById(poId);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        if (po.status !== 'DRAFT') {
            throw ApiError.badRequest(`Cannot request approval for PO with status: ${po.status}`);
        }

        // Update PO status to PENDING_APPROVAL
        const updatedPO = await purchaseOrderRepository.updatePOStatus(poId, 'PENDING_APPROVAL');

        // TODO: Send notification to approvers (email/WhatsApp)
        // For MVP, we'll just log it
        logger.info(`Approval requested for PO ${po.poNumber} by ${requestedBy}. Approvers: ${approvers.join(', ')}`);

        return {
            po: updatedPO,
            message: 'Approval request sent',
            approvers
        };
    }

    /**
     * Get inventory suggestions (simple threshold-based for MVP)
     */
    async getInventorySuggestions({ storeId, limit = 100 }) {
        const drugRepository = require('../../repositories/drugRepository');

        const suggestions = await drugRepository.getDrugsNeedingReorder(storeId);

        // Limit results
        return suggestions.slice(0, limit);
    }

    /**
     * Calculate PO totals (lightweight, no DB access)
     * For real-time local calculations in the UI
     */
    calculateTotals(lines) {
        if (!lines || lines.length === 0) {
            return {
                subtotal: 0,
                taxBreakdown: [],
                total: 0
            };
        }

        // Calculate subtotal
        const subtotal = lines.reduce((sum, line) => {
            const lineNet = line.qty * line.pricePerUnit * (1 - (line.discountPercent || 0) / 100);
            return sum + lineNet;
        }, 0);

        // Calculate tax breakdown by GST rate
        const taxMap = new Map();
        lines.forEach(line => {
            const lineNet = line.qty * line.pricePerUnit * (1 - (line.discountPercent || 0) / 100);
            const tax = lineNet * (line.gstPercent / 100);

            if (taxMap.has(line.gstPercent)) {
                const existing = taxMap.get(line.gstPercent);
                taxMap.set(line.gstPercent, {
                    taxable: existing.taxable + lineNet,
                    tax: existing.tax + tax
                });
            } else {
                taxMap.set(line.gstPercent, {
                    taxable: lineNet,
                    tax: tax
                });
            }
        });

        const taxBreakdown = Array.from(taxMap.entries()).map(([gstPercent, values]) => ({
            gstPercent,
            ...values
        }));

        const total = subtotal + taxBreakdown.reduce((sum, t) => sum + t.tax, 0);

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            taxBreakdown: taxBreakdown.map(t => ({
                gstPercent: t.gstPercent,
                taxable: Math.round(t.taxable * 100) / 100,
                tax: Math.round(t.tax * 100) / 100
            })),
            total: Math.round(total * 100) / 100,
            calculatedAt: new Date().toISOString()
        };
    }

    /**
     * Bulk enrich items with drug data, last prices, stock levels
     * For bulk-add functionality
     */
    async bulkEnrichItems(items, supplierId) {
        const drugRepository = require('../../repositories/drugRepository');
        const enrichedLines = [];

        for (const item of items) {
            try {
                // Get drug details
                const drug = await drugRepository.findDrugById(item.drugId);

                if (!drug) {
                    logger.warn(`Drug not found: ${item.drugId}`);
                    continue;
                }

                // Get last purchase price for this drug from this supplier
                const lastPO = await purchaseOrderRepository.getLastPurchasePrice(item.drugId, supplierId);

                // Get current stock
                const stock = await drugRepository.getCurrentStock(item.drugId);

                enrichedLines.push({
                    drugId: item.drugId,
                    drugName: `${drug.name}${drug.strength ? ` ${drug.strength}` : ''}${drug.form ? ` ${drug.form}` : ''}`,
                    qty: item.qty,
                    pricePerUnit: item.pricePerUnit || lastPO?.unitPrice || 0,
                    discountPercent: item.discountPercent || 0,
                    gstPercent: normalizeGSTRate(drug.gstRate),
                    packUnit: drug.defaultUnit || 'Strip',
                    packSize: 10, // Default
                    lastPurchasePrice: lastPO?.unitPrice,
                    currentStock: stock || 0
                });
            } catch (error) {
                logger.error(`Failed to enrich item ${item.drugId}:`, error);
            }
        }

        return enrichedLines;
    }

    /**
     * Autosave PO (idempotent, optimistic)
     * Returns immediately, queues DB write
     */
    async autosavePO(id, poData) {
        const existingPO = await purchaseOrderRepository.findPOById(id);

        if (!existingPO) {
            throw ApiError.notFound('Purchase order not found');
        }

        // Only allow autosave for DRAFT status
        if (existingPO.status !== 'DRAFT') {
            throw ApiError.badRequest('Can only autosave draft purchase orders');
        }

        const { items, ...poInfo } = poData;

        // Update PO asynchronously (fire and forget for speed)
        setImmediate(async () => {
            try {
                await purchaseOrderRepository.updatePO(id, poInfo, items);
                logger.info(`PO ${id} autosaved`);
            } catch (error) {
                logger.error(`Autosave failed for PO ${id}:`, error);
            }
        });

        // Return immediately with optimistic response
        return {
            id: existingPO.id,
            poNumber: existingPO.poNumber,
            status: existingPO.status,
            lastSaved: new Date().toISOString(),
            version: (existingPO.version || 0) + 1
        };
    }

    /**
     * Delete purchase order
     * Only allows deletion of DRAFT or SENT orders
     */
    async deletePO(id, storeId) {
        const po = await purchaseOrderRepository.findPOById(id);

        if (!po) {
            throw ApiError.notFound('Purchase order not found');
        }

        // Verify the PO belongs to the user's store
        if (po.storeId !== storeId) {
            throw ApiError.forbidden('You do not have permission to delete this purchase order');
        }

        // Only allow deletion of DRAFT or SENT orders
        if (po.status !== 'DRAFT' && po.status !== 'SENT') {
            throw ApiError.badRequest(`Cannot delete purchase order with status: ${po.status}. Only DRAFT or SENT orders can be deleted.`);
        }

        // Delete the purchase order (cascade will delete items)
        await purchaseOrderRepository.deletePO(id);
        logger.info(`Purchase order deleted: ${po.poNumber} (ID: ${id})`);

        return { success: true };
    }
}

module.exports = new PurchaseOrderService();

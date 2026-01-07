/**
 * Procurement Step Implementations
 * Steps for Purchase Orders and GRN scenarios
 */

import { StepResult, SupplierFixture, ScenarioContext } from '../types';

const purchaseOrderService = require('../../src/services/purchaseOrders/purchaseOrderService');
const supplierService = require('../../src/services/suppliers/supplierService');
const grnService = require('../../src/services/grn/grnService');
const consolidatedInvoiceService = require('../../src/services/consolidatedInvoices/consolidatedInvoiceService');
const prisma = require('../../src/db/prisma');

export const procurementSteps = {
    /**
     * Create a supplier
     */
    async createSupplier(
        ctx: ScenarioContext,
        supplierData: SupplierFixture
    ): Promise<StepResult> {
        try {
            // Use supplierService for supplier creation
            const supplier = await supplierService.createSupplier({
                storeId: ctx.storeId,
                name: supplierData.name,
                category: supplierData.category || 'Distributor',
                status: 'Active',
                contactName: supplierData.contactName,
                phoneNumber: supplierData.phoneNumber,
                email: supplierData.email,
                gstin: supplierData.gstin,
                addressLine1: supplierData.addressLine1,
                city: supplierData.city,
                state: supplierData.state,
                pinCode: supplierData.pinCode
            });

            ctx.set('testSupplier', supplier);
            ctx.set('supplierId', supplier.id);

            return {
                success: true,
                data: supplier,
                duration: 0
            };
        } catch (error: any) {
            console.error('DPFV createSupplier error:', error.message);
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Ensure supplier exists (create if needed)
     */
    async ensureSupplierExists(ctx: ScenarioContext): Promise<any> {
        let supplier = await prisma.supplier.findFirst({
            where: {
                storeId: ctx.storeId,
                status: 'Active',
                deletedAt: null
            }
        });

        if (!supplier) {
            const result = await this.createSupplier(ctx, {
                name: 'DPFV Test Supplier',
                category: 'Distributor',
                contactName: 'Test Contact',
                phoneNumber: '9999999999',
                email: 'supplier@test.com',
                addressLine1: '123 Test Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pinCode: '400001'
            });

            supplier = result.data;
        }

        ctx.set('testSupplier', supplier);
        return supplier;
    },

    /**
     * Create a purchase order
     */
    async createPurchaseOrder(
        ctx: ScenarioContext,
        params: {
            supplierId?: string;
            items: {
                drugId: string;
                quantity: number;
                unitPrice: number;
                gstPercent?: number;
            }[];
        }
    ): Promise<StepResult> {
        try {
            const supplierId = params.supplierId || ctx.get<string>('supplierId');

            // Calculate totals
            let subtotal = 0;
            let taxAmount = 0;

            const items = params.items.map(item => {
                const gst = item.gstPercent || 12;
                const lineTotal = item.quantity * item.unitPrice;
                const tax = lineTotal * (gst / 100);

                subtotal += lineTotal;
                taxAmount += tax;

                // Use field names expected by PO repository
                return {
                    drugId: item.drugId,
                    qty: item.quantity,          // Repository expects 'qty'
                    pricePerUnit: item.unitPrice, // Repository expects 'pricePerUnit'
                    gstPercent: gst,
                    discountPercent: 0,
                    lineNet: lineTotal + tax      // Repository expects 'lineNet'
                };
            });

            const po = await purchaseOrderService.createPO({
                storeId: ctx.storeId,
                supplierId,
                items,
                subtotal,
                taxAmount,
                total: subtotal + taxAmount,
                createdBy: ctx.userId
            });

            ctx.set('purchaseOrder', po);
            ctx.set('poId', po.id);

            return {
                success: true,
                data: po,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Send PO to supplier
     */
    async sendPurchaseOrder(ctx: ScenarioContext, poId?: string): Promise<StepResult> {
        try {
            const id = poId || ctx.get<string>('poId');
            const po = await purchaseOrderService.sendPO(id);

            ctx.set('purchaseOrder', po);

            return {
                success: true,
                data: po,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Initialize GRN from PO
     */
    async initializeGRN(ctx: ScenarioContext, poId?: string): Promise<StepResult> {
        try {
            const id = poId || ctx.get<string>('poId');

            const grn = await grnService.initializeGRN({
                poId: id,
                userId: ctx.userId,
                receivedBy: 'DPFV Test'
            });

            ctx.set('grn', grn);
            ctx.set('grnId', grn.id);

            return {
                success: true,
                data: grn,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Update receiving details for GRN items
     */
    async updateReceivingDetails(
        ctx: ScenarioContext,
        params: {
            grnId?: string;
            itemId: string;
            receivedQty: number;
            batchNumber: string;
            expiryDate: Date;
            mrp: number;
        }
    ): Promise<StepResult> {
        try {
            const grnId = params.grnId || ctx.get<string>('grnId');

            const result = await grnService.updateReceivingDetails({
                grnId,
                itemId: params.itemId,
                details: {
                    receivedQty: params.receivedQty,
                    batchNumber: params.batchNumber,
                    expiryDate: params.expiryDate,
                    mrp: params.mrp
                },
                userId: ctx.userId
            });

            return {
                success: true,
                data: result,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Complete GRN
     */
    async completeGRN(
        ctx: ScenarioContext,
        params?: {
            grnId?: string;
            supplierInvoiceNo?: string;
        }
    ): Promise<StepResult> {
        try {
            const grnId = params?.grnId || ctx.get<string>('grnId');

            const grn = await grnService.completeGRN({
                grnId,
                userId: ctx.userId,
                supplierInvoiceNo: params?.supplierInvoiceNo || `INV-${Date.now()}`,
                supplierInvoiceDate: new Date()
            });

            ctx.set('completedGRN', grn);

            return {
                success: true,
                data: grn,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Approve Purchase Order
     */
    async approvePurchaseOrder(
        ctx: ScenarioContext,
        poId?: string
    ): Promise<StepResult> {
        try {
            const pId = poId || ctx.get<string>('poId');
            const currentUser = ctx.get<any>('currentUser');

            const po = await purchaseOrderService.approvePO(pId, currentUser.id);
            ctx.set('purchaseOrder', po);

            return {
                success: true,
                data: po,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Split GRN Batch
     */
    async splitBatch(ctx: ScenarioContext, itemId: string, splits: any[]): Promise<StepResult> {
        try {
            const grnId = ctx.get<string>('grnId');
            const currentUser = ctx.get<any>('currentUser');

            const newItems = await grnService.splitBatch({
                grnId,
                itemId,
                splitData: splits,
                userId: currentUser.id
            });

            return {
                success: true,
                data: newItems,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Verify stock created from GRN
     */
    async verifyGRNStockCreated(
        ctx: ScenarioContext,
        expectedItems: { drugId: string; batchNumber: string; quantity: number }[]
    ): Promise<StepResult> {
        try {
            const mismatches: string[] = [];

            for (const expected of expectedItems) {
                const batch = await prisma.inventoryBatch.findFirst({
                    where: {
                        storeId: ctx.storeId,
                        drugId: expected.drugId,
                        batchNumber: expected.batchNumber
                    }
                });

                if (!batch) {
                    mismatches.push(`Batch ${expected.batchNumber} not found`);
                } else if (batch.quantityInStock !== expected.quantity) {
                    mismatches.push(
                        `Batch ${expected.batchNumber}: expected ${expected.quantity}, got ${batch.quantityInStock}`
                    );
                }
            }

            return {
                success: mismatches.length === 0,
                data: { mismatches },
                duration: 0,
                error: mismatches.length > 0 ? new Error(mismatches.join('; ')) : undefined
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },
    /**
     * Create Consolidated Invoice
     */
    async createConsolidatedInvoice(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const grnIds = ctx.get<string[]>('grnIdsToConsolidate');
            const currentUser = ctx.get<any>('currentUser');

            if (!grnIds || grnIds.length === 0) {
                throw new Error('No GRNs available to consolidate');
            }

            const invoice = await consolidatedInvoiceService.create({
                storeId: ctx.storeId,
                userId: currentUser.id,
                grnIds: grnIds,
                invoiceNumber: `C-INV-${Date.now()}`,
                invoiceDate: new Date(),
                paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });

            ctx.set('consolidatedInvoice', invoice);

            return {
                success: true,
                data: invoice,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    }
};

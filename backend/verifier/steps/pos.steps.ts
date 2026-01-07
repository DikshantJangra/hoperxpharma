/**
 * POS Step Implementations
 * Steps for Point of Sale scenarios
 */

import { StepResult, SaleItemFixture, ScenarioContext } from '../types';

const saleService = require('../../src/services/sales/saleService');
const prisma = require('../../src/db/prisma');

export const posSteps = {
    /**
     * Create a quick sale (walk-in customer)
     */
    async createQuickSale(
        ctx: ScenarioContext,
        params: {
            items: SaleItemFixture[];
            paymentMethod?: string;
            patientId?: string;
        }
    ): Promise<StepResult> {
        try {
            const storeId = ctx.storeId || ctx.get<any>('currentStore')?.id || ctx.get<string>('storeId');
            
            if (!storeId) {
                throw new Error('storeId is required but not found in context');
            }

            // Calculate total matching backend logic exactly
            let saleTotal = 0;
            params.items.forEach(item => {
                const basePrice = item.mrp * item.quantity;
                const discountAmount = ((item.discount || 0) / 100) * basePrice;
                const taxableAmount = basePrice - discountAmount;
                const gstRate = 12; // Default GST rate
                const gstAmount = (gstRate / 100) * taxableAmount;
                const lineTotal = taxableAmount + gstAmount;
                saleTotal += lineTotal;
            });

            // Apply auto-rounding (backend does Math.round)
            const roundedTotal = Math.round(saleTotal);

            const saleData = {
                storeId,
                patientId: params.patientId || null,
                items: params.items.map(item => ({
                    drugId: item.drugId,
                    batchId: item.batchId,
                    quantity: item.quantity,
                    mrp: item.mrp,
                    discount: item.discount || 0
                })),
                paymentSplits: [
                    {
                        method: params.paymentMethod || 'CASH',
                        amount: roundedTotal
                    }
                ]
            };

            const sale = await saleService.createQuickSale(saleData, ctx.userId);

            ctx.set('sale', sale);
            ctx.set('saleId', sale.id);
            ctx.set('invoiceNumber', sale.invoiceNumber);

            return {
                success: true,
                data: sale,
                duration: 0
            };
        } catch (error: any) {
            console.error('DPFV createQuickSale error:', error.message);
            console.error('DPFV createQuickSale stack:', error.stack?.split('\n').slice(0, 5).join('\n'));
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Get sale by ID
     */
    async getSaleById(ctx: ScenarioContext, saleId?: string): Promise<StepResult> {
        try {
            const id = saleId || ctx.get<string>('saleId');
            const sale = await saleService.getSaleById(id);

            ctx.set('fetchedSale', sale);

            return {
                success: true,
                data: sale,
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
     * Get sale by invoice number
     */
    async getSaleByInvoiceNumber(
        ctx: ScenarioContext,
        invoiceNumber?: string
    ): Promise<StepResult> {
        try {
            const number = invoiceNumber || ctx.get<string>('invoiceNumber');
            const sale = await saleService.getSaleByInvoiceNumber(number);

            return {
                success: true,
                data: sale,
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
     * Verify sale items match cart
     */
    async verifySaleItems(
        ctx: ScenarioContext,
        expectedItems: { drugId: string; quantity: number }[]
    ): Promise<StepResult> {
        try {
            const sale = ctx.get<any>('sale');

            const mismatches: string[] = [];

            for (const expected of expectedItems) {
                const saleItem = sale.items?.find((i: any) => i.drugId === expected.drugId);

                if (!saleItem) {
                    mismatches.push(`Drug ${expected.drugId} not found in sale`);
                } else if (saleItem.quantity !== expected.quantity) {
                    mismatches.push(
                        `Drug ${expected.drugId}: expected qty ${expected.quantity}, got ${saleItem.quantity}`
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
     * Get sales stats
     */
    async getSalesStats(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const stats = await saleService.getSalesStats(ctx.storeId);
            ctx.set('salesStats', stats);

            return {
                success: true,
                data: stats,
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
     * Verify payment splits
     */
    async verifyPaymentSplits(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const sale = ctx.get<any>('sale');

            const paymentTotal = (sale.payments || sale.paymentSplits || []).reduce(
                (sum: number, p: any) => sum + parseFloat(p.amount),
                0
            );
            const saleTotal = parseFloat(sale.total);

            const match = Math.abs(paymentTotal - saleTotal) < 0.01;

            return {
                success: match,
                data: { paymentTotal, saleTotal, diff: paymentTotal - saleTotal },
                duration: 0,
                error: match ? undefined : new Error(
                    `Payment mismatch: paid ${paymentTotal}, sale total ${saleTotal}`
                )
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
     * Create sale draft
     */
    async createDraft(
        ctx: ScenarioContext,
        params: {
            items: SaleItemFixture[];
            patientId?: string;
        }
    ): Promise<StepResult> {
        try {
            const saleDraftService = require('../../src/services/sales/saleDraftService');
            
            const storeId = ctx.storeId || ctx.get<any>('currentStore')?.id || ctx.get<string>('storeId');
            
            if (!storeId) {
                throw new Error('storeId is required but not found in context');
            }

            const draft = await saleDraftService.saveDraft({
                storeId,
                patientId: params.patientId,
                items: params.items,
                createdBy: ctx.userId
            });

            ctx.set('draft', draft);

            return {
                success: true,
                data: draft,
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
     * Verify invoice number format
     */
    async verifyInvoiceFormat(ctx: ScenarioContext): Promise<StepResult> {
        const sale = ctx.get<any>('sale');
        const invoiceNumber = sale.invoiceNumber;

        // Check format: INV-YYMM-SEQ or similar
        const validFormat = invoiceNumber && (
            /^INV-\d{4}-\d+$/.test(invoiceNumber) ||
            /^[A-Z]+-\d+$/.test(invoiceNumber)
        );

        return {
            success: validFormat,
            data: { invoiceNumber, format: validFormat ? 'valid' : 'invalid' },
            duration: 0
        };
    },

    /**
     * Process full refund flow
     */
    async processRefund(ctx: ScenarioContext, saleId?: string): Promise<StepResult> {
        try {
            const saleRefundService = require('../../src/services/sales/saleRefundService');
            const salesService = require('../../src/services/sales/saleService');
            
            const storeId = ctx.storeId || ctx.get<any>('currentStore')?.id || ctx.get<string>('storeId');
            
            if (!storeId) {
                throw new Error('storeId is required but not found in context');
            }

            const id = saleId || ctx.get<any>('sale').id;
            const sale = await salesService.getSaleById(id);

            if (!sale) throw new Error(`Sale ${id} not found`);

            // 1. Initiate
            const refundItems = sale.items.map((item: any) => ({
                saleItemId: item.id,
                quantity: item.quantity,
                reason: 'Customer Return'
            }));

            const initiated = await saleRefundService.initiateRefund(id, {
                items: refundItems,
                reason: 'Defective Product',
                requestedBy: ctx.userId,
                storeId
            });

            // 2. Approve
            const approved = await saleRefundService.approveRefund(initiated.id, ctx.userId);

            // 3. Process
            const processed = await saleRefundService.processRefund(approved.id);

            ctx.set('refund', processed);

            return {
                success: processed.status === 'COMPLETED',
                data: processed,
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

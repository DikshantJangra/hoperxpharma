/**
 * Financial Assertions - Business invariant checks for sales, payments, and GST
 */

import { AssertionResult, ScenarioContext } from '../types';

const prisma = require('../../src/db/prisma');

export const financialAssert = {
    /**
     * INV-002: Payment total must match sale total
     */
    async checkPaymentTotal(ctx: ScenarioContext, saleId?: string): Promise<AssertionResult> {
        const targetSaleId = saleId || ctx.get<string>('saleId');

        const sale = await prisma.sale.findUnique({
            where: { id: targetSaleId },
            include: { paymentSplits: true }
        });

        if (!sale) {
            return {
                passed: false,
                expected: 'Sale exists',
                actual: 'Sale not found',
                message: `Sale ${targetSaleId} not found`
            };
        }

        const paymentTotal = sale.paymentSplits.reduce(
            (sum: number, p: any) => sum + parseFloat(p.amount),
            0
        );
        const saleTotal = parseFloat(sale.total);
        const diff = Math.abs(paymentTotal - saleTotal);

        return {
            passed: diff < 0.01, // Allow 1 paisa tolerance for rounding
            expected: saleTotal,
            actual: paymentTotal,
            message: 'Sum of payment splits must equal sale total'
        };
    },

    /**
     * INV-003: GST calculated correctly
     */
    async checkGSTCalculation(ctx: ScenarioContext, saleId?: string): Promise<AssertionResult> {
        const targetSaleId = saleId || ctx.get<string>('saleId');

        const sale = await prisma.sale.findUnique({
            where: { id: targetSaleId },
            include: { items: true }
        });

        if (!sale) {
            return {
                passed: false,
                expected: 'Sale exists',
                actual: 'Sale not found',
                message: `Sale ${targetSaleId} not found`
            };
        }

        // Calculate expected totals from items
        let expectedCgst = 0;
        let expectedSgst = 0;
        let expectedIgst = 0;

        for (const item of sale.items) {
            expectedCgst += parseFloat(item.cgstAmount || 0);
            expectedSgst += parseFloat(item.sgstAmount || 0);
            expectedIgst += parseFloat(item.igstAmount || 0);
        }

        const actualCgst = parseFloat(sale.cgstAmount || 0);
        const actualSgst = parseFloat(sale.sgstAmount || 0);
        const actualIgst = parseFloat(sale.igstAmount || 0);

        const cgstMatch = Math.abs(expectedCgst - actualCgst) < 0.01;
        const sgstMatch = Math.abs(expectedSgst - actualSgst) < 0.01;
        const igstMatch = Math.abs(expectedIgst - actualIgst) < 0.01;

        // Verify inter/intra state logic
        const hasIgst = actualIgst > 0;
        const hasCgstSgst = actualCgst > 0 || actualSgst > 0;
        const mutuallyExclusive = !(hasIgst && hasCgstSgst);

        const allMatch = cgstMatch && sgstMatch && igstMatch && mutuallyExclusive;

        return {
            passed: allMatch,
            expected: {
                cgst: expectedCgst,
                sgst: expectedSgst,
                igst: expectedIgst,
                mutuallyExclusive: true
            },
            actual: {
                cgst: actualCgst,
                sgst: actualSgst,
                igst: actualIgst,
                mutuallyExclusive
            },
            message: 'GST amounts must match sum of item taxes and be mutually exclusive (CGST+SGST or IGST)'
        };
    },

    /**
     * INV-010: Inter/Intra state GST check
     */
    async checkInterIntraStateGST(
        ctx: ScenarioContext,
        saleId: string,
        customerState: string,
        storeState: string
    ): Promise<AssertionResult> {
        const sale = await prisma.sale.findUnique({
            where: { id: saleId }
        });

        if (!sale) {
            return {
                passed: false,
                expected: 'Sale exists',
                actual: 'Sale not found',
                message: `Sale ${saleId} not found`
            };
        }

        const isInterState = customerState !== storeState;
        const hasIgst = parseFloat(sale.igstAmount || 0) > 0;
        const hasCgstSgst = parseFloat(sale.cgstAmount || 0) > 0 || parseFloat(sale.sgstAmount || 0) > 0;

        const correct = isInterState ? (hasIgst && !hasCgstSgst) : (!hasIgst && hasCgstSgst);

        return {
            passed: correct,
            expected: isInterState ? 'IGST only' : 'CGST+SGST only',
            actual: hasIgst ? 'Has IGST' : 'Has CGST+SGST',
            message: `${isInterState ? 'Inter' : 'Intra'}-state sale must use ${isInterState ? 'IGST' : 'CGST+SGST'}`
        };
    },

    /**
     * INV-007: PO total equals sum of line totals
     */
    async checkPOTotals(ctx: ScenarioContext, poId: string): Promise<AssertionResult> {
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId },
            include: { items: true }
        });

        if (!po) {
            return {
                passed: false,
                expected: 'PO exists',
                actual: 'PO not found',
                message: `PurchaseOrder ${poId} not found`
            };
        }

        const expectedSubtotal = po.items.reduce(
            (sum: number, item: any) => sum + parseFloat(item.lineTotal),
            0
        );
        const actualSubtotal = parseFloat(po.subtotal);

        const match = Math.abs(expectedSubtotal - actualSubtotal) < 0.01;

        return {
            passed: match,
            expected: expectedSubtotal,
            actual: actualSubtotal,
            message: 'PO subtotal must equal sum of line item totals'
        };
    },

    /**
     * SALE-001: Invoice number generated correctly
     */
    async checkInvoiceNumber(ctx: ScenarioContext, saleId: string): Promise<AssertionResult> {
        const sale = await prisma.sale.findUnique({
            where: { id: saleId }
        });

        if (!sale) {
            return {
                passed: false,
                expected: 'Sale exists',
                actual: 'Sale not found',
                message: `Sale ${saleId} not found`
            };
        }

        const hasInvoice = sale.invoiceNumber && sale.invoiceNumber.length > 0;
        const validFormat = sale.invoiceNumber?.match(/^INV-\d{2}\d{2}-\d+$/) !== null ||
            sale.invoiceNumber?.match(/^[A-Z]+-\d+$/) !== null;

        return {
            passed: hasInvoice && validFormat,
            expected: 'Invoice number in valid format (INV-YYMM-SEQ)',
            actual: sale.invoiceNumber || 'No invoice number',
            message: 'Sale must have a valid invoice number'
        };
    },

    /**
     * Verify rounding applied correctly
     */
    async checkRounding(ctx: ScenarioContext, saleId: string): Promise<AssertionResult> {
        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: { items: true }
        });

        if (!sale) {
            return {
                passed: false,
                expected: 'Sale exists',
                actual: 'Sale not found',
                message: `Sale ${saleId} not found`
            };
        }

        const itemsTotal = sale.items.reduce(
            (sum: number, item: any) => sum + parseFloat(item.lineTotal),
            0
        );
        const saleTotal = parseFloat(sale.total);
        const roundOff = parseFloat(sale.roundOff || 0);

        // Expected: itemsTotal + roundOff = saleTotal (within tolerance)
        const expectedTotal = itemsTotal + roundOff;
        const match = Math.abs(expectedTotal - saleTotal) < 0.01;

        // Round off should be at most 0.50
        const roundOffValid = Math.abs(roundOff) <= 0.50;

        return {
            passed: match && roundOffValid,
            expected: { itemsTotal, roundOff: 'within ±0.50', total: 'itemsTotal + roundOff' },
            actual: { itemsTotal, roundOff, saleTotal },
            message: 'Rounding must be applied correctly and within ±0.50'
        };
    }
};

/**
 * Document Step Implementations
 * Steps for generating and verifying documents (PDF, etc.)
 */

import { StepResult, ScenarioContext } from '../types';

const pdfService = require('../../src/services/pdf/pdfService');
const salesService = require('../../src/services/sales/saleService');

export const documentSteps = {
    /**
     * Generate Invoice PDF
     */
    async generateInvoicePdf(ctx: ScenarioContext, saleId?: string): Promise<StepResult> {
        try {
            const id = saleId || ctx.get<any>('sale')?.id;
            if (!id) throw new Error('Sale ID required for PDF generation');

            // PDF Service usually needs full sale object with relations
            const sale = await salesService.getSaleById(id);

            const startTime = Date.now();
            const pdfBuffer = await pdfService.generateSaleInvoicePdf(sale);
            const duration = Date.now() - startTime;

            ctx.set('pdfBuffer', pdfBuffer);

            return {
                success: Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0,
                data: { size: pdfBuffer.length },
                duration
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
     * Verify PDF Content (Mock/Basic check)
     */
    async verifyPdfContent(ctx: ScenarioContext, minSize: number = 1000): Promise<StepResult> {
        try {
            const buffer = ctx.get<Buffer>('pdfBuffer');

            if (!buffer) throw new Error('No PDF buffer found in context');

            const size = buffer.length;
            const isPdf = buffer.lastIndexOf('%PDF-') === 0 || buffer.indexOf('%PDF-') === 0;

            return {
                success: isPdf && size > minSize,
                data: { size, isPdf },
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

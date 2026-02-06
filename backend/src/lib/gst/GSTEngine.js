
const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

const GSTEventType = {
    SALE: 'SALE',
    PURCHASE: 'PURCHASE',
    SALE_RETURN: 'SALE_RETURN',
    PURCHASE_RETURN: 'PURCHASE_RETURN',
    EXPENSE: 'EXPENSE',
    STOCK_TRANSFER: 'STOCK_TRANSFER',
    WRITEOFF: 'WRITEOFF'
};

const GSTItcStatus = {
    INELIGIBLE: 'INELIGIBLE',
    PROVISIONAL: 'PROVISIONAL',
    CONFIRMED: 'CONFIRMED',
    REVERSED: 'REVERSED',
    BLOCKED: 'BLOCKED'
};

class GSTEngine {

    /**
     * Calculates tax split based on location (Intra-state vs Inter-state)
     * @param {number|Decimal} taxableValue 
     * @param {number|Decimal} rate 
     * @param {string} sourceState 
     * @param {string} destState 
     */
    static calculateTax(taxableValue, rate, sourceState, destState) {
        const val = new Decimal(taxableValue);
        const r = new Decimal(rate);
        const isInterState = sourceState.toLowerCase() !== destState.toLowerCase();

        let cgst = new Decimal(0);
        let sgst = new Decimal(0);
        let igst = new Decimal(0);
        let cess = new Decimal(0);

        if (isInterState) {
            igst = val.times(r).dividedBy(100);
        } else {
            const halfRate = r.dividedBy(2);
            cgst = val.times(halfRate).dividedBy(100);
            sgst = val.times(halfRate).dividedBy(100);
        }

        return {
            cgst,
            sgst,
            igst,
            cess,
            taxableValue: val,
            totalTax: cgst.plus(sgst).plus(igst).plus(cess)
        };
    }

    /**
     * Process a Sale Event and write to Ledger
     * @param {import('./types').GSTSaleEvent} event 
     */
    static async processSale(event) {
        const store = await prisma.store.findUnique({
            where: { id: event.storeId },
            select: { state: true }
        });

        if (!store) throw new Error(`Store not found: ${event.storeId}`);

        const entries = [];

        for (const item of event.items) {
            const hsnRecord = await prisma.hsnCode.findFirst({
                where: { code: item.hsnCode, storeId: event.storeId },
                include: { taxSlab: true }
            });

            const rate = hsnRecord?.taxSlab?.rate || 0;

            const taxResult = this.calculateTax(
                item.taxableValue,
                rate,
                store.state,
                event.customerState || store.state
            );

            entries.push({
                storeId: event.storeId,
                date: event.date,
                eventId: event.eventId,
                eventType: GSTEventType.SALE,
                hsnCode: item.hsnCode,
                taxableValue: taxResult.taxableValue,
                cgstAmount: taxResult.cgst,
                sgstAmount: taxResult.sgst,
                igstAmount: taxResult.igst,
                cessAmount: taxResult.cess,
                cessAmount: taxResult.cess,
                itcEligible: false,
                itcStatus: GSTItcStatus.INELIGIBLE,
                placeOfSupply: event.customerState || store.state
            });
        }

        if (entries.length > 0) {
            await prisma.gSTLedgerEntry.createMany({
                data: entries
            });
        }

        return entries;
    }

    /**
     * Process a Purchase Event
     * @param {import('./types').GSTPurchaseEvent} event 
     */
    static async processPurchase(event) {
        const store = await prisma.store.findUnique({
            where: { id: event.storeId },
            select: { state: true }
        });

        if (!store) throw new Error(`Store not found: ${event.storeId}`);

        const entries = [];

        for (const item of event.items) {
            const hsnRecord = await prisma.hsnCode.findFirst({
                where: { code: item.hsnCode, storeId: event.storeId },
                include: { taxSlab: true }
            });
            const rate = hsnRecord?.taxSlab?.rate || 0;

            const taxResult = this.calculateTax(
                item.taxableValue,
                rate,
                event.supplierState || store.state,
                store.state
            );

            entries.push({
                storeId: event.storeId,
                date: event.date,
                eventId: event.eventId,
                eventType: GSTEventType.PURCHASE,
                hsnCode: item.hsnCode,
                taxableValue: taxResult.taxableValue,
                cgstAmount: taxResult.cgst,
                sgstAmount: taxResult.sgst,
                igstAmount: taxResult.igst,
                cessAmount: taxResult.cess,
                itcEligible: item.eligibility !== 'BLOCKED' && item.eligibility !== 'INELIGIBLE',
                itcEligible: item.eligibility !== 'BLOCKED' && item.eligibility !== 'INELIGIBLE',
                itcStatus: GSTItcStatus.PROVISIONAL,
                placeOfSupply: store.state
            });
        }

        if (entries.length > 0) {
            await prisma.gSTLedgerEntry.createMany({
                data: entries
            });
        }

        return entries;
    }
}

module.exports = { GSTEngine, GSTEventType, GSTItcStatus };

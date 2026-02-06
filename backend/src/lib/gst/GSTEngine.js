
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

    /**
     * Process a Return Event (Credit Note)
     * Effectively reverses the output liability of a Sale
     * @param {import('./types').GSTSaleEvent} event 
     */
    static async processReturn(event) {
        console.log('[GSTEngine] processReturn started for store:', event.storeId);
        const store = await prisma.store.findUnique({
            where: { id: event.storeId },
            select: { state: true }
        });

        if (!store) {
            console.error('[GSTEngine] Store not found:', event.storeId);
            throw new Error(`Store not found: ${event.storeId}`);
        }

        const entries = [];
        console.log('[GSTEngine] Processing items:', event.items.length);

        for (const item of event.items) {
            const hsnRecord = await prisma.hsnCode.findFirst({
                where: { code: item.hsnCode, storeId: event.storeId },
                include: { taxSlab: true }
            });

            const rate = hsnRecord?.taxSlab?.rate || 0;

            const taxResult = this.calculateTax(
                item.taxableValue, // Positive value passed, will be negated logic-wise by eventType
                rate,
                store.state,
                event.customerState || store.state
            );

            // For Returns, we create entries with negative values OR specific return type
            // GSTR-1 requires Credit Notes to be listed separately, so we keep positive values
            // but mark as SALE_RETURN. The Report Generator will handle the subtraction.

            entries.push({
                storeId: event.storeId,
                date: event.date,
                eventId: event.eventId, // Credit Note Id
                eventType: GSTEventType.SALE_RETURN,
                hsnCode: item.hsnCode,
                taxableValue: taxResult.taxableValue,
                cgstAmount: taxResult.cgst,
                sgstAmount: taxResult.sgst,
                igstAmount: taxResult.igst,
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
     * Process a Stock Write-off Event (Lost/Destroyed Goods)
     * Requires reversal of ITC if previously claimed
     * @param {import('./types').GSTWriteOffEvent} event 
     */
    static async processWriteOff(event) {
        console.log('[GSTEngine] processWriteOff started for store:', event.storeId);
        const store = await prisma.store.findUnique({
            where: { id: event.storeId },
            select: { state: true }
        });

        if (!store) {
            console.error('[GSTEngine] Store not found:', event.storeId);
            throw new Error(`Store not found: ${event.storeId}`);
        }

        const entries = [];
        console.log('[GSTEngine] Processing items:', event.items.length);

        for (const item of event.items) {
            // Find applicable tax rate to calculate Reversal Amount
            // ideally we should trace back to original purchase, but here we estimate using current rate
            const hsnRecord = await prisma.hsnCode.findFirst({
                where: { code: item.hsnCode, storeId: event.storeId },
                include: { taxSlab: true }
            });

            const rate = hsnRecord?.taxSlab?.rate || 0;

            // Calculate tax to be reversed
            // Input Tax Credit Reversal means we are paying back the tax we claimed
            // It behaves like an Output Liability for tracking purposes or specifically negative ITC

            const taxResult = this.calculateTax(
                item.taxableValue,
                rate,
                store.state, // Source and Dest are same for write-off (Internal)
                store.state
            );

            entries.push({
                storeId: event.storeId,
                date: event.date,
                eventId: event.eventId,
                eventType: GSTEventType.WRITEOFF, // Mapped to ITC Reversal in Reports
                hsnCode: item.hsnCode,
                taxableValue: taxResult.taxableValue,
                cgstAmount: taxResult.cgst, // Amount to reverse
                sgstAmount: taxResult.sgst,
                igstAmount: taxResult.igst,
                cessAmount: taxResult.cess,
                itcEligible: false,
                itcStatus: GSTItcStatus.REVERSED, // Critical Status
                placeOfSupply: store.state
            });
        }

        console.log('[GSTEngine] Saving entries count:', entries.length);

        if (entries.length > 0) {
            await prisma.gSTLedgerEntry.createMany({
                data: entries
            });
            console.log('[GSTEngine] Saved successfully');
        }

        return entries;
    }
}

module.exports = { GSTEngine, GSTEventType, GSTItcStatus };

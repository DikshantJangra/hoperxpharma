
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../../config/logger');

class GSTFilingService {

    /**
     * Generate GSTR-1 Data for a given month
     * @param {string} storeId 
     * @param {string} month YYYY-MM
     */
    async generateGSTR1(storeId, month) {
        try {
            const [year, m] = month.split('-');
            const startDate = new Date(year, m - 1, 1);
            const endDate = new Date(year, m, 0, 23, 59, 59);

            // Fetch Ledger Entries for Sales
            const entries = await prisma.gSTLedgerEntry.findMany({
                where: {
                    storeId,
                    eventType: 'SALE',
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            // Group by Event ID (Invoice) to determine B2B/B2C
            // Since we don't have direct B2B flag in Ledger, we might need to query Sales.
            // Optimization: Fetch all sales for these entries
            const saleIds = [...new Set(entries.map(e => e.eventId))];

            // Fetch Sales with Customer details to check for GSTIN
            const sales = await prisma.sale.findMany({
                where: {
                    id: { in: saleIds }
                },
                include: {
                    customer: true // Assuming customer has GSTIN
                }
            });

            const saleMap = {};
            sales.forEach(s => saleMap[s.id] = s);

            // Buckets
            const b2b = [];
            const b2cl = [];
            const b2cs = {}; // Key: "State-Rate", Value: Aggregated
            const hsnSummary = {};

            // Process Entries
            for (const entry of entries) {
                const sale = saleMap[entry.eventId];
                const isB2B = sale?.customer?.gstin ? true : false; // Naive check
                const invoiceVal = Number(entry.taxableValue) + Number(entry.cgstAmount) + Number(entry.sgstAmount) + Number(entry.igstAmount) + Number(entry.cessAmount);
                const isInterState = Number(entry.igstAmount) > 0;

                // HSN Summary
                if (!hsnSummary[entry.hsnCode]) {
                    hsnSummary[entry.hsnCode] = {
                        hsnCode: entry.hsnCode,
                        description: 'Pharma Goods', // Placeholder
                        uqc: 'OTH',
                        totalQuantity: 0,
                        taxableValue: 0,
                        cgst: 0,
                        sgst: 0,
                        igst: 0,
                        cess: 0
                    };
                }
                const hsn = hsnSummary[entry.hsnCode];
                hsn.taxableValue += Number(entry.taxableValue);
                hsn.cgst += Number(entry.cgstAmount);
                hsn.sgst += Number(entry.sgstAmount);
                hsn.igst += Number(entry.igstAmount);
                hsn.cess += Number(entry.cessAmount);

                if (isB2B) {
                    // Add to B2B List (Invoice Level)
                    // TODO: Aggregation logic for B2B lines into single invoice object
                } else {
                    // B2C
                    if (isInterState && invoiceVal > 250000) {
                        // B2C Large
                        b2cl.push({
                            invoiceNumber: sale?.invoiceNumber,
                            date: sale?.createdAt,
                            value: invoiceVal,
                            placeOfSupply: entry.placeOfSupply,
                            rate: 0, // Need to derive rate from amounts
                            taxableValue: Number(entry.taxableValue)
                        });
                    } else {
                        // B2C Small (Aggregated by State & Rate)
                        // Rate derivation: (Tax / Taxable) * 100
                        const totalTax = Number(entry.cgstAmount) + Number(entry.sgstAmount) + Number(entry.igstAmount);
                        const rate = Number(entry.taxableValue) > 0 ? (totalTax / Number(entry.taxableValue)) * 100 : 0;
                        const roundedRate = Math.round(rate);

                        const key = `${entry.placeOfSupply}-${roundedRate}`;

                        if (!b2cs[key]) {
                            b2cs[key] = {
                                placeOfSupply: entry.placeOfSupply,
                                rate: roundedRate,
                                taxableValue: 0,
                                cess: 0,
                                tax: 0
                            };
                        }

                        b2cs[key].taxableValue += Number(entry.taxableValue);
                        b2cs[key].tax += totalTax;
                        b2cs[key].cess += Number(entry.cessAmount);
                    }
                }
            }

            return {
                period: { from: startDate, to: endDate },
                b2b: { invoices: b2b, count: b2b.length, totalValue: 0 },
                b2cLarge: { invoices: b2cl, count: b2cl.length, totalValue: 0 },
                b2cSmall: {
                    summary: Object.values(b2cs),
                    count: Object.keys(b2cs).length,
                    totalValue: Object.values(b2cs).reduce((acc, curr) => acc + curr.taxableValue + curr.tax + curr.cess, 0)
                },
                hsnSummary: Object.values(hsnSummary)
            };

        } catch (error) {
            logger.error('[GSTFilingService] Failed to generate GSTR-1', error);
            throw error;
        }
    }

    /**
     * Generate GSTR-3B Data (Summary)
     * @param {string} storeId 
     * @param {string} month YYYY-MM
     */
    async generateGSTR3B(storeId, month) {
        try {
            const [year, m] = month.split('-');
            const startDate = new Date(year, m - 1, 1);
            const endDate = new Date(year, m, 0, 23, 59, 59);

            // Fetch Sales and Purchases
            const entries = await prisma.gSTLedgerEntry.findMany({
                where: {
                    storeId,
                    date: { gte: startDate, lte: endDate }
                }
            });

            const summary = {
                outwardSupplies: { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
                interStateSupplies: { taxableValue: 0, igst: 0 },
                inputTaxCredit: { cgst: 0, sgst: 0, igst: 0, cess: 0, note: 'From Purchase Entries' },
                taxPayable: { cgst: 0, sgst: 0, igst: 0, cess: 0 }, // Net = Output - Input
                period: { from: startDate, to: endDate }
            };

            for (const entry of entries) {
                if (entry.eventType === 'SALE') {
                    // 3.1 Outward Taxable Supplies
                    summary.outwardSupplies.taxableValue += Number(entry.taxableValue);
                    summary.outwardSupplies.cgst += Number(entry.cgstAmount);
                    summary.outwardSupplies.sgst += Number(entry.sgstAmount);
                    summary.outwardSupplies.igst += Number(entry.igstAmount);
                    summary.outwardSupplies.cess += Number(entry.cessAmount);

                    // 3.2 Inter-State
                    if (Number(entry.igstAmount) > 0) {
                        summary.interStateSupplies.taxableValue += Number(entry.taxableValue);
                        summary.interStateSupplies.igst += Number(entry.igstAmount);
                    }
                } else if (entry.eventType === 'PURCHASE') {
                    // 4. ITC Available
                    if (entry.itcEligible && (entry.itcStatus === 'PROVISIONAL' || entry.itcStatus === 'CONFIRMED')) {
                        summary.inputTaxCredit.cgst += Number(entry.cgstAmount);
                        summary.inputTaxCredit.sgst += Number(entry.sgstAmount);
                        summary.inputTaxCredit.igst += Number(entry.igstAmount);
                        summary.inputTaxCredit.cess += Number(entry.cessAmount);
                    }
                }
            }

            // Calculate Net Payable
            summary.taxPayable.cgst = Math.max(0, summary.outwardSupplies.cgst - summary.inputTaxCredit.cgst);
            summary.taxPayable.sgst = Math.max(0, summary.outwardSupplies.sgst - summary.inputTaxCredit.sgst);
            summary.taxPayable.igst = Math.max(0, summary.outwardSupplies.igst - summary.inputTaxCredit.igst);
            summary.taxPayable.cess = Math.max(0, summary.outwardSupplies.cess - summary.inputTaxCredit.cess);

            return summary;

        } catch (error) {
            logger.error('[GSTFilingService] Failed to generate GSTR-3B', error);
            throw error;
        }
    }
}

module.exports = new GSTFilingService();


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');

class GSTReconciliationService {

    /**
     * Reconcile Purchase Ledger with Uploaded GSTR-2B Data
     * @param {string} storeId 
     * @param {string} month YYYY-MM
     * @param {Array} gstr2bData Array of vendor invoices from government portal
     */
    async reconcileGSTR2B(storeId, month, gstr2bData) {
        try {
            const [year, m] = month.split('-');
            const startDate = new Date(year, m - 1, 1);
            const endDate = new Date(year, m, 0, 23, 59, 59);

            // Fetch Local Purchase Ledger
            const localEntries = await prisma.gSTLedgerEntry.findMany({
                where: {
                    storeId,
                    eventType: 'PURCHASE',
                    date: { gte: startDate, lte: endDate }
                }
            });

            // Group Local Entries by Invoice Number (Event ID usually maps to Receipt/PO, 
            // but for recon we need Supplier Invoice Number. 
            // Assuming we store Supplier Invoice Number in metadata OR using PO ID for now)

            // NOTE: In a real system, we'd need to fetch the underlying PO Receipt 
            // to get the actual "Supplier Invoice Number".
            // For now, we will assume eventId IS key for matching.

            const results = {
                matched: [],
                mismatched: [],
                missingInLocal: [],
                missingInPortal: []
            };

            const localMap = {};
            localEntries.forEach(e => {
                // Aggregating by Event ID (Invoice level recon)
                if (!localMap[e.eventId]) {
                    localMap[e.eventId] = {
                        id: e.eventId,
                        entries: [],
                        totalTax: 0,
                        taxableValue: 0
                    };
                }
                const rec = localMap[e.eventId];
                rec.entries.push(e);
                rec.totalTax += Number(e.cgstAmount) + Number(e.sgstAmount) + Number(e.igstAmount) + Number(e.cessAmount);
                rec.taxableValue += Number(e.taxableValue);
            });

            // Iterate GSTR-2B (Portal Data)
            for (const vendorInv of gstr2bData) {
                const localInv = localMap[vendorInv.invoiceNumber];

                if (localInv) {
                    // Compare Values with small tolerance
                    const diff = Math.abs(localInv.totalTax - vendorInv.totalTax);
                    if (diff < 1.0) {
                        results.matched.push({
                            invoiceNumber: vendorInv.invoiceNumber,
                            supplierName: vendorInv.supplierName,
                            localValue: localInv.totalTax,
                            portalValue: vendorInv.totalTax,
                            status: 'MATCHED'
                        });

                        // Mark as Reconciled in DB
                        await prisma.gSTLedgerEntry.updateMany({
                            where: { eventId: localInv.id },
                            data: {
                                reconciled: true,
                                itcStatus: 'CONFIRMED' // Promote from PROVISIONAL
                            }
                        });

                    } else {
                        results.mismatched.push({
                            invoiceNumber: vendorInv.invoiceNumber,
                            supplierName: vendorInv.supplierName,
                            localValue: localInv.totalTax,
                            portalValue: vendorInv.totalTax,
                            diff: diff,
                            status: 'MISMATCH'
                        });
                    }
                    // Remove from map to track "Missing in Portal"
                    delete localMap[vendorInv.invoiceNumber];
                } else {
                    results.missingInLocal.push({
                        invoiceNumber: vendorInv.invoiceNumber,
                        supplierName: vendorInv.supplierName,
                        portalValue: vendorInv.totalTax,
                        status: 'MISSING_LOCAL'
                    });
                }
            }

            // Remaining in Local Map are missing in Portal
            for (const key in localMap) {
                results.missingInPortal.push({
                    invoiceNumber: key, // This might be PO ID, ideally Supplier Inv No
                    localValue: localMap[key].totalTax,
                    status: 'MISSING_PORTAL'
                });
            }

            return results;

        } catch (error) {
            console.error('[GSTReconciliationService] reconcileGSTR2B Error:', error);
            logger.error('[GSTReconciliationService] Failed to reconcile', error);
            throw error;
        }
    }
}

module.exports = new GSTReconciliationService();

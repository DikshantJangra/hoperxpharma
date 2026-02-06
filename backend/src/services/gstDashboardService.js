
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');
const gstRiskService = require('./gstRiskService');

class GSTDashboardService {
    /**
     * Get Aggregated Dashboard Data
     * @param {string} storeId
     * @param {string} month (YYYY-MM)
     */
    async getDashboardMetrics(storeId, month) {
        try {
            // 1. Determine Date Range
            let startDate, endDate;
            if (month) {
                const [year, m] = month.split('-');
                startDate = new Date(year, m - 1, 1);
                endDate = new Date(year, m, 0, 23, 59, 59);
            } else {
                // Default to current month
                const now = new Date();
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            }

            // 2. Fetch Ledger Entries
            const entries = await prisma.gSTLedgerEntry.findMany({
                where: {
                    storeId,
                    eventType: 'SALE', // Focus on Sales for now
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            // 3. Aggregate Metrics
            let totalSales = 0;
            let taxableAmount = 0;
            let cgstAmount = 0;
            let sgstAmount = 0;
            let igstAmount = 0;
            let cessAmount = 0;
            let zeroRatedCount = 0;
            let zeroRatedTotal = 0;

            // To be implemented accurately, we need to join with Transaction/Sale to know B2B status
            // For now, we trust the ledger aggregation
            // Ideally, GSTLedgerEntry should have a 'transactionType' or 'partyType' field? 
            // Or we check 'igst > 0' as a proxy for Inter-state?

            entries.forEach(entry => {
                const entryTax = Number(entry.cgstAmount) + Number(entry.sgstAmount) + Number(entry.igstAmount) + Number(entry.cessAmount);
                const entryTotal = Number(entry.taxableValue) + entryTax;

                totalSales += entryTotal;
                taxableAmount += Number(entry.taxableValue);
                cgstAmount += Number(entry.cgstAmount);
                sgstAmount += Number(entry.sgstAmount);
                igstAmount += Number(entry.igstAmount);
                cessAmount += Number(entry.cessAmount);

                if (Number(entry.taxableValue) > 0 && entryTax === 0) {
                    zeroRatedCount++;
                    zeroRatedTotal += Number(entry.taxableValue);
                }
            });

            // 4. Get Confidence Score
            const { score, risks } = await gstRiskService.calculateConfidence(storeId);

            return {
                totalSales,
                taxableAmount,
                cgstAmount,
                sgstAmount,
                igstAmount,
                cessAmount,
                totalGstCollected: cgstAmount + sgstAmount + igstAmount + cessAmount,
                totalInvoices: entries.length, // Approximation if multiple entries per invoice
                zeroRatedCount,
                zeroRatedTotal,
                b2bCount: 0, // Need DB migration to track B2B efficiently
                b2cCount: entries.length,
                categoryBreakdown: {
                    'B2C': entries.length
                },
                confidenceScore: score, // NEW
                risks // NEW
            };

        } catch (error) {
            console.error('[GSTDashboardService] getDashboardMetrics Error:', error);
            logger.error('[GSTDashboardService] Failed to get metrics', error);
            throw error;
        }
    }
}

module.exports = new GSTDashboardService();

const prisma = require('../db/prisma');

class GSTReportRepository {
    /**
     * Get GST dashboard data for a month
     */
    async getDashboardData(storeId, startDate, endDate) {
        // Get all sales for the period
        const sales = await prisma.sale.findMany({
            where: {
                storeId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'COMPLETED'
            },
            select: {
                id: true,
                total: true,
                taxableAmount: true,
                cgstAmount: true,
                sgstAmount: true,
                igstAmount: true,
                cessAmount: true,
                taxAmount: true,
                gstrCategory: true,
                buyerGstin: true,
                isIgst: true
            }
        });

        // Aggregate totals
        const totals = sales.reduce((acc, sale) => ({
            totalSales: acc.totalSales + parseFloat(sale.total),
            taxableAmount: acc.taxableAmount + parseFloat(sale.taxableAmount || 0),
            cgstAmount: acc.cgstAmount + parseFloat(sale.cgstAmount || 0),
            sgstAmount: acc.sgstAmount + parseFloat(sale.sgstAmount || 0),
            igstAmount: acc.igstAmount + parseFloat(sale.igstAmount || 0),
            cessAmount: acc.cessAmount + parseFloat(sale.cessAmount || 0),
            totalGstCollected: acc.totalGstCollected + parseFloat(sale.taxAmount || 0)
        }), {
            totalSales: 0,
            taxableAmount: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            cessAmount: 0,
            totalGstCollected: 0
        });

        // Count by category
        const categoryBreakdown = sales.reduce((acc, sale) => {
            const cat = sale.gstrCategory || 'UNKNOWN';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});

        // Exempt/zero-rated sales (taxAmount = 0)
        const zeroRatedSales = sales.filter(s => parseFloat(s.taxAmount || 0) === 0);
        const zeroRatedTotal = zeroRatedSales.reduce((sum, s) => sum + parseFloat(s.total), 0);

        return {
            ...totals,
            totalInvoices: sales.length,
            categoryBreakdown,
            zeroRatedCount: zeroRatedSales.length,
            zeroRatedTotal,
            b2bCount: categoryBreakdown.B2B || 0,
            b2cCount: (categoryBreakdown.B2C_LARGE || 0) + (categoryBreakdown.B2C_SMALL || 0)
        };
    }

    /**
     * Get GSTR-1 summary data
     */
    async getGSTR1Summary(storeId, startDate, endDate) {
        const sales = await prisma.sale.findMany({
            where: {
                storeId,
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED'
            },
            include: {
                items: {
                    include: {
                        drug: true
                    }
                },
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phoneNumber: true
                    }
                }
            }
        });

        // B2B Invoices (with GSTIN)
        const b2bInvoices = sales
            .filter(s => s.buyerGstin && s.buyerGstin.length === 15)
            .map(s => ({
                invoiceNumber: s.invoiceNumber,
                invoiceDate: s.createdAt,
                buyerGstin: s.buyerGstin,
                placeOfSupply: s.placeOfSupply,
                taxableValue: parseFloat(s.taxableAmount || 0),
                cgst: parseFloat(s.cgstAmount || 0),
                sgst: parseFloat(s.sgstAmount || 0),
                igst: parseFloat(s.igstAmount || 0),
                cess: parseFloat(s.cessAmount || 0),
                invoiceValue: parseFloat(s.total)
            }));

        // B2C Large (> ₹2.5L per invoice)
        const b2cLarge = sales
            .filter(s => !s.buyerGstin && parseFloat(s.total) > 250000)
            .map(s => ({
                invoiceNumber: s.invoiceNumber,
                invoiceDate: s.createdAt,
                placeOfSupply: s.placeOfSupply,
                taxableValue: parseFloat(s.taxableAmount || 0),
                cgst: parseFloat(s.cgstAmount || 0),
                sgst: parseFloat(s.sgstAmount || 0),
                igst: parseFloat(s.igstAmount || 0),
                invoiceValue: parseFloat(s.total)
            }));

        // B2C Small - Aggregated
        const b2cSmallSales = sales.filter(s => !s.buyerGstin && parseFloat(s.total) <= 250000);
        const b2cSmallTotal = {
            count: b2cSmallSales.length,
            taxableValue: b2cSmallSales.reduce((sum, s) => sum + parseFloat(s.taxableAmount || 0), 0),
            cgst: b2cSmallSales.reduce((sum, s) => sum + parseFloat(s.cgstAmount || 0), 0),
            sgst: b2cSmallSales.reduce((sum, s) => sum + parseFloat(s.sgstAmount || 0), 0),
            igst: b2cSmallSales.reduce((sum, s) => sum + parseFloat(s.igstAmount || 0), 0),
            totalValue: b2cSmallSales.reduce((sum, s) => sum + parseFloat(s.total), 0)
        };

        // HSN Summary - Aggregate by HSN code
        const hsnSummary = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const hsn = item.hsnCode || 'UNCLASSIFIED';
                if (!hsnSummary[hsn]) {
                    hsnSummary[hsn] = {
                        hsnCode: hsn,
                        description: item.drug?.name || 'N/A',
                        uqc: 'NOS', // Unit Quantity Code
                        totalQuantity: 0,
                        taxableValue: 0,
                        cgst: 0,
                        sgst: 0,
                        igst: 0,
                        cess: 0
                    };
                }
                hsnSummary[hsn].totalQuantity += item.quantity;
                hsnSummary[hsn].taxableValue += parseFloat(item.taxableAmount || 0);
                hsnSummary[hsn].cgst += parseFloat(item.cgstAmount || 0);
                hsnSummary[hsn].sgst += parseFloat(item.sgstAmount || 0);
                hsnSummary[hsn].igst += parseFloat(item.igstAmount || 0);
                hsnSummary[hsn].cess += parseFloat(item.cessAmount || 0);
            });
        });

        return {
            b2b: {
                invoices: b2bInvoices,
                count: b2bInvoices.length,
                totalValue: b2bInvoices.reduce((sum, inv) => sum + inv.invoiceValue, 0)
            },
            b2cLarge: {
                invoices: b2cLarge,
                count: b2cLarge.length,
                totalValue: b2cLarge.reduce((sum, inv) => sum + inv.invoiceValue, 0)
            },
            b2cSmall: b2cSmallTotal,
            hsnSummary: Object.values(hsnSummary),
            period: {
                from: startDate,
                to: endDate
            }
        };
    }

    /**
     * Get GSTR-3B summary data
     */
    async getGSTR3BSummary(storeId, startDate, endDate) {
        const dashboardData = await this.getDashboardData(storeId, startDate, endDate);

        // GSTR-3B focuses on outward supplies and ITC
        // For Phase 1, we only track outward supplies (no ITC yet)
        return {
            outwardSupplies: {
                taxableValue: dashboardData.taxableAmount,
                cgst: dashboardData.cgstAmount,
                sgst: dashboardData.sgstAmount,
                igst: dashboardData.igstAmount,
                cess: dashboardData.cessAmount
            },
            interStateSupplies: {
                // Sales where IGST was applied
                taxableValue: dashboardData.taxableAmount, // Would need to filter IGST sales
                igst: dashboardData.igstAmount
            },
            inputTaxCredit: {
                // Phase 1: Not implemented
                cgst: 0,
                sgst: 0,
                igst: 0,
                cess: 0,
                note: 'ITC tracking not implemented in Phase 1'
            },
            taxPayable: {
                cgst: dashboardData.cgstAmount,
                sgst: dashboardData.sgstAmount,
                igst: dashboardData.igstAmount,
                cess: dashboardData.cessAmount
            },
            period: {
                from: startDate,
                to: endDate
            }
        };
    }

    /**
     * Get monthly trend data for charts
     */
    async getMonthlyTrend(storeId, months = 6) {
        const trends = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const data = await this.getDashboardData(storeId, monthStart, monthEnd);

            trends.push({
                month: monthStart.toISOString().substring(0, 7), // YYYY-MM
                taxableAmount: data.taxableAmount,
                totalGstCollected: data.totalGstCollected,
                invoiceCount: data.totalInvoices
            });
        }

        return trends;
    }
}

module.exports = new GSTReportRepository();

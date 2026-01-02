const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Reports Repository - Database queries for all report types
 */
class ReportsRepository {
    /**
     * Get sales report data with aggregations
     */
    async getSalesReportData(storeId, startDate, endDate) {
        // Get sales summary
        const salesSummary = await prisma.sale.aggregate({
            where: {
                storeId,
                status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                deletedAt: null,
            },
            _sum: {
                total: true,
                subtotal: true,
                taxAmount: true,
                discountAmount: true,
            },
            _count: {
                id: true,
            },
        });

        // Get refunds summary
        const refundsSummary = await prisma.saleRefund.aggregate({
            where: {
                storeId,
                status: 'COMPLETED',
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                refundAmount: true,
            },
            _count: {
                id: true,
            },
        });

        // Get time series data (daily aggregation)
        const timeSeries = await prisma.$queryRaw`
            SELECT 
                DATE("createdAt") as date,
                SUM(total) as revenue,
                COUNT(*) as orders,
                AVG(total) as aov
            FROM "Sale"
            WHERE "storeId" = ${storeId}
                AND status IN ('COMPLETED', 'PARTIALLY_REFUNDED')
                AND "createdAt" >= ${startDate}
                AND "createdAt" <= ${endDate}
                AND "deletedAt" IS NULL
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        `;

        // Get breakdown by SKU (top selling drugs)
        const bySKU = await prisma.saleItem.groupBy({
            by: ['drugId'],
            where: {
                sale: {
                    storeId,
                    status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    deletedAt: null,
                },
            },
            _sum: {
                lineTotal: true,
                quantity: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _sum: {
                    lineTotal: 'desc',
                },
            },
            take: 20,
        });

        // Enrich SKU data with drug details
        const enrichedBySKU = await Promise.all(
            bySKU.map(async (item) => {
                const drug = await prisma.drug.findUnique({
                    where: { id: item.drugId },
                    select: { id: true, name: true, genericName: true },
                });
                return {
                    id: item.drugId,
                    name: drug?.name || 'Unknown',
                    revenue: Number(item._sum.lineTotal || 0),
                    orders: item._count.id,
                    quantity: item._sum.quantity || 0,
                };
            })
        );

        // Get previous period data for comparison
        const periodDuration = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - periodDuration);
        const prevEndDate = new Date(startDate.getTime() - 1);

        const prevSalesSummary = await prisma.sale.aggregate({
            where: {
                storeId,
                status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
                createdAt: {
                    gte: prevStartDate,
                    lte: prevEndDate,
                },
                deletedAt: null,
            },
            _sum: {
                total: true,
            },
            _count: {
                id: true,
            },
        });

        return {
            summary: salesSummary,
            refunds: refundsSummary,
            timeSeries,
            bySKU: enrichedBySKU,
            previous: prevSalesSummary,
        };
    }

    /**
     * Get purchase report data
     */
    async getPurchaseReportData(storeId, startDate, endDate) {
        // Get purchase orders summary
        const poSummary = await prisma.purchaseOrder.aggregate({
            where: {
                storeId,
                status: { in: ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'] },
                orderDate: {
                    gte: startDate,
                    lte: endDate,
                },
                deletedAt: null,
            },
            _sum: {
                total: true,
                subtotal: true,
                taxAmount: true,
            },
            _count: {
                id: true,
            },
        });

        // Get supplier-wise breakdown
        const bySupplier = await prisma.purchaseOrder.groupBy({
            by: ['supplierId'],
            where: {
                storeId,
                status: { in: ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'] },
                orderDate: {
                    gte: startDate,
                    lte: endDate,
                },
                deletedAt: null,
            },
            _sum: {
                total: true,
            },
            _count: {
                id: true,
            },
            _avg: {
                total: true,
            },
            orderBy: {
                _sum: {
                    total: 'desc',
                },
            },
        });

        // Enrich supplier data
        const enrichedBySupplier = await Promise.all(
            bySupplier.map(async (item) => {
                const supplier = await prisma.supplier.findUnique({
                    where: { id: item.supplierId },
                    select: { id: true, name: true, category: true },
                });
                return {
                    supplier: supplier?.name || 'Unknown',
                    category: supplier?.category || 'N/A',
                    amount: Number(item._sum.total || 0),
                    orders: item._count.id,
                    avgOrderValue: Number(item._avg.total || 0),
                };
            })
        );

        // Get top purchased items
        const topItems = await prisma.purchaseOrderItem.groupBy({
            by: ['drugId'],
            where: {
                po: {
                    storeId,
                    status: { in: ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'] },
                    orderDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                    deletedAt: null,
                },
            },
            _sum: {
                lineTotal: true,
                quantity: true,
            },
            orderBy: {
                _sum: {
                    lineTotal: 'desc',
                },
            },
            take: 10,
        });

        // Enrich top items with drug and supplier details
        const enrichedTopItems = await Promise.all(
            topItems.map(async (item) => {
                const drug = await prisma.drug.findUnique({
                    where: { id: item.drugId },
                    select: { id: true, name: true },
                });

                // Get the most recent supplier for this drug
                const recentPO = await prisma.purchaseOrderItem.findFirst({
                    where: { drugId: item.drugId },
                    include: {
                        po: {
                            include: {
                                supplier: {
                                    select: { name: true },
                                },
                            },
                        },
                    },
                    orderBy: {
                        po: {
                            orderDate: 'desc',
                        },
                    },
                });

                return {
                    name: drug?.name || 'Unknown',
                    supplier: recentPO?.po?.supplier?.name || 'N/A',
                    amount: Number(item._sum.lineTotal || 0),
                    qty: item._sum.quantity || 0,
                };
            })
        );

        return {
            summary: poSummary,
            bySupplier: enrichedBySupplier,
            topItems: enrichedTopItems,
        };
    }

    /**
     * Get inventory report data
     */
    async getInventoryReportData(storeId) {
        // Get total inventory value and count
        const inventorySummary = await prisma.inventoryBatch.aggregate({
            where: {
                storeId,
                deletedAt: null,
                quantityInStock: {
                    gt: 0,
                },
            },
            _sum: {
                quantityInStock: true,
            },
            _count: {
                id: true,
            },
        });

        // Calculate total value (need to multiply quantity by purchase price)
        const batches = await prisma.inventoryBatch.findMany({
            where: {
                storeId,
                deletedAt: null,
                quantityInStock: {
                    gt: 0,
                },
            },
            select: {
                quantityInStock: true,
                purchasePrice: true,
                drugId: true,
                drug: {
                    select: {
                        lowStockThreshold: true,
                    },
                },
            },
        });

        const totalValue = batches.reduce((sum, batch) => {
            return sum + (batch.quantityInStock * Number(batch.purchasePrice));
        }, 0);

        // Count low stock items
        const drugStockLevels = batches.reduce((acc, batch) => {
            if (!acc[batch.drugId]) {
                acc[batch.drugId] = {
                    totalStock: 0,
                    threshold: batch.drug.lowStockThreshold || 10,
                };
            }
            acc[batch.drugId].totalStock += batch.quantityInStock;
            return acc;
        }, {});

        const lowStockCount = Object.values(drugStockLevels).filter(
            (drug) => drug.totalStock <= drug.threshold
        ).length;

        // Get category-wise breakdown
        const categoryData = await prisma.$queryRaw`
            SELECT 
                d.form as category,
                COUNT(DISTINCT d.id) as items,
                SUM(ib."quantityInStock" * ib."purchasePrice") as value
            FROM "InventoryBatch" ib
            JOIN "Drug" d ON ib."drugId" = d.id
            WHERE ib."storeId" = ${storeId}
                AND ib."deletedAt" IS NULL
                AND ib."quantityInStock" > 0
            GROUP BY d.form
            ORDER BY value DESC
        `;

        // Calculate turnover ratio (simplified - sales / avg inventory)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesLast30Days = await prisma.sale.aggregate({
            where: {
                storeId,
                status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
                createdAt: {
                    gte: thirtyDaysAgo,
                },
                deletedAt: null,
            },
            _sum: {
                total: true,
            },
        });

        const turnoverRatio = totalValue > 0
            ? ((Number(salesLast30Days._sum.total || 0) / totalValue) * 12).toFixed(1)
            : 0;

        // Calculate per-category turnover based on category sales in the last 30 days
        const enrichedCategoryData = await Promise.all(
            categoryData.map(async (cat) => {
                const catSalesLast30Days = await prisma.$queryRaw`
                    SELECT \n                        SUM(si."lineTotal") as sales
                    FROM "SaleItem" si
                    JOIN "Sale" s ON si."saleId" = s.id
                    JOIN "Drug" d ON si."drugId" = d.id
                    WHERE s."storeId" = ${storeId}
                        AND s.status IN ('COMPLETED', 'PARTIALLY_REFUNDED')
                        AND s."createdAt" >= ${thirtyDaysAgo}
                        AND s."deletedAt" IS NULL
                        AND d.form = ${cat.category}
                `;

                const catSales = catSalesLast30Days[0]?.sales || 0;
                const catTurnover = cat.value > 0
                    ? ((Number(catSales) / cat.value) * 12).toFixed(1)
                    : 0;

                return {
                    category: cat.category || 'Uncategorized',
                    items: Number(cat.items),
                    value: Number(cat.value || 0),
                    turnover: Number(catTurnover),
                };
            })
        );

        return {
            totalValue,
            totalItems: inventorySummary._count.id,
            lowStock: lowStockCount,
            turnoverRatio: Number(turnoverRatio),
            categoryData: enrichedCategoryData,
        };
    }

    /**
     * Get profit report data
     */
    async getProfitReportData(storeId, startDate, endDate) {
        // Get revenue
        const revenue = await prisma.sale.aggregate({
            where: {
                storeId,
                status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                deletedAt: null,
            },
            _sum: {
                total: true,
                subtotal: true,
                taxAmount: true,
            },
        });

        // Calculate COGS from sale items
        const saleItems = await prisma.saleItem.findMany({
            where: {
                sale: {
                    storeId,
                    status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    deletedAt: null,
                },
            },
            include: {
                batch: {
                    select: {
                        purchasePrice: true,
                    },
                },
            },
        });

        const cogs = saleItems.reduce((sum, item) => {
            return sum + (item.quantity * Number(item.batch.purchasePrice));
        }, 0);

        // Get expenses
        const expenses = await prisma.expense.aggregate({
            where: {
                storeId,
                status: { in: ['APPROVED', 'PAID', 'PARTIAL'] },
                invoiceDate: {
                    gte: startDate,
                    lte: endDate,
                },
                deletedAt: null,
            },
            _sum: {
                netAmount: true,
            },
        });

        const totalRevenue = Number(revenue._sum.total || 0);
        const totalCOGS = cogs;
        const totalExpenses = Number(expenses._sum.netAmount || 0);
        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - totalExpenses;
        const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;
        const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

        // Get previous period for growth calculation
        const periodDuration = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - periodDuration);
        const prevEndDate = new Date(startDate.getTime() - 1);

        const prevRevenue = await prisma.sale.aggregate({
            where: {
                storeId,
                status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
                createdAt: {
                    gte: prevStartDate,
                    lte: prevEndDate,
                },
                deletedAt: null,
            },
            _sum: {
                total: true,
            },
        });

        const prevTotalRevenue = Number(prevRevenue._sum.total || 0);
        const revenueGrowth = prevTotalRevenue > 0
            ? (((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100).toFixed(1)
            : 0;

        // Get category breakdown
        const categoryBreakdown = await prisma.$queryRaw`
            SELECT 
                d.form as category,
                SUM(si."lineTotal") as revenue,
                SUM(si.quantity * ib."purchasePrice") as cost
            FROM "SaleItem" si
            JOIN "Sale" s ON si."saleId" = s.id
            JOIN "Drug" d ON si."drugId" = d.id
            JOIN "InventoryBatch" ib ON si."batchId" = ib.id
            WHERE s."storeId" = ${storeId}
                AND s.status IN ('COMPLETED', 'PARTIALLY_REFUNDED')
                AND s."createdAt" >= ${startDate}
                AND s."createdAt" <= ${endDate}
                AND s."deletedAt" IS NULL
            GROUP BY d.form
            ORDER BY revenue DESC
        `;

        const enrichedCategoryBreakdown = categoryBreakdown.map(cat => {
            const catRevenue = Number(cat.revenue || 0);
            const catCost = Number(cat.cost || 0);
            const catProfit = catRevenue - catCost;
            const catMargin = catRevenue > 0 ? ((catProfit / catRevenue) * 100).toFixed(1) : 0;

            return {
                category: cat.category || 'Uncategorized',
                revenue: catRevenue,
                cost: catCost,
                profit: catProfit,
                margin: Number(catMargin),
            };
        });

        // Calculate profit growth compared to previous period
        const prevSaleItems = await prisma.saleItem.findMany({
            where: {
                sale: {
                    storeId,
                    status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
                    createdAt: {
                        gte: prevStartDate,
                        lte: prevEndDate,
                    },
                    deletedAt: null,
                },
            },
            include: {
                batch: {
                    select: {
                        purchasePrice: true,
                    },
                },
            },
        });

        const prevCogs = prevSaleItems.reduce((sum, item) => {
            return sum + (item.quantity * Number(item.batch.purchasePrice));
        }, 0);

        const prevExpenses = await prisma.expense.aggregate({
            where: {
                storeId,
                status: { in: ['APPROVED', 'PAID', 'PARTIAL'] },
                invoiceDate: {
                    gte: prevStartDate,
                    lte: prevEndDate,
                },
                deletedAt: null,
            },
            _sum: {
                netAmount: true,
            },
        });

        const prevGrossProfit = prevTotalRevenue - prevCogs;
        const prevNetProfit = prevGrossProfit - Number(prevExpenses._sum.netAmount || 0);
        const profitGrowth = prevNetProfit > 0
            ? (((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100).toFixed(1)
            : netProfit > 0 ? 100 : 0;

        return {
            revenue: totalRevenue,
            cogs: totalCOGS,
            grossProfit,
            expenses: totalExpenses,
            netProfit,
            grossMargin: Number(grossMargin),
            netMargin: Number(netMargin),
            revenueGrowth: Number(revenueGrowth),
            profitGrowth: Number(profitGrowth),
            categoryBreakdown: enrichedCategoryBreakdown,
        };
    }

    /**
     * Get trends data
     */
    async getTrendsData(storeId, startDate, endDate) {
        // Get monthly sales trend for the past 12 months
        const monthlyTrend = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('month', "createdAt") as month,
                SUM(total) as revenue,
                COUNT(*) as orders
            FROM "Sale"
            WHERE "storeId" = ${storeId}
                AND status IN ('COMPLETED', 'PARTIALLY_REFUNDED')
                AND "createdAt" >= ${startDate}
                AND "createdAt" <= ${endDate}
                AND "deletedAt" IS NULL
            GROUP BY DATE_TRUNC('month', "createdAt")
            ORDER BY month ASC
        `;

        // Get top growing products
        const topGrowingProducts = await prisma.$queryRaw`
            WITH current_period AS (
                SELECT 
                    "drugId",
                    SUM(quantity) as current_qty
                FROM "SaleItem" si
                JOIN "Sale" s ON si."saleId" = s.id
                WHERE s."storeId" = ${storeId}
                    AND s.status IN ('COMPLETED', 'PARTIALLY_REFUNDED')
                    AND s."createdAt" >= ${startDate}
                    AND s."createdAt" <= ${endDate}
                    AND s."deletedAt" IS NULL
                GROUP BY "drugId"
            ),
            previous_period AS (
                SELECT 
                    "drugId",
                    SUM(quantity) as prev_qty
                FROM "SaleItem" si
                JOIN "Sale" s ON si."saleId" = s.id
                WHERE s."storeId" = ${storeId}
                    AND s.status IN ('COMPLETED', 'PARTIALLY_REFUNDED')
                    AND s."createdAt" >= ${new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))}
                    AND s."createdAt" < ${startDate}
                    AND s."deletedAt" IS NULL
                GROUP BY "drugId"
            )
            SELECT 
                cp."drugId",
                cp.current_qty,
                COALESCE(pp.prev_qty, 0) as prev_qty,
                CASE 
                    WHEN COALESCE(pp.prev_qty, 0) > 0 
                    THEN ((cp.current_qty - COALESCE(pp.prev_qty, 0)) / COALESCE(pp.prev_qty, 0) * 100)
                    ELSE 100
                END as growth_rate
            FROM current_period cp
            LEFT JOIN previous_period pp ON cp."drugId" = pp."drugId"
            WHERE cp.current_qty > 0
            ORDER BY growth_rate DESC
            LIMIT 10
        `;

        return {
            monthlyTrend: monthlyTrend.map(m => ({
                month: m.month,
                revenue: Number(m.revenue || 0),
                orders: Number(m.orders || 0),
            })),
            topGrowingProducts,
        };
    }
}

module.exports = new ReportsRepository();

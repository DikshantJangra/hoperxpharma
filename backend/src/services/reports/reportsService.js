const reportsRepository = require('../../repositories/reportsRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * Reports Service - Business logic for report generation
 */

// Helper to safely convert to number and prevent NaN
const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
};

class ReportsService {
    /**
     * Generate sales report
     */
    async generateSalesReport(storeId, filters = {}) {
        const { from, to } = this._parseDateRange(filters);

        logger.info(`Generating sales report for store ${storeId} from ${from} to ${to}`);

        const data = await reportsRepository.getSalesReportData(storeId, from, to);

        // Calculate KPIs
        const revenue = safeNumber(data.summary._sum.total);
        const orders = safeNumber(data.summary._count.id);
        const aov = orders > 0 ? safeNumber(revenue / orders) : 0;
        const refunds = safeNumber(data.refunds._sum.refundAmount);
        const returnRate = revenue > 0 ? safeNumber((refunds / revenue) * 100) : 0;

        // Calculate deltas (comparison with previous period)
        const prevRevenue = safeNumber(data.previous._sum.total);
        const prevOrders = safeNumber(data.previous._count.id);
        const prevAov = prevOrders > 0 ? safeNumber(prevRevenue / prevOrders) : 0;

        const revenueDelta = prevRevenue > 0 ? safeNumber(((revenue - prevRevenue) / prevRevenue) * 100) : 0;
        const ordersDelta = prevOrders > 0 ? safeNumber(((orders - prevOrders) / prevOrders) * 100) : 0;
        const aovDelta = prevAov > 0 ? safeNumber(((aov - prevAov) / prevAov) * 100) : 0;

        // Format time series data
        const series = data.timeSeries.map(item => ({
            date: item.date.toISOString().split('T')[0],
            revenue: safeNumber(item.revenue),
            orders: safeNumber(item.orders),
            aov: safeNumber(item.aov),
            refunds: 0, // TODO: Add refunds to time series
        }));

        // Format breakdown data
        const bySKU = data.bySKU.map((item, index) => ({
            id: item.id,
            name: item.name,
            revenue: safeNumber(item.revenue),
            orders: safeNumber(item.orders),
            delta: 0, // TODO: Calculate delta
            trend: [], // TODO: Add trend data
        }));

        return {
            meta: {
                from: from.toISOString().split('T')[0],
                to: to.toISOString().split('T')[0],
            },
            kpis: {
                revenue,
                orders,
                aov,
                refunds,
                returnRate,
                delta: {
                    revenue: revenueDelta,
                    orders: ordersDelta,
                    aov: aovDelta,
                    refunds: 0,
                },
            },
            series,
            breakdown: {
                byStore: [], // Single store for now
                bySKU,
                byCategory: [], // TODO: Add category breakdown
            },
        };
    }

    /**
     * Generate purchase report
     */
    async generatePurchaseReport(storeId, filters = {}) {
        const { from, to } = this._parseDateRange(filters);

        logger.info(`Generating purchase report for store ${storeId} from ${from} to ${to}`);

        const data = await reportsRepository.getPurchaseReportData(storeId, from, to);

        const totalPurchase = safeNumber(data.summary._sum.total);
        const totalOrders = safeNumber(data.summary._count.id);
        const avgOrderValue = totalOrders > 0 ? safeNumber(totalPurchase / totalOrders) : 0;

        return {
            meta: {
                from: from.toISOString().split('T')[0],
                to: to.toISOString().split('T')[0],
            },
            summary: {
                totalPurchase,
                totalOrders,
                avgOrderValue,
            },
            bySupplier: data.bySupplier.map(s => ({
                ...s,
                amount: safeNumber(s.amount),
                orders: safeNumber(s.orders),
                avgOrderValue: safeNumber(s.avgOrderValue),
            })),
            topItems: data.topItems.map(item => ({
                ...item,
                amount: safeNumber(item.amount),
                qty: safeNumber(item.qty),
            })),
        };
    }

    /**
     * Generate inventory report
     */
    async generateInventoryReport(storeId) {
        logger.info(`Generating inventory report for store ${storeId}`);

        const data = await reportsRepository.getInventoryReportData(storeId);

        return {
            metrics: {
                totalValue: safeNumber(data.totalValue),
                totalItems: safeNumber(data.totalItems),
                lowStock: safeNumber(data.lowStock),
                deadStock: 0, // TODO: Calculate dead stock
                turnoverRatio: safeNumber(data.turnoverRatio),
            },
            categoryData: data.categoryData.map(cat => ({
                ...cat,
                items: safeNumber(cat.items),
                value: safeNumber(cat.value),
                turnover: safeNumber(cat.turnover),
            })),
        };
    }

    /**
     * Generate profit report
     */
    async generateProfitReport(storeId, filters = {}) {
        const { from, to } = this._parseDateRange(filters);

        logger.info(`Generating profit report for store ${storeId} from ${from} to ${to}`);

        const data = await reportsRepository.getProfitReportData(storeId, from, to);

        return {
            meta: {
                from: from.toISOString().split('T')[0],
                to: to.toISOString().split('T')[0],
            },
            profitData: {
                revenue: safeNumber(data.revenue),
                cogs: safeNumber(data.cogs),
                grossProfit: safeNumber(data.grossProfit),
                expenses: safeNumber(data.expenses),
                netProfit: safeNumber(data.netProfit),
                grossMargin: safeNumber(data.grossMargin),
                netMargin: safeNumber(data.netMargin),
                revenueGrowth: safeNumber(data.revenueGrowth),
                profitGrowth: safeNumber(data.profitGrowth),
            },
            categoryBreakdown: data.categoryBreakdown.map(cat => ({
                ...cat,
                revenue: safeNumber(cat.revenue),
                cost: safeNumber(cat.cost),
                profit: safeNumber(cat.profit),
                margin: safeNumber(cat.margin),
            })),
            monthlyTrend: [], // TODO: Add monthly trend
        };
    }

    /**
     * Generate trends report
     */
    async generateTrendsReport(storeId, filters = {}) {
        const { from, to } = this._parseDateRange(filters);

        logger.info(`Generating trends report for store ${storeId} from ${from} to ${to}`);

        const data = await reportsRepository.getTrendsData(storeId, from, to);

        return {
            meta: {
                from: from.toISOString().split('T')[0],
                to: to.toISOString().split('T')[0],
            },
            monthlyTrend: data.monthlyTrend.map(m => ({
                month: m.month,
                revenue: safeNumber(m.revenue),
                orders: safeNumber(m.orders),
            })),
            topGrowingProducts: data.topGrowingProducts.map(p => ({
                drugId: p.drugId,
                currentQty: safeNumber(p.current_qty),
                prevQty: safeNumber(p.prev_qty),
                growthRate: safeNumber(p.growth_rate),
            })),
            insights: this._generateInsights(data),
        };
    }

    /**
     * Parse date range from filters
     */
    _parseDateRange(filters) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        let from, to;

        if (filters.from && filters.to) {
            from = new Date(filters.from);
            to = new Date(filters.to);
            to.setHours(23, 59, 59, 999);
        } else if (filters.dateRange) {
            switch (filters.dateRange) {
                case 'today':
                    from = new Date();
                    from.setHours(0, 0, 0, 0);
                    to = today;
                    break;
                case '7d':
                    from = new Date();
                    from.setDate(from.getDate() - 7);
                    from.setHours(0, 0, 0, 0);
                    to = today;
                    break;
                case '30d':
                    from = new Date();
                    from.setDate(from.getDate() - 30);
                    from.setHours(0, 0, 0, 0);
                    to = today;
                    break;
                case '90d':
                    from = new Date();
                    from.setDate(from.getDate() - 90);
                    from.setHours(0, 0, 0, 0);
                    to = today;
                    break;
                case 'mtd':
                    from = new Date(today.getFullYear(), today.getMonth(), 1);
                    to = today;
                    break;
                case 'lastMonth':
                    from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    to = new Date(today.getFullYear(), today.getMonth(), 0);
                    to.setHours(23, 59, 59, 999);
                    break;
                case 'thisQuarter':
                    const quarter = Math.floor(today.getMonth() / 3);
                    from = new Date(today.getFullYear(), quarter * 3, 1);
                    to = today;
                    break;
                case 'thisYear':
                    from = new Date(today.getFullYear(), 0, 1);
                    to = today;
                    break;
                default:
                    // Default to last 30 days
                    from = new Date();
                    from.setDate(from.getDate() - 30);
                    from.setHours(0, 0, 0, 0);
                    to = today;
            }
        } else {
            // Default to last 30 days
            from = new Date();
            from.setDate(from.getDate() - 30);
            from.setHours(0, 0, 0, 0);
            to = today;
        }

        return { from, to };
    }

    /**
     * Generate insights from trends data
     */
    _generateInsights(data) {
        const insights = [];

        // Analyze monthly trend
        if (data.monthlyTrend && data.monthlyTrend.length >= 2) {
            const recent = data.monthlyTrend[data.monthlyTrend.length - 1];
            const previous = data.monthlyTrend[data.monthlyTrend.length - 2];

            if (recent.revenue > previous.revenue) {
                const growth = ((recent.revenue - previous.revenue) / previous.revenue * 100).toFixed(1);
                insights.push({
                    type: 'positive',
                    title: 'Revenue Growth',
                    message: `Revenue increased by ${growth}% compared to last month`,
                });
            } else if (recent.revenue < previous.revenue) {
                const decline = ((previous.revenue - recent.revenue) / previous.revenue * 100).toFixed(1);
                insights.push({
                    type: 'warning',
                    title: 'Revenue Decline',
                    message: `Revenue decreased by ${decline}% compared to last month`,
                });
            }
        }

        // Analyze growing products
        if (data.topGrowingProducts && data.topGrowingProducts.length > 0) {
            const topGrower = data.topGrowingProducts[0];
            const growthRate = safeNumber(topGrower.growth_rate);
            if (growthRate > 50) {
                insights.push({
                    type: 'info',
                    title: 'Fast Growing Product',
                    message: `Product showing ${growthRate.toFixed(0)}% growth - consider increasing stock`,
                });
            }
        }

        return insights;
    }
}

module.exports = new ReportsService();

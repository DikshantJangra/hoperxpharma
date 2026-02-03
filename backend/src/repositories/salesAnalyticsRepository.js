const { PrismaClient } = require('@prisma/client');
const prisma = require('../db/prisma');

/**
 * Sales Analytics Repository
 * Advanced aggregation queries for enterprise sales reporting
 */
class SalesAnalyticsRepository {
    /**
     * Get KPI metrics with period-over-period comparison
     * @param {Object} params - { storeId, startDate, endDate, compareStartDate, compareEndDate, channel, customerType }
     * @returns {Promise<Object>} KPI metrics with deltas
     */
    async getKPIs({ storeId, startDate, endDate, compareStartDate, compareEndDate, channel, customerType }) {
        const baseFilter = {
            storeId,
            createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
            status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] }
        };

        // Add optional filters
        if (channel) {
            baseFilter.invoiceType = channel; // Map channel to appropriate field
        }

        // Current period metrics
        const currentSales = await prisma.sale.findMany({
            where: baseFilter,
            include: {
                items: true,
                paymentSplits: true,
                patient: true
            }
        });

        // Previous period metrics for comparison
        const compareSales = compareStartDate && compareEndDate ? await prisma.sale.findMany({
            where: {
                ...baseFilter,
                createdAt: { gte: new Date(compareStartDate), lte: new Date(compareEndDate) }
            },
            include: {
                items: true,
                paymentSplits: true
            }
        }) : [];

        // Calculate current period KPIs
        const revenue = currentSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
        const orders = currentSales.length;
        const aov = orders > 0 ? revenue / orders : 0;

        // Get unique customers
        const uniqueCustomers = new Set(currentSales.filter(s => s.patientId).map(s => s.patientId));
        const customers = uniqueCustomers.size;

        // Calculate refunds
        const refunds = currentSales
            .filter(s => s.status === 'PARTIALLY_REFUNDED')
            .reduce((sum, sale) => sum + parseFloat(sale.refundedAmount || 0), 0);

        const totalRefunds = await prisma.saleRefund.aggregate({
            where: {
                storeId,
                createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
                status: 'COMPLETED'
            },
            _sum: {
                refundAmount: true
            }
        });

        const refundAmount = parseFloat(totalRefunds._sum.refundAmount || 0);
        const returnRate = revenue > 0 ? (refundAmount / revenue) * 100 : 0;

        // Calculate comparison period KPIs
        const compareRevenue = compareSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
        const compareOrders = compareSales.length;
        const compareAov = compareOrders > 0 ? compareRevenue / compareOrders : 0;

        // Customer segmentation (new vs returning)
        let newCustomers = 0;
        let returningCustomers = 0;

        for (const customerId of uniqueCustomers) {
            const firstPurchase = await prisma.sale.findFirst({
                where: { patientId: customerId, storeId },
                orderBy: { createdAt: 'asc' },
                select: { createdAt: true }
            });

            if (firstPurchase && firstPurchase.createdAt >= new Date(startDate)) {
                newCustomers++;
            } else {
                returningCustomers++;
            }
        }

        // Calculate deltas
        const revenueDelta = compareRevenue > 0 ? ((revenue - compareRevenue) / compareRevenue) * 100 : 0;
        const ordersDelta = compareOrders > 0 ? ((orders - compareOrders) / compareOrders) * 100 : 0;
        const aovDelta = compareAov > 0 ? ((aov - compareAov) / compareAov) * 100 : 0;

        return {
            revenue: Math.round(revenue * 100) / 100,
            orders,
            aov: Math.round(aov * 100) / 100,
            customers,
            newCustomers,
            returningCustomers,
            refunds: Math.round(refundAmount * 100) / 100,
            returnRate: Math.round(returnRate * 100) / 100,
            delta: {
                revenue: Math.round(revenueDelta * 100) / 100,
                orders: Math.round(ordersDelta * 100) / 100,
                aov: Math.round(aovDelta * 100) / 100
            },
            // Additional metrics
            avgOrdersPerDay: orders / this._getDaysBetween(startDate, endDate),
            avgOrdersPerHour: orders / (this._getDaysBetween(startDate, endDate) * 24)
        };
    }

    /**
     * Get trend data for charts (daily/hourly aggregation)
     * @param {Object} params - { storeId, startDate, endDate, granularity }
     * @returns {Promise<Array>} Time-series data
     */
    async getTrendData({ storeId, startDate, endDate, granularity = 'day' }) {
        const sales = await prisma.sale.findMany({
            where: {
                storeId,
                createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
                status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] }
            },
            select: {
                createdAt: true,
                total: true,
                items: {
                    select: {
                        quantity: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Group by date or hour
        const grouped = {};

        sales.forEach(sale => {
            const key = granularity === 'day'
                ? sale.createdAt.toISOString().split('T')[0]
                : sale.createdAt.toISOString().split(':')[0]; // Hour granularity

            if (!grouped[key]) {
                grouped[key] = {
                    date: key,
                    revenue: 0,
                    orders: 0,
                    items: 0
                };
            }

            grouped[key].revenue += parseFloat(sale.total);
            grouped[key].orders += 1;
            grouped[key].items += sale.items.reduce((sum, item) => sum + item.quantity, 0);
        });

        // Convert to array and calculate AOV
        return Object.values(grouped).map(item => ({
            ...item,
            revenue: Math.round(item.revenue * 100) / 100,
            aov: item.orders > 0 ? Math.round((item.revenue / item.orders) * 100) / 100 : 0
        }));
    }

    /**
     * Get category breakdown
     * @param {Object} params - { storeId, startDate, endDate }
     * @returns {Promise<Array>} Category performance data
     */
    async getCategoryBreakdown({ storeId, startDate, endDate }) {
        const saleItems = await prisma.saleItem.findMany({
            where: {
                sale: {
                    storeId,
                    createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
                    status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] }
                }
            },
            include: {
                drug: {
                    select: {
                        name: true,
                        manufacturer: true,
                        form: true
                    }
                }
            }
        });

        // Group by category
        const categoryMap = {};

        saleItems.forEach(item => {
            const category = item.drug?.form || 'Uncategorized';

            if (!categoryMap[category]) {
                categoryMap[category] = {
                    category,
                    revenue: 0,
                    orders: 0,
                    margin: 0,
                    marginTotal: 0
                };
            }

            const itemRevenue = parseFloat(item.lineTotal);
            const itemMargin = parseFloat(item.mrp) - parseFloat(item.purchasePrice || 0);

            categoryMap[category].revenue += itemRevenue;
            categoryMap[category].orders += 1;
            categoryMap[category].marginTotal += itemMargin * item.quantity;
        });

        // Calculate percentages and margins
        const totalRevenue = Object.values(categoryMap).reduce((sum, cat) => sum + cat.revenue, 0);

        return Object.values(categoryMap)
            .map(cat => ({
                category: cat.category,
                revenue: Math.round(cat.revenue * 100) / 100,
                orders: cat.orders,
                revenueShare: totalRevenue > 0 ? Math.round((cat.revenue / totalRevenue) * 10000) / 100 : 0,
                margin: cat.revenue > 0 ? Math.round((cat.marginTotal / cat.revenue) * 10000) / 100 : 0
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }

    /**
     * Get payment method breakdown
     * @param {Object} params - { storeId, startDate, endDate }
     * @returns {Promise<Array>} Payment method split
     */
    async getPaymentMethodBreakdown({ storeId, startDate, endDate }) {
        const payments = await prisma.paymentSplit.findMany({
            where: {
                sale: {
                    storeId,
                    createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
                    status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] }
                }
            },
            select: {
                paymentMethod: true,
                amount: true
            }
        });

        const methodMap = {};

        payments.forEach(payment => {
            const method = payment.paymentMethod;

            if (!methodMap[method]) {
                methodMap[method] = {
                    method,
                    amount: 0,
                    count: 0
                };
            }

            methodMap[method].amount += parseFloat(payment.amount);
            methodMap[method].count += 1;
        });

        const totalAmount = Object.values(methodMap).reduce((sum, m) => sum + m.amount, 0);

        return Object.values(methodMap)
            .map(m => ({
                method: m.method,
                amount: Math.round(m.amount * 100) / 100,
                count: m.count,
                percentage: totalAmount > 0 ? Math.round((m.amount / totalAmount) * 10000) / 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount);
    }

    /**
     * Get top selling products
     * @param {Object} params - { storeId, startDate, endDate, limit }
     * @returns {Promise<Array>} Top products with performance metrics
     */
    async getTopProducts({ storeId, startDate, endDate, limit = 10 }) {
        const saleItems = await prisma.saleItem.findMany({
            where: {
                sale: {
                    storeId,
                    createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
                    status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] }
                }
            },
            include: {
                drug: {
                    select: {
                        id: true,
                        name: true,
                        manufacturer: true,
                        form: true
                    }
                },
                batch: {
                    select: {
                        batchNumber: true,
                        expiryDate: true
                    }
                }
            }
        });

        // Group by drug
        const drugMap = {};

        saleItems.forEach(item => {
            const drugId = item.drugId;

            if (!drugMap[drugId]) {
                drugMap[drugId] = {
                    drugId,
                    drugName: item.drug?.name || 'Unknown',
                    manufacturer: item.drug?.manufacturer || '-',
                    category: item.drug?.form || '-',
                    revenue: 0,
                    quantity: 0,
                    orders: 0,
                    avgPrice: 0
                };
            }

            drugMap[drugId].revenue += parseFloat(item.lineTotal);
            drugMap[drugId].quantity += item.quantity;
            drugMap[drugId].orders += 1;
        });

        // Get current stock levels
        const topProducts = Object.values(drugMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);

        // Fetch stock levels for top products
        for (const product of topProducts) {
            const stock = await prisma.inventoryBatch.aggregate({
                where: {
                    drugId: product.drugId,
                    storeId,
                    baseUnitQuantity: { gt: 0 }
                },
                _sum: {
                    baseUnitQuantity: true
                }
            });

            product.stockLeft = stock._sum.baseUnitQuantity || 0;
            product.avgPrice = product.orders > 0 ? Math.round((product.revenue / product.quantity) * 100) / 100 : 0;
            product.revenue = Math.round(product.revenue * 100) / 100;

            // Calculate trend (simple: compare to previous period)
            product.trend = 'stable'; // Will be enhanced with historical data
        }

        return topProducts;
    }

    /**
     * Get top customers
     * @param {Object} params - { storeId, startDate, endDate, limit }
     * @returns {Promise<Array>} Top customers with performance metrics
     */
    async getTopCustomers({ storeId, startDate, endDate, limit = 10 }) {
        const sales = await prisma.sale.findMany({
            where: {
                storeId,
                patientId: { not: null },
                createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
                status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] }
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                        loyaltyProfile: {
                            select: {
                                status: true
                            }
                        }
                    }
                }
            }
        });

        // Group by customer
        const customerMap = {};

        sales.forEach(sale => {
            const patientId = sale.patientId;

            if (!customerMap[patientId]) {
                customerMap[patientId] = {
                    customerId: patientId,
                    customerName: sale.patient ? `${sale.patient.firstName} ${sale.patient.lastName}` : 'Unknown',
                    phoneNumber: sale.patient?.phoneNumber || '-',
                    totalSpend: 0,
                    orders: 0,
                    lastVisit: sale.createdAt,
                    loyaltyStatus: sale.patient?.loyaltyProfile?.status || 'NEW'
                };
            }

            customerMap[patientId].totalSpend += parseFloat(sale.total);
            customerMap[patientId].orders += 1;

            if (sale.createdAt > customerMap[patientId].lastVisit) {
                customerMap[patientId].lastVisit = sale.createdAt;
            }
        });

        return Object.values(customerMap)
            .map(c => ({
                ...c,
                totalSpend: Math.round(c.totalSpend * 100) / 100,
                avgOrderValue: c.orders > 0 ? Math.round((c.totalSpend / c.orders) * 100) / 100 : 0
            }))
            .sort((a, b) => b.totalSpend - a.totalSpend)
            .slice(0, limit);
    }

    /**
     * Detect anomalies in sales data
     * @param {Object} params - { storeId, startDate, endDate }
     * @returns {Promise<Array>} Detected anomalies
     */
    async detectAnomalies({ storeId, startDate, endDate }) {
        const anomalies = [];

        // Get daily revenue trend
        const trendData = await this.getTrendData({ storeId, startDate, endDate, granularity: 'day' });

        if (trendData.length > 0) {
            const avgRevenue = trendData.reduce((sum, d) => sum + d.revenue, 0) / trendData.length;
            const stdDev = Math.sqrt(
                trendData.reduce((sum, d) => sum + Math.pow(d.revenue - avgRevenue, 2), 0) / trendData.length
            );

            // Detect spikes/drops (2 standard deviations)
            trendData.forEach(day => {
                if (day.revenue > avgRevenue + (2 * stdDev)) {
                    anomalies.push({
                        type: 'revenue_spike',
                        severity: 'warning',
                        date: day.date,
                        message: `Revenue spike detected: ₹${day.revenue}(${Math.round(((day.revenue - avgRevenue) / avgRevenue) * 100)} % above average)`,
                        value: day.revenue
                    });
                } else if (day.revenue < avgRevenue - (2 * stdDev) && day.revenue > 0) {
                    anomalies.push({
                        type: 'revenue_drop',
                        severity: 'warning',
                        date: day.date,
                        message: `Revenue drop detected: ₹${day.revenue}(${Math.round(((avgRevenue - day.revenue) / avgRevenue) * 100)} % below average)`,
                        value: day.revenue
                    });
                }
            });
        }

        // Check for high refund rate
        const kpis = await this.getKPIs({ storeId, startDate, endDate });
        if (kpis.returnRate > 10) {
            anomalies.push({
                type: 'high_refunds',
                severity: 'critical',
                message: `High refund rate: ${kpis.returnRate} % (₹${kpis.refunds})`,
                value: kpis.returnRate
            });
        }

        // Check for unusual discount usage
        const sales = await prisma.sale.findMany({
            where: {
                storeId,
                createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
                discountAmount: { gt: 0 }
            },
            select: {
                discountAmount: true,
                total: true
            }
        });

        if (sales.length > 0) {
            const totalDiscount = sales.reduce((sum, s) => sum + parseFloat(s.discountAmount), 0);
            const totalRevenue = kpis.revenue + totalDiscount;
            const discountRate = (totalDiscount / totalRevenue) * 100;

            if (discountRate > 15) {
                anomalies.push({
                    type: 'high_discounts',
                    severity: 'warning',
                    message: `Unusual discount usage: ${Math.round(discountRate * 100) / 100
                        }% (₹${Math.round(totalDiscount * 100) / 100})`,
                    value: discountRate
                });
            }
        }

        // Check for zero-sale days for active store
        const daysWithSales = new Set(trendData.map(d => d.date));
        const daysBetween = this._getDaysBetween(startDate, endDate);

        if (daysWithSales.size < daysBetween && daysBetween > 1) {
            anomalies.push({
                type: 'zero_sales',
                severity: 'info',
                message: `${daysBetween - daysWithSales.size} day(s) with zero sales`,
                value: daysBetween - daysWithSales.size
            });
        }

        return anomalies;
    }

    /**
     * Helper: Calculate days between two dates
     * @private
     */
    _getDaysBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }
}

module.exports = new SalesAnalyticsRepository();

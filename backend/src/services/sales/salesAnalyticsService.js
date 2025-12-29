const salesAnalyticsRepository = require('../../repositories/salesAnalyticsRepository');

/**
 * Sales Analytics Service
 * Business logic for sales reporting and insights
 */
class SalesAnalyticsService {
    /**
     * Process date range presets
     * @param {string} preset - today | 7d | 30d | mtd | custom
     * @param {string} customStart - Custom start date (for custom preset)
     * @param {string} customEnd - Custom end date (for custom preset)
     * @returns {Object} { startDate, endDate, compareStartDate, compareEndDate }
     */
    _processDateRange(preset, customStart, customEnd) {
        const today = new Date();
        let startDate, endDate, compareStartDate, compareEndDate;

        endDate = new Date(today.setHours(23, 59, 59, 999));

        switch (preset) {
            case 'today':
                startDate = new Date(today.setHours(0, 0, 0, 0));
                // Compare to yesterday
                compareEndDate = new Date(startDate.getTime() - 1);
                compareStartDate = new Date(compareEndDate);
                compareStartDate.setHours(0, 0, 0, 0);
                break;

            case '7d':
                startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                // Compare to previous 7 days
                compareEndDate = new Date(startDate.getTime() - 1);
                compareStartDate = new Date(compareEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;

            case '30d':
                startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                // Compare to previous 30 days
                compareEndDate = new Date(startDate.getTime() - 1);
                compareStartDate = new Date(compareEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;

            case 'mtd': // Month to date
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                // Compare to last month
                compareStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                compareEndDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
                break;

            case 'custom':
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
                // Compare to previous period of same length
                const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                compareEndDate = new Date(startDate.getTime() - 1);
                compareStartDate = new Date(compareEndDate.getTime() - (daysDiff * 24 * 60 * 60 * 1000));
                break;

            default:
                startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                compareStartDate = null;
                compareEndDate = null;
        }

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            compareStartDate: compareStartDate?.toISOString(),
            compareEndDate: compareEndDate?.toISOString()
        };
    }

    /**
     * Get comprehensive KPI dashboard
     * @param {Object} params - { storeId, datePreset, customStart, customEnd, channel, customerType }
     * @returns {Promise<Object>} Complete KPI metrics
     */
    async getKPIDashboard({ storeId, datePreset = '7d', customStart, customEnd, channel, customerType }) {
        const { startDate, endDate, compareStartDate, compareEndDate } = this._processDateRange(
            datePreset,
            customStart,
            customEnd
        );

        const kpis = await salesAnalyticsRepository.getKPIs({
            storeId,
            startDate,
            endDate,
            compareStartDate,
            compareEndDate,
            channel,
            customerType
        });

        return {
            ...kpis,
            period: {
                start: startDate,
                end: endDate,
                preset: datePreset
            }
        };
    }

    /**
     * Get sales trends with comparison
     * @param {Object} params - { storeId, datePreset, customStart, customEnd, granularity }
     * @returns {Promise<Object>} Trend data with comparison
     */
    async getSalesTrends({ storeId, datePreset = '7d', customStart, customEnd, granularity = 'day' }) {
        const { startDate, endDate, compareStartDate, compareEndDate } = this._processDateRange(
            datePreset,
            customStart,
            customEnd
        );

        const currentTrend = await salesAnalyticsRepository.getTrendData({
            storeId,
            startDate,
            endDate,
            granularity
        });

        let compareTrend = [];
        if (compareStartDate && compareEndDate) {
            compareTrend = await salesAnalyticsRepository.getTrendData({
                storeId,
                startDate: compareStartDate,
                endDate: compareEndDate,
                granularity
            });
        }

        return {
            current: currentTrend,
            previous: compareTrend,
            period: {
                start: startDate,
                end: endDate
            }
        };
    }

    /**
     * Get complete sales breakdown
     * @param {Object} params - { storeId, datePreset, customStart, customEnd }
     * @returns {Promise<Object>} Category and payment breakdowns
     */
    async getSalesBreakdown({ storeId, datePreset = '7d', customStart, customEnd }) {
        const { startDate, endDate } = this._processDateRange(datePreset, customStart, customEnd);

        const [categoryBreakdown, paymentBreakdown] = await Promise.all([
            salesAnalyticsRepository.getCategoryBreakdown({ storeId, startDate, endDate }),
            salesAnalyticsRepository.getPaymentMethodBreakdown({ storeId, startDate, endDate })
        ]);

        return {
            byCategory: categoryBreakdown,
            byPaymentMethod: paymentBreakdown,
            period: {
                start: startDate,
                end: endDate
            }
        };
    }

    /**
     * Get performance tables (products & customers)
     * @param {Object} params - { storeId, datePreset, customStart, customEnd, limit }
     * @returns {Promise<Object>} Top performers
     */
    async getPerformanceTables({ storeId, datePreset = '7d', customStart, customEnd, limit = 10 }) {
        const { startDate, endDate } = this._processDateRange(datePreset, customStart, customEnd);

        const [topProducts, topCustomers] = await Promise.all([
            salesAnalyticsRepository.getTopProducts({ storeId, startDate, endDate, limit }),
            salesAnalyticsRepository.getTopCustomers({ storeId, startDate, endDate, limit })
        ]);

        return {
            topProducts,
            topCustomers,
            period: {
                start: startDate,
                end: endDate
            }
        };
    }

    /**
     * Generate actionable insights (rule-based)
     * @param {Object} params - { storeId, datePreset, customStart, customEnd }
     * @returns {Promise<Array>} Insights with severity and actions
     */
    async generateInsights({ storeId, datePreset = '7d', customStart, customEnd }) {
        const { startDate, endDate } = this._processDateRange(datePreset, customStart, customEnd);

        const [kpis, anomalies, categoryBreakdown, topProducts] = await Promise.all([
            salesAnalyticsRepository.getKPIs({
                storeId,
                startDate,
                endDate
            }),
            salesAnalyticsRepository.detectAnomalies({ storeId, startDate, endDate }),
            salesAnalyticsRepository.getCategoryBreakdown({ storeId, startDate, endDate }),
            salesAnalyticsRepository.getTopProducts({ storeId, startDate, endDate, limit: 10 })
        ]);

        const insights = [];

        // Revenue insights
        if (kpis.delta.revenue > 15) {
            const topCategory = categoryBreakdown[0];
            insights.push({
                type: 'revenue_growth',
                severity: 'success',
                icon: '🟢',
                title: 'Strong Growth',
                message: `Revenue up ${Math.round(kpis.delta.revenue)}% driven by ${topCategory?.category || 'top category'}.`,
                action: {
                    label: 'View details',
                    filter: { category: topCategory?.category }
                }
            });
        } else if (kpis.delta.revenue < -10) {
            insights.push({
                type: 'revenue_decline',
                severity: 'critical',
                icon: '🔴',
                title: 'Revenue Decline',
                message: `Revenue down ${Math.abs(Math.round(kpis.delta.revenue))}%. Review pricing and promotions.`,
                action: {
                    label: 'Investigate',
                    path: '/reports/sales'
                }
            });
        }

        // AOV insights
        if (kpis.delta.aov < -5) {
            insights.push({
                type: 'aov_decline',
                severity: 'warning',
                icon: '🟠',
                title: 'AOV Decline',
                message: `Average order value down ${Math.abs(Math.round(kpis.delta.aov))}%. Higher discount usage detected.`,
                action: {
                    label: 'Review discounts',
                    path: '/reports/sales'
                }
            });
        }

        // Refund/return insights
        if (kpis.returnRate > 5) {
            insights.push({
                type: 'high_returns',
                severity: kpis.returnRate > 10 ? 'critical' : 'warning',
                icon: kpis.returnRate > 10 ? '🔴' : '🟠',
                title: 'High Return Rate',
                message: `${kpis.returnRate}% return rate (₹${kpis.refunds}). Check quality and customer feedback.`,
                action: {
                    label: 'View refunds',
                    path: '/reports/sales'
                }
            });
        } else if (kpis.refunds === 0 && kpis.orders > 10) {
            insights.push({
                type: 'zero_refunds',
                severity: 'success',
                icon: '🟢',
                title: 'Healthy',
                message: 'Zero refunds this period. Excellent customer satisfaction!',
                action: null
            });
        }

        // Customer acquisition insights
        if (kpis.newCustomers > kpis.returningCustomers && kpis.customers > 5) {
            insights.push({
                type: 'new_customer_growth',
                severity: 'success',
                icon: '🟢',
                title: 'Customer Growth',
                message: `${kpis.newCustomers} new customers acquired (${Math.round((kpis.newCustomers / kpis.customers) * 100)}% of total).`,
                action: {
                    label: 'View customers',
                    filter: { customerType: 'new' }
                }
            });
        }

        // Stock alerts from top products
        const lowStockProducts = topProducts.filter(p => p.stockLeft < 10 && p.stockLeft > 0);
        if (lowStockProducts.length > 0) {
            insights.push({
                type: 'low_stock_alert',
                severity: 'warning',
                icon: '🟠',
                title: 'Stock Alert',
                message: `${lowStockProducts.length} top-selling product(s) running low on stock.`,
                action: {
                    label: 'Restock now',
                    path: '/inventory'
                },
                products: lowStockProducts.map(p => p.drugName)
            });
        }

        // Out of stock on top sellers (critical)
        const outOfStockTopSellers = topProducts.filter(p => p.stockLeft === 0);
        if (outOfStockTopSellers.length > 0) {
            insights.push({
                type: 'out_of_stock',
                severity: 'critical',
                icon: '🔴',
                title: 'Out of Stock',
                message: `${outOfStockTopSellers.length} top-selling product(s) out of stock. Lost sales opportunity!`,
                action: {
                    label: 'Purchase order',
                    path: '/procurement/purchase-orders'
                },
                products: outOfStockTopSellers.map(p => p.drugName)
            });
        }

        // Add anomalies as insights
        anomalies.forEach(anomaly => {
            insights.push({
                type: anomaly.type,
                severity: anomaly.severity,
                icon: anomaly.severity === 'critical' ? '🔴' : anomaly.severity === 'warning' ? '🟠' : '🔵',
                title: anomaly.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                message: anomaly.message,
                action: anomaly.type.includes('spike') || anomaly.type.includes('drop') ? {
                    label: 'View details',
                    filter: { date: anomaly.date }
                } : null
            });
        });

        // Sort by severity: critical > warning > success > info
        const severityOrder = { critical: 0, warning: 1, success: 2, info: 3 };
        return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }

    /**
     * Get complete report (all data at once)
     * @param {Object} params - { storeId, datePreset, customStart, customEnd }
     * @returns {Promise<Object>} Complete sales report
     */
    async getCompleteReport({ storeId, datePreset = '7d', customStart, customEnd }) {
        const [kpis, trends, breakdown, performance, insights] = await Promise.all([
            this.getKPIDashboard({ storeId, datePreset, customStart, customEnd }),
            this.getSalesTrends({ storeId, datePreset, customStart, customEnd }),
            this.getSalesBreakdown({ storeId, datePreset, customStart, customEnd }),
            this.getPerformanceTables({ storeId, datePreset, customStart, customEnd }),
            this.generateInsights({ storeId, datePreset, customStart, customEnd })
        ]);

        return {
            kpis,
            trends,
            breakdown,
            performance,
            insights,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Export sales report data
     * @param {Object} params - { storeId, datePreset, customStart, customEnd, format }
     * @returns {Promise<Object>} Export data formatted for CSV/PDF
     */
    async exportReport({ storeId, datePreset = '7d', customStart, customEnd, format = 'csv' }) {
        const report = await this.getCompleteReport({ storeId, datePreset, customStart, customEnd });

        // Format for export
        const exportData = {
            metadata: {
                storeName: 'Store', // Will be fetched from store
                reportType: 'Sales Analytics',
                period: report.kpis.period,
                generatedAt: report.generatedAt
            },
            summary: {
                revenue: report.kpis.revenue,
                orders: report.kpis.orders,
                aov: report.kpis.aov,
                customers: report.kpis.customers,
                refunds: report.kpis.refunds
            },
            trends: report.trends.current,
            topProducts: report.performance.topProducts,
            topCustomers: report.performance.topCustomers,
            categoryBreakdown: report.breakdown.byCategory,
            paymentBreakdown: report.breakdown.byPaymentMethod
        };

        return {
            data: exportData,
            format,
            filename: `sales-report-${datePreset}-${new Date().toISOString().split('T')[0]}.${format}`
        };
    }
}

module.exports = new SalesAnalyticsService();

import { SalesReportData, SalesFilters } from '@/types/reports';
import { apiClient } from './client';

/**
 * Reports API Client
 */

export interface ReportFilters {
    from?: string;
    to?: string;
    dateRange?: 'today' | '7d' | '30d' | '90d' | 'mtd' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'custom';
    storeId?: string;
    channel?: string;
    category?: string;
    sku?: string;
}

export interface PurchaseReportData {
    meta: { from: string; to: string };
    summary: {
        totalPurchase: number;
        totalOrders: number;
        avgOrderValue: number;
    };
    bySupplier: Array<{
        supplier: string;
        category: string;
        amount: number;
        orders: number;
        avgOrderValue: number;
    }>;
    topItems: Array<{
        name: string;
        supplier: string;
        amount: number;
        qty: number;
    }>;
}

export interface InventoryReportData {
    metrics: {
        totalValue: number;
        totalItems: number;
        lowStock: number;
        deadStock: number;
        turnoverRatio: number;
    };
    categoryData: Array<{
        category: string;
        items: number;
        value: number;
        turnover: number;
    }>;
}

export interface ProfitReportData {
    meta: { from: string; to: string };
    profitData: {
        revenue: number;
        cogs: number;
        grossProfit: number;
        expenses: number;
        netProfit: number;
        grossMargin: number;
        netMargin: number;
        revenueGrowth: number;
        profitGrowth: number;
    };
    categoryBreakdown: Array<{
        category: string;
        revenue: number;
        cost: number;
        profit: number;
        margin: number;
    }>;
    monthlyTrend: any[];
}

export interface TrendsReportData {
    meta: { from: string; to: string };
    monthlyTrend: Array<{
        month: Date;
        revenue: number;
        orders: number;
    }>;
    topGrowingProducts: any[];
    insights: Array<{
        type: 'positive' | 'warning' | 'info';
        title: string;
        message: string;
    }>;
}

/**
 * Get sales report
 */
export async function getSalesReport(filters?: ReportFilters): Promise<SalesReportData> {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);
    if (filters?.channel) params.append('channel', filters.channel);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.sku) params.append('sku', filters.sku);

    const result = await apiClient.get(`/reports/sales?${params.toString()}`);
    return result.data;
}

/**
 * Get purchase report
 */
export async function getPurchaseReport(filters?: ReportFilters): Promise<PurchaseReportData> {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);

    const result = await apiClient.get(`/reports/purchase?${params.toString()}`);
    return result.data;
}

/**
 * Get inventory report
 */
export async function getInventoryReport(): Promise<InventoryReportData> {
    const result = await apiClient.get('/reports/inventory');
    return result.data;
}

/**
 * Get profit report
 */
export async function getProfitReport(filters?: ReportFilters): Promise<ProfitReportData> {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);

    const result = await apiClient.get(`/reports/profit?${params.toString()}`);
    return result.data;
}

/**
 * Get trends report
 */
export async function getTrendsReport(filters?: ReportFilters): Promise<TrendsReportData> {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);

    const result = await apiClient.get(`/reports/trends?${params.toString()}`);
    return result.data;
}

/**
 * Export report
 */
export async function exportReport(
    type: 'sales' | 'purchase' | 'inventory' | 'profit' | 'trends',
    format: 'pdf' | 'excel' | 'csv' = 'pdf',
    filters?: ReportFilters
): Promise<{ jobId: string; message: string }> {
    const result = await apiClient.post(`/reports/${type}/export`, {
        format,
        ...filters,
    });
    return result.data;
}

import { apiClient } from './client';

/**
 * Sales Analytics API Client
 * Enterprise-grade sales reporting and insights
 */

export type DatePreset = 'today' | '7d' | '30d' | 'mtd' | 'custom';

export interface SalesAnalyticsFilters {
    datePreset?: DatePreset;
    customStart?: string;
    customEnd?: string;
    channel?: string;
    customerType?: 'new' | 'returning' | 'all';
    limit?: number;
    granularity?: 'day' | 'hour';
}

export interface KPIMetrics {
    revenue: number;
    orders: number;
    aov: number;
    customers: number;
    newCustomers: number;
    returningCustomers: number;
    refunds: number;
    returnRate: number;
    delta: {
        revenue: number;
        orders: number;
        aov: number;
    };
    avgOrdersPerDay: number;
    avgOrdersPerHour: number;
    period: {
        start: string;
        end: string;
        preset: string;
    };
}

export interface TrendDataPoint {
    date: string;
    revenue: number;
    orders: number;
    items: number;
    aov: number;
}

export interface TrendsData {
    current: TrendDataPoint[];
    previous: TrendDataPoint[];
    period: {
        start: string;
        end: string;
    };
}

export interface CategoryBreakdownItem {
    category: string;
    revenue: number;
    orders: number;
    revenueShare: number;
    margin: number;
}

export interface PaymentBreakdownItem {
    method: string;
    amount: number;
    count: number;
    percentage: number;
}

export interface BreakdownData {
    byCategory: CategoryBreakdownItem[];
    byPaymentMethod: PaymentBreakdownItem[];
    period: {
        start: string;
        end: string;
    };
}

export interface TopProduct {
    drugId: string;
    drugName: string;
    manufacturer: string;
    category: string;
    revenue: number;
    quantity: number;
    orders: number;
    avgPrice: number;
    stockLeft: number;
    trend: 'up' | 'down' | 'stable';
}

export interface TopCustomer {
    customerId: string;
    customerName: string;
    phoneNumber: string;
    totalSpend: number;
    orders: number;
    avgOrderValue: number;
    lastVisit: string;
    loyaltyStatus: string;
}

export interface PerformanceData {
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    period: {
        start: string;
        end: string;
    };
}

export interface Insight {
    type: string;
    severity: 'success' | 'warning' | 'critical' | 'info';
    icon: string;
    title: string;
    message: string;
    action?: {
        label: string;
        filter?: Record<string, any>;
        path?: string;
    } | null;
    products?: string[];
}

export interface CompleteReport {
    kpis: KPIMetrics;
    trends: TrendsData;
    breakdown: BreakdownData;
    performance: PerformanceData;
    insights: Insight[];
    generatedAt: string;
}

export interface ExportData {
    data: any;
    format: string;
    filename: string;
}

/**
 * Get KPI dashboard
 */
export async function getKPIs(filters?: SalesAnalyticsFilters): Promise<KPIMetrics> {
    const params = new URLSearchParams();
    if (filters?.datePreset) params.append('datePreset', filters.datePreset);
    if (filters?.customStart) params.append('customStart', filters.customStart);
    if (filters?.customEnd) params.append('customEnd', filters.customEnd);
    if (filters?.channel) params.append('channel', filters.channel);
    if (filters?.customerType) params.append('customerType', filters.customerType);

    const result = await apiClient.get(`/sales/analytics/kpis?${params.toString()}`);
    return result.data;
}

/**
 * Get sales trends
 */
export async function getTrends(filters?: SalesAnalyticsFilters): Promise<TrendsData> {
    const params = new URLSearchParams();
    if (filters?.datePreset) params.append('datePreset', filters.datePreset);
    if (filters?.customStart) params.append('customStart', filters.customStart);
    if (filters?.customEnd) params.append('customEnd', filters.customEnd);
    if (filters?.granularity) params.append('granularity', filters.granularity);

    const result = await apiClient.get(`/sales/analytics/trends?${params.toString()}`);
    return result.data;
}

/**
 * Get breakdown (category & payment)
 */
export async function getBreakdown(filters?: SalesAnalyticsFilters): Promise<BreakdownData> {
    const params = new URLSearchParams();
    if (filters?.datePreset) params.append('datePreset', filters.datePreset);
    if (filters?.customStart) params.append('customStart', filters.customStart);
    if (filters?.customEnd) params.append('customEnd', filters.customEnd);

    const result = await apiClient.get(`/sales/analytics/breakdown?${params.toString()}`);
    return result.data;
}

/**
 * Get performance tables
 */
export async function getPerformance(filters?: SalesAnalyticsFilters): Promise<PerformanceData> {
    const params = new URLSearchParams();
    if (filters?.datePreset) params.append('datePreset', filters.datePreset);
    if (filters?.customStart) params.append('customStart', filters.customStart);
    if (filters?.customEnd) params.append('customEnd', filters.customEnd);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const result = await apiClient.get(`/sales/analytics/performance?${params.toString()}`);
    return result.data;
}

/**
 * Get insights
 */
export async function getInsights(filters?: SalesAnalyticsFilters): Promise<Insight[]> {
    const params = new URLSearchParams();
    if (filters?.datePreset) params.append('datePreset', filters.datePreset);
    if (filters?.customStart) params.append('customStart', filters.customStart);
    if (filters?.customEnd) params.append('customEnd', filters.customEnd);

    const result = await apiClient.get(`/sales/analytics/insights?${params.toString()}`);
    return result.data;
}

/**
 * Get complete report
 */
export async function getCompleteReport(filters?: SalesAnalyticsFilters): Promise<CompleteReport> {
    const params = new URLSearchParams();
    if (filters?.datePreset) params.append('datePreset', filters.datePreset);
    if (filters?.customStart) params.append('customStart', filters.customStart);
    if (filters?.customEnd) params.append('customEnd', filters.customEnd);

    const result = await apiClient.get(`/sales/analytics/report?${params.toString()}`);
    return result.data;
}

/**
 * Export report
 */
export async function exportReport(
    filters?: SalesAnalyticsFilters,
    format: 'csv' | 'pdf' = 'csv'
): Promise<ExportData> {
    const result = await apiClient.post('/sales/analytics/export', {
        datePreset: filters?.datePreset || '7d',
        customStart: filters?.customStart,
        customEnd: filters?.customEnd,
        format
    });
    return result.data;
}

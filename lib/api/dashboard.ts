import { baseFetch } from './client';

export interface DashboardStats {
    revenue: number;
    salesCount: number;
    prescriptions: number;
    prescriptionDetails?: {
        active: number;
        draft: number;
        refill: number;
    };
    readyForPickup: number;
    criticalStock: number;
    expiringSoon: number;
    yesterdayRevenue: number;
}

export interface SalesChartData {
    period: 'week' | 'month' | 'year';
    data: Array<{
        date: string;
        revenue: number;
        count: number;
    }>;
    workflowStats?: {
        new: number;
        inProgress: number;
        ready: number;
        delivered: number;
    };
    averageProcessingTime?: string;
    growthPercent?: string;
    totalRevenue?: number;
    totalOrders?: number;
}

export interface ActionQueues {
    pendingPrescriptions: Array<{
        id: string;
        patientName: string;
        time: string;
    }>;
    lowStockItems: Array<{
        id: string;
        drugName: string;
        stock: number;
    }>;
    expiringItems: Array<{
        id: string;
        drugName: string;
        expiryDate: string;
    }>;
    readyForPickup: Array<{
        id: string;
        invoiceNumber: string;
        patientName: string;
        time: string;
    }>;
}

export interface Insight {
    id: string;
    title: string;
    description: string;
    severity: string;
    type: string;
    icon: string;
    time: string;
}

export const dashboardApi = {
    /**
     * Get dashboard statistics
     */
    async getStats(): Promise<DashboardStats> {
        const response = await baseFetch('/dashboard/stats') as any;
        return response.data; // Unwrap ApiResponse
    },

    /**
     * Get sales chart data
     */
    async getSalesChart(period: 'week' | 'month' | 'year'): Promise<SalesChartData> {
        const response = await baseFetch(`/dashboard/sales-chart?period=${period}`) as any;
        return response.data; // Unwrap ApiResponse
    },

    /**
     * Get action queues
     */
    async getActionQueues(): Promise<ActionQueues> {
        const response = await baseFetch('/dashboard/action-queues') as any;
        return response.data; // Unwrap ApiResponse
    },

    /**
     * Get insights
     */
    async getInsights(): Promise<Insight[]> {
        const response = await baseFetch('/dashboard/insights') as any;
        return response.data; // Unwrap ApiResponse
    },
};

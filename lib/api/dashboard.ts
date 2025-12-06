import { baseFetch } from './client';

export interface DashboardStats {
    revenue: number;
    salesCount: number;
    prescriptions: number;
    readyForPickup: number;
    criticalStock: number;
    expiringSoon: number;
}

export interface SalesChartData {
    period: 'daily' | 'weekly' | 'monthly';
    data: Array<{
        date: string;
        revenue: number;
        count: number;
    }>;
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
     * Get all dashboard stats
     */
    async getStats(): Promise<DashboardStats> {
        return baseFetch<DashboardStats>('/dashboard/stats');
    },

    /**
     * Get sales chart data
     */
    async getSalesChart(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<SalesChartData> {
        return baseFetch<SalesChartData>(`/dashboard/sales-chart?period=${period}`);
    },

    /**
     * Get action queues
     */
    async getActionQueues(): Promise<ActionQueues> {
        return baseFetch<ActionQueues>('/dashboard/action-queues');
    },

    /**
     * Get AI insights (real alerts)
     */
    async getInsights(): Promise<Insight[]> {
        return baseFetch<Insight[]>('/dashboard/insights');
    },
};

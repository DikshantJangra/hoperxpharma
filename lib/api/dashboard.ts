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
     * Get dashboard statistics
     */
    async getStats(): Promise<DashboardStats> {
        return baseFetch('/dashboard/stats') as any;
    },

    /**
     * Get sales chart data
     */
    async getSalesChart(period: 'week' | 'month' | 'year'): Promise<SalesChartData> {
        return baseFetch(`/dashboard/sales-chart?period=${period}`) as any;
    },

    /**
     * Get action queues
     */
    async getActionQueues(): Promise<ActionQueues> {
        return baseFetch('/dashboard/action-queues') as any;
    },

    /**
     * Get insights
     */
    async getInsights(): Promise<Insight[]> {
        return baseFetch('/dashboard/insights') as any;
    },
};

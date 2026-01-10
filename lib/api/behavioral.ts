import { apiClient } from './client';

/**
 * Behavioral Analytics API Client
 * Handles employee behavioral scoring and insights
 */

export interface BehavioralMetrics {
    scanBypassCount: number;
    voidCount: number;
    overrideCount: number;
    fefoDeviationCount: number;
    manualEntryCount: number;
    totalSalesCount: number;
    manualEntryRate: number;
    anomalyScore: number;
}

export interface EmployeeSummary {
    employeeId: string;
    period: {
        days: number;
        startDate: string;
        endDate: string;
    };
    averageAnomalyScore: number;
    averageManualEntryRate: number;
    totalVoids: number;
    totalOverrides: number;
    totalSales: number;
    daysAnalyzed: number;
    dailyMetrics: Array<{
        date: string;
        anomalyScore: number;
        manualEntryRate: number;
        voidCount: number;
        overrideCount: number;
    }>;
}

export interface StoreInsights {
    storeId: string;
    period: {
        days: number;
        startDate: string;
        endDate: string;
    };
    totalEmployeesTracked: number;
    highRiskEmployees: number;
    storeAverageAnomalyScore: number;
    highRiskList: Array<{
        employeeId: string;
        anomalyScore: number;
        manualEntryRate: number;
        voidCount: number;
        overrideCount: number;
        date: string;
    }>;
}

export const behavioralApi = {
    /**
     * Calculate employee anomaly score
     */
    calculateAnomalyScore: async (employeeId?: string, date?: string): Promise<BehavioralMetrics> => {
        const response = await apiClient.post<{ success: boolean; data: BehavioralMetrics }>(
            '/behavioral/calculate-score',
            { employeeId, date }
        );
        return response.data.data;
    },

    /**
     * Get employee behavioral summary
     */
    getEmployeeSummary: async (employeeId?: string, days: number = 30): Promise<EmployeeSummary | null> => {
        const response = await apiClient.get<{ success: boolean; data: EmployeeSummary | null }>(
            '/behavioral/employee-summary',
            { params: { employeeId, days } }
        );
        return response.data.data;
    },

    /**
     * Get store-wide behavioral insights
     */
    getStoreInsights: async (days: number = 7): Promise<StoreInsights> => {
        const response = await apiClient.get<{ success: boolean; data: StoreInsights }>(
            '/behavioral/store-insights',
            { params: { days } }
        );
        return response.data.data;
    },

    /**
     * Get high-risk employees
     */
    getHighRiskEmployees: async (threshold: number = 70, limit: number = 10) => {
        const response = await apiClient.get('/behavioral/high-risk', {
            params: { threshold, limit }
        });
        return response.data.data;
    }
};

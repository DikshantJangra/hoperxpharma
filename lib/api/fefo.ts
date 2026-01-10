import { apiClient } from './client';

/**
 * FEFO API Client
 * Handles FEFO recommendations and deviation tracking
 */

export interface FEFORecommendation {
    recommendedBatchId: string;
    batchNumber: string;
    expiryDate: string;
    quantityInStock: number;
    baseUnitQuantity: number;
    mrp: number;
    daysToExpiry: number;
    alternativeBatches: Array<{
        id: string;
        batchNumber: string;
        expiryDate: string;
        quantityInStock: number;
        mrp: number;
        daysToExpiry: number;
        daysDifferenceFromRecommended: number;
        isRecommended: boolean;
    }>;
    expiryRisk: {
        totalAtRisk: number;
        categories: {
            expired: number;
            critical: number;
            warning: number;
            caution: number;
            safe: number;
        };
        batchesExpiringSoon: number;
        totalBatches: number;
    };
}

export interface FEFODeviationRequest {
    saleId: string;
    saleItemId?: string;
    drugId: string;
    recommendedBatchId: string;
    actualBatchId: string;
    reason?: string;
}

export interface AdherenceStats {
    totalSales: number;
    deviations: number;
    adherenceRate: number;
    period: {
        startDate: string;
        endDate: string;
    };
    employeeId?: string;
}

export const fefoApi = {
    /**
     * Get FEFO-recommended batch for a drug
     */
    recommendBatch: async (drugId: string, quantity: number = 1): Promise<FEFORecommendation | null> => {
        const response = await apiClient.post<{ success: boolean; data: FEFORecommendation | null }>(
            '/fefo/recommend',
            { drugId, quantity }
        );
        return response.data.data;
    },

    /**
     * Log FEFO deviation
     */
    logDeviation: async (data: FEFODeviationRequest) => {
        const response = await apiClient.post('/fefo/deviation', data);
        return response.data;
    },

    /**
     * Get FEFO adherence statistics
     */
    getAdherenceStats: async (params?: {
        startDate?: string;
        endDate?: string;
        employeeId?: string;
    }): Promise<AdherenceStats> => {
        const response = await apiClient.get<{ success: boolean; data: AdherenceStats }>('/fefo/adherence', { params });
        return response.data.data;
    },

    /**
     * Get top FEFO violators
     */
    getTopViolators: async (days: number = 30, limit: number = 10) => {
        const response = await apiClient.get('/fefo/violators', {
            params: { days, limit }
        });
        return response.data.data;
    },

    /**
     * Get FEFO violation trends
     */
    getViolationTrends: async (days: number = 30) => {
        const response = await apiClient.get('/fefo/trends', {
            params: { days }
        });
        return response.data.data;
    }
};

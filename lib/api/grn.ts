import { apiClient } from './client';

export const grnApi = {
    /**
     * Create a new GRN from a Purchase Order
     */
    createGRN: async (poId: string) => {
        const response = await apiClient.post('/grn', { poId });
        return response.data;
    },

    /**
     * Get GRN details by ID
     */
    getGRN: async (id: string) => {
        const response = await apiClient.get(`/grn/${id}`);
        return response.data;
    },

    /**
     * Get GRNs by Purchase Order ID
     */
    getGRNsByPOId: async (poId: string) => {
        const response = await apiClient.get(`/grn/po/${poId}`);
        return response.data;
    },

    /**
     * Get all GRNs with filter
     */
    getGRNs: async (params: { status?: string; limit?: number } = {}) => {
        const query = new URLSearchParams();
        if (params.status) query.append('status', params.status);
        if (params.limit) query.append('limit', params.limit.toString());

        const response = await apiClient.get(`/grn?${query.toString()}`);
        return response.data;
    },

    /**
     * Update GRN details (draft save)
     */
    updateGRN: async (id: string, data: any) => {
        return apiClient.patch(`/grn/${id}`, data);
    },

    /**
     * Split a batch item
     */
    splitBatch: async (grnId: string, itemId: string, splitData: any[]) => {
        return apiClient.post(`/grn/${grnId}/items/${itemId}/split`, { splitData });
    },

    /**
     * Add discrepancy
     */
    addDiscrepancy: async (grnId: string, discrepancyData: any) => {
        return apiClient.post(`/grn/${grnId}/discrepancies`, discrepancyData);
    },

    /**
     * Delete a batch item
     */
    deleteBatch: async (grnId: string, itemId: string) => {
        return apiClient.delete(`/grn/${grnId}/items/${itemId}`);
    },

    /**
     * Update a specific item in GRN
     */
    updateItem: async (grnId: string, itemId: string, updates: any) => {
        return apiClient.patch(`/grn/${grnId}/items/${itemId}`, updates);
    },

    /**
     * Complete the GRN
     */
    completeGRN: async (grnId: string, data: {
        supplierInvoiceNo?: string;
        supplierInvoiceDate?: string | null;
        targetStatus?: 'COMPLETED' | 'PARTIALLY_RECEIVED';
        notes?: string;
    }) => {
        return apiClient.post(`/grn/${grnId}/complete`, data);
    },

    /**
     * Discard GRN draft
     */
    discardDraft: async (grnId: string, data: any) => {
        return apiClient.delete(`/grn/${grnId}`, { data });
    }
};

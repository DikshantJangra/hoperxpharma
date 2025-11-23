import { apiClient } from './client';

export interface Drug {
    id: string;
    name: string;
    strength: string;
    form: string;
    manufacturer: string;
    hsnCode: string;
    gstRate: number;
    requiresPrescription: boolean;
    defaultUnit: string;
    lowStockThreshold: number;
    createdAt: string;
    updatedAt: string;
}

export interface Batch {
    id: string;
    drugId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    mrp: number;
    purchaseRate: number;
    supplierId: string;
    storeId: string;
    createdAt: string;
    updatedAt: string;
    drug?: Drug;
}

export interface StockAdjustment {
    drugId: string;
    batchId: string;
    quantity: number;
    type: 'ADD' | 'REMOVE' | 'SET';
    reason: string;
}

export const inventoryApi = {
    /**
     * Get all drugs with pagination and filtering
     */
    async getDrugs(params: { page?: number; limit?: number; search?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);

        const response = await apiClient.get(`/inventory/drugs?${query.toString()}`);
        return response.data;
    },

    /**
     * Get single drug by ID
     */
    async getDrugById(id: string) {
        const response = await apiClient.get(`/inventory/drugs/${id}`);
        return response.data;
    },

    /**
     * Create new drug
     */
    async createDrug(data: Partial<Drug>) {
        const response = await apiClient.post('/inventory/drugs', data);
        return response.data;
    },

    /**
     * Update drug
     */
    async updateDrug(id: string, data: Partial<Drug>) {
        const response = await apiClient.put(`/inventory/drugs/${id}`, data);
        return response.data;
    },

    /**
     * Get batches with pagination and filtering
     */
    async getBatches(params: { page?: number; limit?: number; search?: string; drugId?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.drugId) query.append('drugId', params.drugId);

        const response = await apiClient.get(`/inventory/batches?${query.toString()}`);
        return response.data;
    },

    /**
     * Create new batch
     */
    async createBatch(data: Partial<Batch>) {
        const response = await apiClient.post('/inventory/batches', data);
        return response.data;
    },

    /**
     * Adjust stock
     */
    async adjustStock(data: StockAdjustment) {
        const response = await apiClient.post('/inventory/stock/adjust', data);
        return response.data;
    },

    /**
     * Get low stock alerts
     */
    async getLowStockAlerts() {
        const response = await apiClient.get('/inventory/alerts/low-stock');
        return response.data;
    },

    /**
     * Get expiring items alerts
     */
    async getExpiringItems() {
        const response = await apiClient.get('/inventory/alerts/expiring');
        return response.data;
    },

    /**
     * Get inventory summary
     */
    async getSummary() {
        const response = await apiClient.get('/inventory/summary');
        return response.data;
    }
};

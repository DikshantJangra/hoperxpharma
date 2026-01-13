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
    batchId: string;
    quantityAdjusted: number; // Changed from 'quantity' to match backend
    reason: string;
    // drugId and type are not needed - backend only needs batchId, quantityAdjusted, reason
    // userId is added automatically by backend from req.user.id
}

export const inventoryApi = {
    /**
     * Get all drugs with pagination and filtering
     */
    async getDrugs(params: {
        page?: number;
        limit?: number;
        search?: string;
        stockStatus?: string[];
        expiryWindow?: string[];
        storage?: string[];
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.stockStatus) params.stockStatus.forEach(s => query.append('stockStatus', s));
        if (params.expiryWindow) params.expiryWindow.forEach(e => query.append('expiryWindow', e));
        if (params.storage) params.storage.forEach(s => query.append('storage', s));
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);

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
     * Delete drug and all its batches (soft delete)
     */
    async deleteDrug(drugId: string) {
        const response = await apiClient.delete(`/inventory/drugs/${drugId}`);
        return response.data;
    },

    /**
     * Get batches with pagination and filtering
     */
    async getBatches(params: { page?: number; limit?: number; search?: string; drugId?: string; minQuantity?: number } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.drugId) query.append('drugId', params.drugId);
        if (params.minQuantity) query.append('minQuantity', params.minQuantity.toString());

        const response = await apiClient.get(`/inventory/batches?${query.toString()}`);
        return response.data; // Return body with success, data, message
    },

    /**
     * Get single batch by ID
     */
    async getBatchById(id: string) {
        const response = await apiClient.get(`/inventory/batches/${id}`);
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
    },

    /**
     * Search drugs for POS with stock availability
     */
    async searchForPOS(searchTerm: string) {
        if (!searchTerm || searchTerm.length < 2) {
            return { success: true, data: [] };
        }
        const response = await apiClient.get(`/inventory/pos/search?search=${encodeURIComponent(searchTerm)}`);
        return response.data; // Return body with success, data, message
    },

    /**
     * Update batch location
     */
    async updateBatchLocation(batchId: string, location: string) {
        const response = await apiClient.patch(`/inventory/batches/${batchId}/location`, { location });
        return response.data;
    },

    /**
     * Delete batch (soft delete)
     */
    async deleteBatch(batchId: string) {
        const response = await apiClient.delete(`/inventory/batches/${batchId}`);
        return response.data;
    },

    /**
     * Get batches with suppliers for a drug
     */
    async getBatchesWithSuppliers(drugId: string) {
        const response = await apiClient.get(`/inventory/drugs/${drugId}/batches-with-suppliers`);
        return response.data;
    },

    /**
     * Check if a batch exists for a drug (for receiving visual indicators)
     */
    async checkBatch(drugId: string, batchNumber: string) {
        const response = await apiClient.get(
            `/inventory/batches/check?drugId=${encodeURIComponent(drugId)}&batchNumber=${encodeURIComponent(batchNumber)}`
        );
        return response.data;
    },

    /**
     * Check multiple batches at once (for initial load)
     * Returns a map keyed by `${drugId}_${batchNumber}` with batch status
     */
    async checkBatchesBulk(items: Array<{ drugId: string, batchNumber: string }>) {
        try {
            // Validate input
            if (!items || items.length === 0) {
                return { success: true, data: {} };
            }

            // Filter out invalid items
            const validItems = items.filter(item => 
                item.drugId && 
                item.batchNumber && 
                item.batchNumber !== 'TBD' && 
                item.batchNumber.length > 1
            );

            if (validItems.length === 0) {
                return { success: true, data: {} };
            }

            const response = await apiClient.post('/inventory/batches/check-bulk', { items: validItems });
            return response.data;
        } catch (error) {
            console.error('Bulk batch check failed:', error);
            // Return empty result on error to avoid blocking UI
            return { success: false, data: {}, error: 'Network error' };
        }
    },

    /**
     * Get available units for a drug
     */
    async getDrugUnits(drugId: string) {
        const response = await apiClient.get(`/drugs/${drugId}/units`);
        return response.data;
    }
};

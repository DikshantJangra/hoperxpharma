import { apiClient } from './client';

export interface PurchaseOrderItem {
    drugId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    gstRate: number;
    totalAmount: number;
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplierId: string;
    supplier?: any;
    orderDate: string;
    expectedDeliveryDate?: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    items: PurchaseOrderItem[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export const purchaseOrderApi = {
    /**
     * Get purchase orders with pagination and filtering
     */
    async getPurchaseOrders(params: { page?: number; limit?: number; status?: string; supplierId?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.status) query.append('status', params.status);
        if (params.supplierId) query.append('supplierId', params.supplierId);

        const response = await apiClient.get(`/purchase-orders?${query.toString()}`);
        return response.data;
    },

    /**
     * Get purchase order by ID
     */
    async getPOById(id: string) {
        const response = await apiClient.get(`/purchase-orders/${id}`);
        return response.data;
    },

    /**
     * Create new purchase order
     */
    async createPO(data: {
        supplierId: string;
        expectedDeliveryDate?: string;
        items: PurchaseOrderItem[];
        notes?: string;
    }) {
        const response = await apiClient.post('/purchase-orders', data);
        return response.data;
    },

    /**
     * Update purchase order
     */
    async updatePO(id: string, data: Partial<PurchaseOrder>) {
        const response = await apiClient.put(`/purchase-orders/${id}`, data);
        return response.data;
    },

    /**
     * Approve purchase order
     */
    async approvePO(id: string) {
        const response = await apiClient.post(`/purchase-orders/${id}/approve`);
        return response.data;
    },

    /**
     * Receive goods for purchase order
     */
    async receiveGoods(id: string, items: { drugId: string; batchNumber: string; quantity: number; expiryDate: string; mrp: number; purchasePrice: number }[]) {
        const response = await apiClient.post(`/purchase-orders/${id}/receive`, { items });
        return response.data;
    },

    /**
     * Cancel purchase order
     */
    async cancelPO(id: string, reason?: string) {
        const response = await apiClient.post(`/purchase-orders/${id}/cancel`, { reason });
        return response.data;
    },

    /**
     * Get PO statistics
     */
    async getStats() {
        const response = await apiClient.get('/purchase-orders/stats');
        return response.data;
    },

    /**
     * Delete purchase order
     */
    async deletePO(id: string) {
        const response = await apiClient.delete(`/purchase-orders/${id}`);
        return response.data;
    },
};

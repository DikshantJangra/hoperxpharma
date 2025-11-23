import { apiClient } from './client';

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    phoneNumber: string;
    email?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    gstin?: string;
    dlNumber?: string;
    createdAt: string;
}

export interface PurchaseOrderItem {
    drugId: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplierId: string;
    status: string;
    subTotal: number;
    taxAmount: number;
    totalAmount: number;
    items: PurchaseOrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface POReceipt {
    poId: string;
    receivedDate: string;
    items: Array<{
        drugId: string;
        batchNumber: string;
        expiryDate: string;
        quantityReceived: number;
        mrp: number;
    }>;
}

export const purchaseOrdersApi = {
    /**
     * Get all suppliers
     */
    async getSuppliers(params: { page?: number; limit?: number; search?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);

        const response = await apiClient.get(`/purchase-orders/suppliers?${query.toString()}`);
        return response.data;
    },

    /**
     * Create new supplier
     */
    async createSupplier(data: Partial<Supplier>) {
        const response = await apiClient.post('/purchase-orders/suppliers', data);
        return response.data;
    },

    /**
     * Get all purchase orders
     */
    async getPurchaseOrders(params: { page?: number; limit?: number; status?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.status) query.append('status', params.status);

        const response = await apiClient.get(`/purchase-orders?${query.toString()}`);
        return response.data;
    },

    /**
     * Create new purchase order
     */
    async createPurchaseOrder(data: Partial<PurchaseOrder>) {
        const response = await apiClient.post('/purchase-orders', data);
        return response.data;
    },

    /**
     * Approve purchase order
     */
    async approvePO(id: string) {
        const response = await apiClient.put(`/purchase-orders/${id}/approve`);
        return response.data;
    },

    /**
     * Send purchase order to supplier
     */
    async sendPO(id: string) {
        const response = await apiClient.put(`/purchase-orders/${id}/send`);
        return response.data;
    },

    /**
     * Create receipt for purchase order
     */
    async createReceipt(data: POReceipt) {
        const response = await apiClient.post(`/purchase-orders/${data.poId}/receipts`, data);
        return response.data;
    },

    /**
     * Get PO statistics
     */
    async getStats() {
        const response = await apiClient.get('/purchase-orders/stats');
        return response.data;
    }
};

import { apiClient } from './client';

export interface SaleItem {
    drugId: string;
    batchId: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    totalAmount: number;
}

export interface Sale {
    id: string;
    invoiceNumber: string;
    customerName?: string;
    customerPhone?: string;
    doctorName?: string;
    subTotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    items: SaleItem[];
    createdAt: string;
}

export interface SalesStats {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    netProfit: number;
    revenueGrowth: number;
    ordersGrowth: number;
}

export const salesApi = {
    /**
     * Get sales with pagination and filtering
     */
    async getSales(params: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.startDate) query.append('startDate', params.startDate);
        if (params.endDate) query.append('endDate', params.endDate);

        const response = await apiClient.get(`/sales?${query.toString()}`);
        return response.data;
    },

    /**
     * Get sale by ID
     */
    async getSaleById(id: string) {
        const response = await apiClient.get(`/sales/${id}`);
        return response.data;
    },

    /**
     * Create new sale
     */
    async createSale(data: Partial<Sale>) {
        const response = await apiClient.post('/sales', data);
        return response.data;
    },

    /**
     * Get sales statistics
     */
    async getStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') {
        const response = await apiClient.get(`/sales/stats?period=${period}`);
        return response.data;
    },

    /**
     * Get top selling drugs
     */
    async getTopSelling(limit: number = 5) {
        const response = await apiClient.get(`/sales/top-selling?limit=${limit}`);
        return response.data;
    }
};

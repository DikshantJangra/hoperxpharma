import { apiClient } from './client';

export interface SaleItem {
    drugId: string;
    batchId: string;
    quantity: number;
    mrp: number;
    discount?: number;
    gstRate: number;
    lineTotal: number;
}

export interface Draft {
    id: string;
    draftNumber: string;
    customerName?: string;
    customerPhone?: string;
    customerId?: string;
    items: any[];
    subtotal: number;
    taxAmount: number;
    total: number;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface Refund {
    id: string;
    refundNumber: string;
    originalSaleId: string;
    refundAmount: number;
    refundReason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
    items: RefundItem[];
    requestedBy: string;
    approvedBy?: string;
    approvedAt?: string;
    completedAt?: string;
    createdAt: string;
}

export interface RefundItem {
    id: string;
    saleItemId: string;
    drugId: string;
    batchId: string;
    quantity: number;
    refundAmount: number;
    reason: string;
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
    prescriptionId?: string;
    shouldCreateRefill?: boolean; // Flag to indicate if a new refill should be created
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
        return response.data; // Correctly unwrap ApiResponse
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
    },

    /**
     * Get next invoice number
     */
    async getNextInvoiceNumber() {
        const response = await apiClient.get('/sales/next-invoice');
        return response.data;
    },

    // ============ Draft Methods ============

    /**
     * Save draft
     */
    async saveDraft(draftData: Partial<Draft>) {
        const response = await apiClient.post('/sales/drafts', draftData);
        return response.data;
    },

    /**
     * Get all drafts
     */
    async getDrafts(params: { page?: number; limit?: number } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());

        const response = await apiClient.get(`/sales/drafts?${query.toString()}`);
        return response.data;
    },

    /**
     * Get draft by ID
     */
    async getDraftById(draftId: string) {
        const response = await apiClient.get(`/sales/drafts/${draftId}`);
        return response.data;
    },

    /**
     * Update draft
     */
    async updateDraft(draftId: string, draftData: Partial<Draft>) {
        const response = await apiClient.put(`/sales/drafts/${draftId}`, draftData);
        return response.data;
    },

    /**
     * Convert draft to sale
     */
    async convertDraftToSale(draftId: string, paymentSplits: any[]) {
        const response = await apiClient.post(`/sales/drafts/${draftId}/convert`, { paymentSplits });
        return response.data;
    },

    /**
     * Delete draft
     */
    async deleteDraft(draftId: string) {
        const response = await apiClient.delete(`/sales/drafts/${draftId}`);
        return response.data;
    },

    // ============ Refund Methods ============

    /**
     * Initiate refund
     */
    async initiateRefund(saleId: string, refundData: { items: any[]; reason: string }) {
        const response = await apiClient.post(`/sales/${saleId}/refunds`, refundData);
        return response.data;
    },

    /**
     * Get all refunds
     */
    async getRefunds(params: { page?: number; limit?: number; status?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.status) query.append('status', params.status);

        const response = await apiClient.get(`/sales/refunds?${query.toString()}`);
        return response.data;
    },

    /**
     * Get refund by ID
     */
    async getRefundById(refundId: string) {
        const response = await apiClient.get(`/sales/refunds/${refundId}`);
        return response.data;
    },

    /**
     * Approve refund
     */
    async approveRefund(refundId: string) {
        const response = await apiClient.post(`/sales/refunds/${refundId}/approve`);
        return response.data;
    },

    /**
     * Reject refund
     */
    async rejectRefund(refundId: string, reason: string) {
        const response = await apiClient.post(`/sales/refunds/${refundId}/reject`, { reason });
        return response.data;
    },

    /**
     * Process refund
     */
    async processRefund(refundId: string) {
        const response = await apiClient.post(`/sales/refunds/${refundId}/process`);
        return response.data;
    },

    // ============ PDF Methods ============

    /**
     * Download invoice PDF
     */
    async downloadInvoicePDF(saleId: string): Promise<Blob> {
        // Use direct fetch for blob response
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/sales/${saleId}/invoice/pdf`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to download PDF');
        }

        return await response.blob();
    },

    /**
     * Email invoice (TODO: Implement backend endpoint)
     */
    async emailInvoice(saleId: string, email: string) {
        const response = await apiClient.post(`/sales/${saleId}/invoice/email`, { email });
        return response.data;
    },

    /**
     * WhatsApp invoice (TODO: Implement backend endpoint)
     */
    async whatsappInvoice(saleId: string, phone: string) {
        const response = await apiClient.post(`/sales/${saleId}/invoice/whatsapp`, { phone });
        return response.data;
    },
};

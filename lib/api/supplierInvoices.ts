import { apiClient } from './client';

export interface EligibleItem {
    grnItemId: string;
    grnId: string;
    grnNumber: string;
    poNumber: string;
    receivedDate: string;
    drugId: string;
    drugName: string;
    batchNumber: string;
    expiryDate?: string;
    receivedQty: number;
    freeQty: number;
    unitPrice: number;
    discountPercent: number;
    gstPercent: number;
    subtotal: number;
    calculatedTotal: number;
}

export interface SupplierInvoice {
    id: string;
    invoiceNumber: string;
    storeId: string;
    supplierId: string;
    periodStart: string;
    periodEnd: string;
    subtotal: number;
    taxAmount: number;
    adjustments: number;
    total: number;
    status: string;
    paymentStatus: string;
    paidAmount: number;
    paymentDate?: string;
    supplierInvoiceNo?: string;
    supplierInvoiceDate?: string;
    notes?: string;
    createdAt: string;
    confirmedAt?: string;
    supplier?: {
        id: string;
        name: string;
    };
    items?: InvoiceItem[];
    payments?: Payment[];
}

export interface InvoiceItem {
    id: string;
    drugName: string;
    batchNumber?: string;
    receivedQty: number;
    freeQty: number;
    billedQty: number;
    unitPrice: number;
    gstPercent: number;
    lineTotal: number;
    poNumber?: string;
    grnNumber?: string;
}

export interface Payment {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
    creator?: {
        firstName: string;
        lastName: string;
    };
}

export const supplierInvoiceApi = {
    /**
     * Get eligible items for compilation
     */
    async getEligibleItems(params: {
        supplierId: string;
        storeId: string;
        periodStart: string;
        periodEnd: string;
    }): Promise<{ data: EligibleItem[]; count: number }> {
        const response = await apiClient.get('/supplier-invoices/eligible-items', { params });
        return response.data;
    },

    /**
     * Create draft invoice
     */
    async createDraftInvoice(data: {
        supplierId: string;
        storeId: string;
        periodStart: string;
        periodEnd: string;
        selectedGrnItemIds: string[];
    }): Promise<{ data: SupplierInvoice }> {
        const response = await apiClient.post('/supplier-invoices/draft', data);
        return response.data;
    },

    /**
     * Get all invoices
     */
    async getInvoices(params?: {
        storeId?: string;
        supplierId?: string;
        status?: string;
        periodStart?: string;
        periodEnd?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ data: SupplierInvoice[]; pagination: any }> {
        const response = await apiClient.get('/supplier-invoices', { params });
        return response.data;
    },

    /**
     * Get invoice by ID
     */
    async getInvoiceById(id: string): Promise<{ data: SupplierInvoice }> {
        const response = await apiClient.get(`/supplier-invoices/${id}`);
        return response.data;
    },

    /**
     * Update draft invoice
     */
    async updateDraftInvoice(
        id: string,
        data: {
            notes?: string;
            supplierInvoiceNo?: string;
            supplierInvoiceDate?: string;
        }
    ): Promise<{ data: SupplierInvoice }> {
        const response = await apiClient.patch(`/supplier-invoices/${id}`, data);
        return response.data;
    },

    /**
     * Confirm invoice
     */
    async confirmInvoice(id: string): Promise<{ data: SupplierInvoice }> {
        const response = await apiClient.post(`/supplier-invoices/${id}/confirm`);
        return response.data;
    },

    /**
     * Record payment
     */
    async recordPayment(
        id: string,
        data: {
            amount: number;
            paymentDate: string;
            paymentMethod: string;
            referenceNumber?: string;
            notes?: string;
        }
    ): Promise<{ data: SupplierInvoice }> {
        const response = await apiClient.post(`/supplier-invoices/${id}/payments`, data);
        return response.data;
    },

    /**
     * Delete draft invoice
     */
    async deleteDraftInvoice(id: string): Promise<void> {
        await apiClient.delete(`/supplier-invoices/${id}`);
    },
};

import { apiClient } from './client';

export interface GRNForInvoicing {
    id: string;
    grnNumber: string;
    receivedDate: string;
    supplier: {
        id: string;
        name: string;
        gstin?: string;
    };
    supplierInvoiceNo?: string;
    total: number;
    itemsCount: number;
    isInvoiced: boolean;
    consolidatedInvoice?: {
        id: string;
        invoiceNumber: string;
        status: string;
    };
}

export interface ConsolidatedInvoice {
    id: string;
    invoiceNumber: string;
    storeId: string;
    supplierId?: string;
    invoiceDate: string;
    periodStart?: string;
    periodEnd?: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    type: 'SINGLE_SUPPLIER' | 'MULTI_SUPPLIER' | 'PERIOD';
    status: 'DRAFT' | 'FINALIZED' | 'SENT' | 'ARCHIVED';
    notes?: string;
    supplier?: {
        id: string;
        name: string;
        gstin?: string;
        contactName?: string;
        phoneNumber?: string;
    };
    store?: any;
    items: ConsolidatedInvoiceItem[];
    grns: Array<{
        id: string;
        grn: {
            grnNumber: string;
            receivedDate: string;
            supplierInvoiceNo?: string;
            supplierInvoiceDate?: string;
        };
    }>;
    grnsCount?: number;
    itemsCount?: number;
    createdBy: string;
    createdByUser?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ConsolidatedInvoiceItem {
    id: string;
    drugId: string;
    drugName: string;
    batchNumber?: string;
    totalQuantity: number;
    unit: string;
    unitPrice: number;
    gstPercent: number;
    discountPercent: number;
    subtotal: number;
    taxAmount: number;
    lineTotal: number;
}

export interface CreateInvoiceData {
    grnIds: string[];
    type?: 'SINGLE_SUPPLIER' | 'MULTI_SUPPLIER' | 'PERIOD';
    periodStart?: string;
    periodEnd?: string;
    notes?: string;
}

export const consolidatedInvoicesApi = {
    /**
     * Get GRNs available for invoicing
     */
    async getGRNsForInvoicing(params?: {
        startDate?: string;
        endDate?: string;
        supplierId?: string;
        status?: 'all' | 'not_invoiced';
    }) {
        const query = new URLSearchParams();
        if (params?.startDate) query.append('startDate', params.startDate);
        if (params?.endDate) query.append('endDate', params.endDate);
        if (params?.supplierId) query.append('supplierId', params.supplierId);
        if (params?.status) query.append('status', params.status);

        const response = await apiClient.get(`/consolidated-invoices/grns?${query.toString()}`);
        return response.data;
    },

    /**
     * Create consolidated invoice
     */
    async createInvoice(data: CreateInvoiceData) {
        const response = await apiClient.post('/consolidated-invoices', data);
        return response.data;
    },

    /**
     * Get invoice by ID
     */
    async getInvoiceById(id: string) {
        const response = await apiClient.get(`/consolidated-invoices/${id}`);
        return response.data;
    },

    /**
     * List all consolidated invoices
     */
    async listInvoices(params?: {
        page?: number;
        limit?: number;
        status?: string;
        supplierId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
    }) {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.status) query.append('status', params.status);
        if (params?.supplierId) query.append('supplierId', params.supplierId);
        if (params?.startDate) query.append('startDate', params.startDate);
        if (params?.endDate) query.append('endDate', params.endDate);
        if (params?.search) query.append('search', params.search);

        const response = await apiClient.get(`/consolidated-invoices?${query.toString()}`);
        return response.data;
    },

    /**
     * Update invoice status
     */
    async updateStatus(id: string, status: 'DRAFT' | 'FINALIZED' | 'SENT' | 'ARCHIVED') {
        const response = await apiClient.patch(`/consolidated-invoices/${id}/status`, { status });
        return response.data;
    },

    /**
     * Finalize invoice
     */
    async finalizeInvoice(id: string) {
        const response = await apiClient.post(`/consolidated-invoices/${id}/finalize`);
        return response.data;
    },

    /**
     * Delete invoice
     */
    async deleteInvoice(id: string) {
        const response = await apiClient.delete(`/consolidated-invoices/${id}`);
        return response.data;
    }
};

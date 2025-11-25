import { apiClient } from './client';

export interface SupplierLicense {
    id?: string;
    type: string;
    number: string;
    validFrom: string;
    validTo: string;
    documentUrl?: string;
}

export interface Supplier {
    id: string;
    name: string;
    category: string;
    status: string;
    gstin?: string;
    dlNumber?: string;
    pan?: string;
    contactName: string;
    phoneNumber: string;
    email?: string;
    whatsapp?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    paymentTerms?: string;
    creditLimit?: number;
    licenses?: SupplierLicense[];
    createdAt: string;
    updatedAt: string;
}

export interface SupplierStats {
    total: number;
    active: number;
    expiringLicenses: number;
    outstanding: number;
}

export const supplierApi = {
    /**
     * Get suppliers with pagination and filtering
     */
    async getSuppliers(params: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        status?: string;
    } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.category) query.append('category', params.category);
        if (params.status) query.append('status', params.status);

        const response = await apiClient.get(`/suppliers?${query.toString()}`);
        return response;
    },

    /**
     * Get supplier by ID
     */
    async getSupplierById(id: string) {
        const response = await apiClient.get(`/suppliers/${id}`);
        return response;
    },

    /**
     * Create new supplier
     */
    async createSupplier(data: Partial<Supplier>) {
        const response = await apiClient.post('/suppliers', data);
        return response;
    },

    /**
     * Update supplier
     */
    async updateSupplier(id: string, data: Partial<Supplier>) {
        const response = await apiClient.put(`/suppliers/${id}`, data);
        return response;
    },

    /**
     * Delete supplier
     */
    async deleteSupplier(id: string) {
        const response = await apiClient.delete(`/suppliers/${id}`);
        return response;
    },

    /**
     * Get supplier statistics
     */
    async getStats(): Promise<{ success: boolean; data: SupplierStats }> {
        const response = await apiClient.get('/suppliers/stats');
        return response;
    }
};

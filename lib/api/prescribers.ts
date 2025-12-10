import { apiClient } from './client';

export interface Prescriber {
    id: string;
    storeId: string;
    name: string;
    licenseNumber: string;
    clinic?: string;
    phoneNumber?: string;
    email?: string;
    specialty?: string;
    createdAt: string;
    updatedAt: string;
}

export const prescribersApi = {
    /**
     * Get all prescribers with optional search
     */
    async getPrescribers(params: { search?: string; storeId?: string } = {}) {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.storeId) query.append('storeId', params.storeId);

        const response = await apiClient.get(`/prescribers?${query.toString()}`);
        return response;
    },

    /**
     * Create new prescriber
     */
    async createPrescriber(data: Partial<Prescriber>) {
        const response = await apiClient.post('/prescribers', data);
        return response; // Return full response (axios response object or intercepted response)
    }
};

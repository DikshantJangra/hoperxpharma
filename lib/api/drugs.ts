import { apiClient } from '@/lib/api/client';

export const drugApi = {
    // Search drugs
    async searchDrugs(query: string) {
        return apiClient.get(`/drugs/search?q=${encodeURIComponent(query)}`);
    },

    // Get drug by ID
    async getDrugById(id: string) {
        return apiClient.get(`/drugs/${id}`);
    },

    // Update drug
    async updateDrug(id: string, data: any) {
        return apiClient.put(`/inventory/drugs/${id}`, data);
    },

    // Delete drug
    async deleteDrug(id: string) {
        return apiClient.delete(`/inventory/drugs/${id}`);
    }
};

export const patientApi = {
    // Search patients
    async searchPatients(query: string) {
        return apiClient.get(`/patients/search?q=${encodeURIComponent(query)}`);
    },

    // Get patient by ID
    async getPatientById(id: string) {
        return apiClient.get(`/patients/${id}`);
    },

    // Create new patient
    async createPatient(data: any) {
        return apiClient.post('/patients', data);
    }
};

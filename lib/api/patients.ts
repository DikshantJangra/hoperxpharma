import { apiClient } from './client';

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    bloodGroup?: string;
    allergies?: string[];
    chronicConditions?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface PatientConsent {
    id: string;
    patientId: string;
    consentType: string;
    consentGiven: boolean;
    consentDate: string;
    expiryDate?: string;
}

export interface PatientInsurance {
    id: string;
    patientId: string;
    provider: string;
    policyNumber: string;
    validFrom: string;
    validTo: string;
    coverageAmount?: number;
}

export interface PatientStats {
    totalPatients: number;
    newPatientsThisMonth: number;
    activePatients: number;
    averageAge: number;
}

export const patientsApi = {
    /**
     * Get all patients with pagination and filtering
     */
    async getPatients(params: { page?: number; limit?: number; search?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);

        const response = await apiClient.get(`/patients?${query.toString()}`);
        return response.data;
    },

    /**
     * Get patient by ID
     */
    async getPatientById(id: string) {
        const response = await apiClient.get(`/patients/${id}`);
        return response.data;
    },

    /**
     * Create new patient
     */
    async createPatient(data: Partial<Patient>) {
        const response = await apiClient.post('/patients', data);
        return response.data;
    },

    /**
     * Update patient
     */
    async updatePatient(id: string, data: Partial<Patient>) {
        const response = await apiClient.put(`/patients/${id}`, data);
        return response.data;
    },

    /**
     * Delete patient (soft delete)
     */
    async deletePatient(id: string) {
        const response = await apiClient.delete(`/patients/${id}`);
        return response.data;
    },

    /**
     * Create patient consent
     */
    async createConsent(data: Partial<PatientConsent>) {
        const response = await apiClient.post('/patients/consents', data);
        return response.data;
    },

    /**
     * Add patient insurance
     */
    async addInsurance(patientId: string, data: Partial<PatientInsurance>) {
        const response = await apiClient.post(`/patients/${patientId}/insurance`, data);
        return response.data;
    },

    /**
     * Get patient statistics
     */
    async getStats() {
        const response = await apiClient.get('/patients/stats');
        return response.data;
    }
};

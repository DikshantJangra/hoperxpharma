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
    storeId?: string;
    currentBalance?: number;
    creditLimit?: number;
    lifecycleStage?: 'IDENTIFIED' | 'ESTABLISHED' | 'TRUSTED' | 'CREDIT_ELIGIBLE';
    manualTrustLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    creditEnabled?: boolean;
    profileStrength?: number;
    lastVisitAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PatientConsent {
    id: string;
    patientId: string;
    type: string;
    status: string;
    consentType?: string;
    consentGiven?: boolean;
    grantedDate?: string;
    consentDate?: string;
    expiryDate?: string;
}

export interface PatientInsurance {
    id: string;
    patientId: string;
    provider: string;
    policyNumber: string;
    validFrom: string;
    validTo: string;
    status?: string;
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
        return response; // Return full response with pagination meta
    },

    /**
     * Get patient by ID
     */
    async getPatientById(id: string) {
        const response = await apiClient.get(`/patients/${id}`);
        return response.data;
    },

    async getPatientInsights(id: string) {
        const response = await apiClient.get(`/patients/${id}/insights`);
        return response.data;
    },

    async getCreditAssessment(id: string, saleTotal?: number) {
        const query = new URLSearchParams();
        if (saleTotal !== undefined) query.append('saleTotal', saleTotal.toString());
        const response = await apiClient.get(`/patients/${id}/credit-assessment?${query.toString()}`);
        return response.data;
    },

    async getCreditPolicy() {
        const response = await apiClient.get('/patients/credit-policy');
        return response.data;
    },

    async updateCreditPolicy(data: {
        maxCreditIdentified?: number;
        maxCreditEstablished?: number;
        maxCreditTrusted?: number;
        gracePeriodDays?: number;
        lateAfterDays?: number;
        autoSuspendAfterLates?: number;
        minOnTimeRate?: number;
        minVisitsEstablished?: number;
        minVisitsTrusted?: number;
        minDaysSinceFirstVisit?: number;
        riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH';
    }) {
        const response = await apiClient.put('/patients/credit-policy', data);
        return response.data;
    },

    /**
     * Create new patient
     */
    async createPatient(data: Partial<Patient>) {
        const response = await apiClient.post('/patients', data);
        return response; // Return full response with success, message, data
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
    },

    /**
     * Get patient history timeline
     */
    async getPatientHistory(patientId: string, params: { eventType?: string; from?: string; to?: string } = {}) {
        const query = new URLSearchParams();
        if (params.eventType) query.append('eventType', params.eventType);
        if (params.from) query.append('from', params.from);
        if (params.to) query.append('to', params.to);

        const response = await apiClient.get(`/patients/${patientId}/history?${query.toString()}`);
        return response.data;
    },

    /**
     * Get refills due
     */
    async getRefillsDue(params: { status?: string; search?: string } = {}) {
        const query = new URLSearchParams();
        if (params.status) query.append('status', params.status);
        if (params.search) query.append('search', params.search);

        const response = await apiClient.get(`/patients/refills?${query.toString()}`);
        return response.data;
    },

    /**
     * Process a refill (creates adherence + sale)
     */
    async processRefill(patientId: string, data: {
        items: Array<{ prescriptionId: string; drugId: string; quantity: number; expectedRefillDate?: string }>;
        storeId: string;
    }) {
        const response = await apiClient.post(`/patients/${patientId}/refills`, data);
        return response.data;
    },

    /**
     * Get adherence data
     */
    async getAdherence(patientId: string) {
        const response = await apiClient.get(`/patients/${patientId}/adherence`);
        return response.data;
    },

    /**
     * Record adherence
     */
    async recordAdherence(patientId: string, data: { prescriptionId: string; expectedRefillDate: string; actualRefillDate?: string; adherenceRate: number }) {
        const response = await apiClient.post(`/patients/${patientId}/adherence`, data);
        return response.data;
    },

    /**
     * Get all consents (for consents page)
     */
    async getAllConsents(params: { status?: string; page?: number; limit?: number } = {}) {
        const query = new URLSearchParams();
        if (params.status) query.append('status', params.status);
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());

        const response = await apiClient.get(`/patients/consents/all?${query.toString()}`);
        return response.data;
    },

    /**
     * Withdraw consent
     */
    async withdrawConsent(consentId: string) {
        const response = await apiClient.put(`/patients/consents/${consentId}/withdraw`);
        return response.data;
    },

    /**
     * Get patient consents
     */
    async getPatientConsents(patientId: string) {
        const response = await apiClient.get(`/patients/${patientId}/consents`);
        return response.data;
    },

    /**
     * Merge two patients
     */
    async mergePatients(targetId: string, sourceId: string) {
        const response = await apiClient.post(`/patients/merge`, { targetId, sourceId });
        return response.data;
    },

    /**
     * Get patient audit logs
     */
    async getAuditLogs(patientId: string) {
        const response = await apiClient.get(`/patients/${patientId}/audit-logs`);
        return response.data;
    },

    getLedger: async (id: string, params?: { page?: number; limit?: number }) => {
        try {
            const query = new URLSearchParams();
            if (params?.page) query.append('page', params.page.toString());
            if (params?.limit) query.append('limit', params.limit.toString());

            const response = await apiClient.get(`/patients/${id}/ledger?${query.toString()}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    getDebtors: async (params?: { page?: number; limit?: number; search?: string; sort?: string }) => {
        try {
            const query = new URLSearchParams();
            if (params?.page) query.append('page', params.page.toString());
            if (params?.limit) query.append('limit', params.limit.toString());
            if (params?.search) query.append('search', params.search);
            if (params?.sort) query.append('sort', params.sort);

            const response = await apiClient.get(`/patients/debtors?${query.toString()}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    syncBalance: async (id: string) => {
        const response = await apiClient.post(`/patients/${id}/sync-balance`);
        return response.data;
    }
};

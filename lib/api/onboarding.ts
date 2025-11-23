import { apiClient } from './client';

export interface OnboardingProgress {
    completed: boolean;
    steps: {
        storeCreated: boolean;
        licensesAdded: boolean;
        hoursConfigured: boolean;
        subscriptionActive: boolean;
    };
    currentStep: string;
    storeId?: string;
}

export interface StoreData {
    name: string;
    gstin?: string;
    dlNumber?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    phoneNumber: string;
    email?: string;
    whatsapp?: string;
}

export interface LicenseData {
    type: 'Drug License' | 'FSSAI' | 'GST' | 'Other';
    licenseNumber: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate: string;
    documentUrl?: string;
}

export interface OperatingHoursData {
    dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

export const onboardingApi = {
    /**
     * Get onboarding progress
     */
    async getProgress() {
        const response = await apiClient.get('/onboarding/progress');
        return response.data;
    },

    /**
     * Save onboarding progress
     */
    async saveProgress(data: {
        currentStep: number;
        completedSteps: number[];
        data: any;
        isComplete: boolean;
    }) {
        const response = await apiClient.post('/onboarding/progress', data);
        return response.data;
    },

    /**
     * Create store (Step 1)
     */
    async createStore(data: StoreData) {
        const response = await apiClient.post('/onboarding/store', data);
        return response.data;
    },

    /**
     * Add licenses (Step 2)
     */
    async addLicenses(storeId: string, licenses: LicenseData[]) {
        const response = await apiClient.post(`/onboarding/store/${storeId}/licenses`, { licenses });
        return response.data;
    },

    /**
     * Set operating hours (Step 3)
     */
    async setOperatingHours(storeId: string, hours: OperatingHoursData[]) {
        const response = await apiClient.post(`/onboarding/store/${storeId}/hours`, { hours });
        return response.data;
    },

    /**
     * Select subscription plan (Step 4)
     */
    async selectPlan(storeId: string, planId: string) {
        const response = await apiClient.post(`/onboarding/store/${storeId}/subscription`, { planId });
        return response.data;
    },

    /**
     * Complete onboarding (all at once)
     */
    async completeOnboarding(data: {
        store: StoreData;
        licenses?: LicenseData[];
        operatingHours?: OperatingHoursData[];
    }) {
        const response = await apiClient.post('/onboarding/complete', data);
        return response.data;
    },

    /**
     * Mark onboarding as complete
     */
    async markComplete() {
        const response = await apiClient.post('/onboarding/mark-complete');
        return response.data;
    }
};

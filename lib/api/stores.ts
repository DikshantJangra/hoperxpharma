import { apiClient } from './client';

export interface Store {
    id: string;
    name: string;
    displayName?: string;
    email?: string;
    phoneNumber: string;
    addressLine1: string;
    city: string;
    state: string;
    pinCode: string;
    gstin?: string;
    dlNumber?: string;
    createdAt: string;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    displayName: string;
    description: string;
    price: number;
    currency: string;
    billingCycle: string;
    maxPatients?: number;
    maxPrescriptions?: number;
    maxStorageGB?: number;
    whatsappIntegration: boolean;
    advancedAnalytics: boolean;
    multiStoreSupport: boolean;
    apiAccess: boolean;
}

export interface Subscription {
    id: string;
    storeId: string;
    planId: string;
    status: string;
    startDate: string;
    endDate: string;
    plan: SubscriptionPlan;
}

export interface UsageStats {
    patients: number;
    prescriptions: number;
    storageGB: number;
}

export const storesApi = {
    /**
     * Get user's stores
     */
    async getStores() {
        const response = await apiClient.get('/stores');
        return response.data as Store[];
    },

    /**
     * Get store by ID
     */
    async getStoreById(id: string) {
        const response = await apiClient.get(`/stores/${id}`);
        return response.data as Store;
    },

    /**
     * Update store
     */
    async updateStore(id: string, data: Partial<Store>) {
        const response = await apiClient.put(`/stores/${id}`, data);
        return response.data;
    },

    /**
     * Get store statistics
     */
    async getStoreStats(id: string) {
        const response = await apiClient.get(`/stores/${id}/stats`);
        return response.data;
    },

    /**
     * Get available subscription plans
     */
    async getPlans() {
        const response = await apiClient.get('/stores/subscriptions/plans');
        return response.data as SubscriptionPlan[];
    },

    /**
     * Get store subscription
     */
    async getSubscription(storeId: string) {
        const response = await apiClient.get(`/stores/${storeId}/subscription`);
        return response.data as Subscription;
    },

    /**
     * Get subscription usage
     */
    async getUsage(storeId: string) {
        const response = await apiClient.get(`/stores/${storeId}/subscription/usage`);
        return response.data;
    }
};

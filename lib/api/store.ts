import { apiClient } from './client';

export const storeApi = {
    /**
     * Get current user's store information
     */
    async getMyStore() {
        return apiClient.get('/stores/me');
    },

    /**
     * Get all stores for the current user
     */
    async getMyStores() {
        return apiClient.get('/stores');
    },

    /**
     * Update store information
     */
    async updateStore(storeId: string, data: any) {
        return apiClient.put(`/stores/${storeId}`, data);
    },
};

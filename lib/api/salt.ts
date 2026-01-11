import { apiClient } from './client';

export const saltApi = {
    /**
     * Search salts
     */
    search: async (query: string): Promise<any[]> => {
        const response = await apiClient.get('/salt/search', {
            params: { q: query }
        });
        return response.data || [];
    },

    /**
     * Get alternatives for a drug
     */
    getAlternatives: async (drugId: string, storeId: string, minStock: number = 1): Promise<any> => {
        const response = await apiClient.get('/salt/alternatives', {
            params: {
                drugId,
                storeId,
                minStock
            }
        });
        return response.data || {};
    }
};

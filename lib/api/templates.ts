import { apiClient } from './client';

export interface Template {
    id: string;
    name: string;
    channel: string;
    category?: string;
    subject?: string;
    bodyHtml?: string;
    content?: string; // For SMS/WhatsApp
    variables?: string[];
    createdAt: string;
    updatedAt: string;
}

export const templatesApi = {
    /**
     * Get all templates
     */
    getTemplates: async () => {
        const response = await apiClient.get('/email/templates');
        return response.data;
    },

    /**
     * Create a new template
     */
    createTemplate: async (data: Partial<Template>) => {
        const response = await apiClient.post('/email/templates', data);
        return response.data;
    },

    /**
     * Update a template
     */
    updateTemplate: async (id: string, data: Partial<Template>) => {
        const response = await apiClient.put(`/email/templates/${id}`, data);
        return response.data;
    },

    /**
     * Delete a template
     */
    deleteTemplate: async (id: string) => {
        const response = await apiClient.delete(`/email/templates/${id}`);
        return response.data;
    },

    /**
     * Get a single template
     */
    getTemplate: async (id: string) => {
        const response = await apiClient.get(`/email/templates/${id}`);
        return response.data;
    }
};

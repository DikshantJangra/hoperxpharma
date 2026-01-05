import { apiClient, tokenManager } from './client';
import { getApiBaseUrl } from '@/lib/config/env';

export interface AuditLog {
    id: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    actor: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    action: string;
    resource: {
        type: string;
        id: string;
    };
    summary: string;
    ip: string;
    location: string;
    tags: string[];
    changes?: any;
}

export interface AccessLog {
    id: string;
    timestamp: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    eventType: string;
    loginMethod?: string; // password, magic_link, google_oauth
    ipAddress: string;
    userAgent?: string;
    deviceInfo?: string;
    status: 'success' | 'failed' | 'blocked' | 'challenged';
    risk: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExportJob {
    id: string;
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    format: 'json' | 'csv' | 'pdf';
    createdAt: string;
    filePath?: string;
    fileSize?: number;
}

export interface AuditFilters {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface AccessFilters {
    userId?: string;
    eventType?: string;
    ipAddress?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Helper function to build query string
function buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            query.append(key, String(value));
        }
    });
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
}

export const auditApi = {
    // Activity Log APIs
    async getActivityLogs(filters: AuditFilters = {}) {
        const queryString = buildQueryString(filters);
        const response = await apiClient.get(`/audit/activity${queryString}`);
        return response;
    },

    async getActivityById(id: string) {
        const response = await apiClient.get(`/audit/activity/${id}`);
        return response;
    },

    async getActivityStats(startDate?: string, endDate?: string) {
        const queryString = buildQueryString({ startDate, endDate });
        const response = await apiClient.get(`/audit/activity/stats${queryString}`);
        return response;
    },

    async searchActivities(query: string, limit?: number) {
        const response = await apiClient.post('/audit/activity/search', { query, limit });
        return response;
    },

    async getActivityByEntity(entityType: string, entityId: string) {
        const response = await apiClient.get(`/audit/activity/entity/${entityType}/${entityId}`);
        return response;
    },

    // Access Log APIs
    async getAccessLogs(filters: AccessFilters = {}) {
        const queryString = buildQueryString(filters);
        const response = await apiClient.get(`/audit/access${queryString}`);
        return response;
    },

    async getAccessById(id: string) {
        const response = await apiClient.get(`/audit/access/${id}`);
        return response;
    },

    async getAccessStats(startDate?: string, endDate?: string) {
        const queryString = buildQueryString({ startDate, endDate });
        const response = await apiClient.get(`/audit/access/stats${queryString}`);
        return response;
    },

    async getSuspiciousActivities() {
        const response = await apiClient.get('/audit/access/suspicious');
        return response;
    },

    async getFailedAttempts(userId: string, hours?: number) {
        const queryString = buildQueryString({ hours });
        const response = await apiClient.get(`/audit/access/failed/${userId}${queryString}`);
        return response;
    },

    async searchAccessLogs(query: string, limit?: number) {
        const response = await apiClient.post('/audit/access/search', { query, limit });
        return response;
    },

    // Export APIs
    async createExport(exportType: 'activity' | 'access', format: 'json' | 'csv', filters?: any) {
        const response = await apiClient.post('/audit/exports', {
            exportType,
            format,
            filters,
        });
        return response;
    },

    async getExports(filters: any = {}) {
        const queryString = buildQueryString(filters);
        const response = await apiClient.get(`/audit/exports${queryString}`);
        return response;
    },

    async getExportById(id: string) {
        const response = await apiClient.get(`/audit/exports/${id}`);
        return response;
    },

    async downloadExport(id: string): Promise<Blob> {
        // Use direct fetch for blob response
        const token = tokenManager.getAccessToken();
        const response = await fetch(
            `${getApiBaseUrl()}/audit/exports/${id}/download`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include', // Send cookies for httpOnly token
            }
        );

        if (!response.ok) {
            throw new Error('Failed to download export');
        }

        return await response.blob();
    },

    async deleteExport(id: string) {
        const response = await apiClient.delete(`/audit/exports/${id}`);
        return response;
    },

    // Saved Filter APIs
    async createSavedFilter(data: any) {
        const response = await apiClient.post('/audit/filters', data);
        return response;
    },

    async getSavedFilters() {
        const response = await apiClient.get('/audit/filters');
        return response;
    },

    async deleteSavedFilter(id: string) {
        const response = await apiClient.delete(`/audit/filters/${id}`);
        return response;
    },
};

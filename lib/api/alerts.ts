import { baseFetch } from './client';

export interface Alert {
    id: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    title: string;
    description: string;
    source: string;
    priority: string;
    status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'SNOOZED' | 'DISMISSED';
    relatedType?: string;
    relatedId?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    snoozeUntil?: string;
    createdAt: string;
}

export interface AlertCounts {
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
}

export interface CreateAlertData {
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    title: string;
    description: string;
    relatedType?: string;
    relatedId?: string;
}

export const alertsApi = {
    /**
     * Get all alerts with optional filters
     */
    async getAlerts(filters?: {
        type?: string;
        severity?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<Alert[]> {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.severity) params.append('severity', filters.severity);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const queryString = params.toString();
        const url = `/alerts${queryString ? `?${queryString}` : ''}`;

        const response: any = await baseFetch(url);
        return response.data || [];
    },

    /**
     * Get alert counts
     */
    async getAlertCounts(): Promise<AlertCounts> {
        const response: any = await baseFetch('/alerts/count');
        return response.data;
    },

    /**
     * Get alert by ID
     */
    async getAlertById(id: string): Promise<Alert> {
        const response: any = await baseFetch(`/alerts/${id}`);
        return response.data;
    },

    /**
     * Create a new alert
     */
    async createAlert(data: CreateAlertData): Promise<Alert> {
        const response: any = await baseFetch('/alerts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * Acknowledge an alert
     */
    async acknowledgeAlert(id: string): Promise<Alert> {
        const response: any = await baseFetch(`/alerts/${id}/acknowledge`, {
            method: 'PATCH',
        });
        return response.data;
    },

    /**
     * Resolve an alert
     */
    async resolveAlert(id: string, resolution?: string): Promise<Alert> {
        const response: any = await baseFetch(`/alerts/${id}/resolve`, {
            method: 'PATCH',
            body: JSON.stringify({ resolution }),
        });
        return response.data;
    },

    /**
     * Snooze an alert
     */
    async snoozeAlert(id: string, snoozeUntil: Date): Promise<Alert> {
        const response: any = await baseFetch(`/alerts/${id}/snooze`, {
            method: 'PATCH',
            body: JSON.stringify({ snoozeUntil: snoozeUntil.toISOString() }),
        });
        return response.data;
    },

    /**
     * Dismiss an alert
     */
    async dismissAlert(id: string): Promise<Alert> {
        const response: any = await baseFetch(`/alerts/${id}/dismiss`, {
            method: 'PATCH',
        });
        return response.data;
    },

    /**
     * Delete an alert (admin only)
     */
    async deleteAlert(id: string): Promise<void> {
        await baseFetch(`/alerts/${id}`, {
            method: 'DELETE',
        });
    },
};

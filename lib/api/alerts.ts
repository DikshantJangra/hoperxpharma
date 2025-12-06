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

        return baseFetch<Alert[]>(url);
    },

    /**
     * Get alert counts
     */
    async getAlertCounts(): Promise<AlertCounts> {
        return baseFetch<AlertCounts>('/alerts/count');
    },

    /**
     * Get alert by ID
     */
    async getAlertById(id: string): Promise<Alert> {
        return baseFetch<Alert>(`/alerts/${id}`);
    },

    /**
     * Create a new alert
     */
    async createAlert(data: CreateAlertData): Promise<Alert> {
        return baseFetch<Alert>('/alerts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Acknowledge an alert
     */
    async acknowledgeAlert(id: string): Promise<Alert> {
        return baseFetch<Alert>(`/alerts/${id}/acknowledge`, {
            method: 'PATCH',
        });
    },

    /**
     * Resolve an alert
     */
    async resolveAlert(id: string, resolution?: string): Promise<Alert> {
        return baseFetch<Alert>(`/alerts/${id}/resolve`, {
            method: 'PATCH',
            body: JSON.stringify({ resolution }),
        });
    },

    /**
     * Snooze an alert
     */
    async snoozeAlert(id: string, snoozeUntil: Date): Promise<Alert> {
        return baseFetch<Alert>(`/alerts/${id}/snooze`, {
            method: 'PATCH',
            body: JSON.stringify({ snoozeUntil: snoozeUntil.toISOString() }),
        });
    },

    /**
     * Dismiss an alert
     */
    async dismissAlert(id: string): Promise<Alert> {
        return baseFetch<Alert>(`/alerts/${id}/dismiss`, {
            method: 'PATCH',
        });
    },

    /**
     * Delete an alert (admin only)
     */
    async deleteAlert(id: string): Promise<void> {
        return baseFetch<void>(`/alerts/${id}`, {
            method: 'DELETE',
        });
    },
};

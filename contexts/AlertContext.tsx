"use client";

// Refreshed imports
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiClient } from '@/lib/api/client';

interface Alert {
    id: string;
    title: string;
    description: string;
    type?: string;
    category: 'INVENTORY' | 'SECURITY' | 'PATIENT' | 'BILLING' | 'SYSTEM' | 'CLINICAL';
    severity?: 'CRITICAL' | 'MODERATE' | 'MINOR';
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'NEW' | 'SNOOZED' | 'RESOLVED';
    seenAt?: string;
    actionUrl?: string;
    actionLabel?: string;
    createdAt: string;
}

interface AlertCounts {
    total: number;
    unread: {
        total: number;
        criticalHigh: number;
    };
    byPriority: {
        CRITICAL?: number;
        HIGH?: number;
        MEDIUM?: number;
        LOW?: number;
    };
}

interface AlertContextType {
    alerts: Alert[];
    counts: AlertCounts | null;
    isLoading: boolean;
    unreadCount: number;
    isPanelOpen: boolean;
    togglePanel: () => void;
    setIsPanelOpen: (open: boolean) => void;
    refreshAlerts: () => Promise<void>;
    markAsSeen: (id: string) => Promise<void>;
    markAllAsSeen: () => Promise<void>;
    resolveAlert: (id: string) => Promise<void>;
    dismissAlert: (id: string) => Promise<void>;
    snoozeAlert: (id: string, until: Date) => Promise<void>;
    bulkDismiss: (ids: string[]) => Promise<void>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [counts, setCounts] = useState<AlertCounts | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const unreadCount = alerts.filter(a => a.status === 'NEW').length;

    const togglePanel = useCallback(() => {
        setIsPanelOpen(prev => !prev);
    }, []);

    const fetchAlerts = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get('/alerts', { params: { limit: 50 } });
            if (response.success) {
                setAlerts(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchCounts = useCallback(async () => {
        try {
            const response = await apiClient.get('/alerts/counts');
            if (response.success) {
                setCounts(response.data);
            }
        } catch (error) {
            console.error('Error fetching alert counts:', error);
        }
    }, []);

    const refreshAlerts = useCallback(async () => {
        await Promise.all([fetchAlerts(), fetchCounts()]);
    }, [fetchAlerts, fetchCounts]);

    const markAsSeen = useCallback(async (id: string) => {
        try {
            const response = await apiClient.patch(`/alerts/${id}/seen`);
            if (response.success) {
                // Update local state optimistically
                setAlerts((prev) =>
                    prev.map((alert) =>
                        alert.id === id ? { ...alert, status: 'SNOOZED' as const, seenAt: new Date().toISOString() } : alert
                    )
                );
            }
        } catch (error) {
            console.error('Error marking alert as seen:', error);
        }
    }, []);

    const markAllAsSeen = useCallback(async () => {
        const newAlerts = alerts.filter(a => a.status === 'NEW');
        if (newAlerts.length === 0) return;

        // Optimistic update
        setAlerts((prev) =>
            prev.map((alert) =>
                alert.status === 'NEW' ? { ...alert, status: 'SNOOZED' as const, seenAt: new Date().toISOString() } : alert
            )
        );
        try {
            await Promise.all(newAlerts.map(a => apiClient.patch(`/alerts/${a.id}/seen`)));
        } catch (error) {
            console.error('Error marking all as seen:', error);
            refreshAlerts();
        }
    }, [alerts, refreshAlerts]);

    const dismissAlert = useCallback(async (id: string) => {
        // Optimistic update - remove immediately
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        try {
            await apiClient.patch(`/alerts/${id}/dismiss`);
        } catch (error) {
            console.error('Error dismissing alert:', error);
            refreshAlerts();
        }
    }, [refreshAlerts]);

    const resolveAlert = useCallback(async (id: string) => {
        try {
            const response = await apiClient.patch(`/alerts/${id}/resolve`);
            if (response.success) {
                setAlerts((prev) => prev.filter((alert) => alert.id !== id));
                await fetchCounts();
            }
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    }, [fetchCounts]);

    const snoozeAlert = useCallback(async (id: string, until: Date) => {
        try {
            const response = await apiClient.patch(`/alerts/${id}/snooze`, {
                snoozeUntil: until.toISOString()
            });
            if (response.success) {
                setAlerts((prev) => prev.filter((alert) => alert.id !== id));
                await fetchCounts();
            }
        } catch (error) {
            console.error('Error snoozing alert:', error);
        }
    }, [fetchCounts]);

    const bulkDismiss = useCallback(async (ids: string[]) => {
        try {
            const response = await apiClient.post('/alerts/bulk/dismiss', {
                alertIds: ids
            });
            if (response.success) {
                setAlerts((prev) => prev.filter((alert) => !ids.includes(alert.id)));
                await fetchCounts();
            }
        } catch (error) {
            console.error('Error bulk dismissing:', error);
        }
    }, [fetchCounts]);

    const { isAuthenticated } = useAuthStore();

    // Initial load and polling
    useEffect(() => {
        if (!isAuthenticated) return;

        refreshAlerts();

        // Poll every 30 seconds
        const interval = setInterval(refreshAlerts, 30000);

        return () => clearInterval(interval);
    }, [refreshAlerts, isAuthenticated]);

    return (
        <AlertContext.Provider
            value={{
                alerts,
                counts,
                isLoading,
                unreadCount,
                isPanelOpen,
                togglePanel,
                setIsPanelOpen,
                refreshAlerts,
                markAsSeen,
                markAllAsSeen,
                resolveAlert,
                dismissAlert,
                snoozeAlert,
                bulkDismiss,
            }}
        >
            {children}
        </AlertContext.Provider>
    );
}

export function useAlerts() {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlerts must be used within AlertProvider');
    }
    return context;
}

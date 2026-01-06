'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { getApiBaseUrl } from '@/lib/config/env';

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

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [counts, setCounts] = useState<AlertCounts | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Get API base URL for direct backend access (critical for cross-browser cookie support)
    const apiBaseUrl = useMemo(() => {
        try {
            return getApiBaseUrl();
        } catch {
            return '';
        }
    }, []);

    const unreadCount = alerts.filter(a => a.status === 'NEW').length;

    const togglePanel = useCallback(() => {
        setIsPanelOpen(prev => !prev);
    }, []);

    const fetchAlerts = useCallback(async () => {
        if (!apiBaseUrl) return;
        try {
            setIsLoading(true);
            const response = await fetch(`${apiBaseUrl}/alerts?limit=50`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setAlerts(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setIsLoading(false);
        }
    }, [apiBaseUrl]);

    const fetchCounts = useCallback(async () => {
        if (!apiBaseUrl) return;
        try {
            const response = await fetch(`${apiBaseUrl}/alerts/counts`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setCounts(data.data);
            }
        } catch (error) {
            console.error('Error fetching alert counts:', error);
        }
    }, [apiBaseUrl]);

    const refreshAlerts = useCallback(async () => {
        await Promise.all([fetchAlerts(), fetchCounts()]);
    }, [fetchAlerts, fetchCounts]);

    const markAsSeen = useCallback(async (id: string) => {
        if (!apiBaseUrl) return;
        try {
            const response = await fetch(`${apiBaseUrl}/alerts/${id}/seen`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (response.ok) {
                // Update local state optimistically
                setAlerts((prev) =>
                    prev.map((alert) =>
                        alert.id === id ? { ...alert, status: 'SNOOZED' as const, seenAt: new Date().toISOString() } : alert
                    )
                );
            }
        } catch (error) {
            console.error('Error marking alert as seen:', error);
            refreshAlerts(); // Revert on error
        }
    }, [refreshAlerts, apiBaseUrl]);

    const markAllAsSeen = useCallback(async () => {
        const newAlerts = alerts.filter(a => a.status === 'NEW');
        // Optimistic update
        setAlerts((prev) =>
            prev.map((alert) =>
                alert.status === 'NEW' ? { ...alert, status: 'SNOOZED' as const, seenAt: new Date().toISOString() } : alert
            )
        );
        try {
            await Promise.all(newAlerts.map(a =>
                fetch(`${apiBaseUrl}/alerts/${a.id}/seen`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                })
            ));
        } catch (error) {
            console.error('Error marking all as seen:', error);
            refreshAlerts(); // Revert on error
        }
    }, [alerts, refreshAlerts, apiBaseUrl]);

    const dismissAlert = useCallback(async (id: string) => {
        // Optimistic update - remove immediately
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        try {
            await fetch(`${apiBaseUrl}/alerts/${id}/dismiss`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
        } catch (error) {
            console.error('Error dismissing alert:', error);
            refreshAlerts(); // Revert on error
        }
    }, [refreshAlerts, apiBaseUrl]);

    const resolveAlert = useCallback(async (id: string) => {
        if (!apiBaseUrl) return;
        try {
            const response = await fetch(`${apiBaseUrl}/alerts/${id}/resolve`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (response.ok) {
                // Remove from local state
                setAlerts((prev) => prev.filter((alert) => alert.id !== id));
                await fetchCounts();
            }
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    }, [fetchCounts, apiBaseUrl]);

    const snoozeAlert = useCallback(async (id: string, until: Date) => {
        if (!apiBaseUrl) return;
        try {
            const response = await fetch(`${apiBaseUrl}/alerts/${id}/snooze`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ snoozeUntil: until.toISOString() }),
            });

            if (response.ok) {
                // Remove from current view
                setAlerts((prev) => prev.filter((alert) => alert.id !== id));
                await fetchCounts();
            }
        } catch (error) {
            console.error('Error snoozing alert:', error);
        }
    }, [fetchCounts, apiBaseUrl]);

    const bulkDismiss = useCallback(async (ids: string[]) => {
        if (!apiBaseUrl) return;
        try {
            const response = await fetch(`${apiBaseUrl}/alerts/bulk/dismiss`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ alertIds: ids }),
            });

            if (response.ok) {
                setAlerts((prev) => prev.filter((alert) => !ids.includes(alert.id)));
                await fetchCounts();
            }
        } catch (error) {
            console.error('Error bulk dismissing:', error);
        }
    }, [fetchCounts, apiBaseUrl]);

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

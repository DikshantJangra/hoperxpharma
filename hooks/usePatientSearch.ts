import { useState, useEffect, useCallback } from 'react';
import { Patient, patientsApi } from '@/lib/api/patients';
import { patientCache } from '@/lib/cache/patient-cache';
import { useAuthStore } from '@/lib/store/auth-store';

interface UsePatientSearchOptions {
    enableCache?: boolean;
    autoInit?: boolean;
}

interface UsePatientSearchReturn {
    patients: Patient[];
    loading: boolean;
    error: string | null;
    search: (query: string) => Promise<void>;
    refresh: () => Promise<void>;
    cacheStats: {
        totalPatients: number;
        lastSync: number | null;
        cacheSize: number;
    } | null;
}

export function usePatientSearch(options: UsePatientSearchOptions = {}): UsePatientSearchReturn {
    const { enableCache = true, autoInit = true } = options;
    const { primaryStore } = useAuthStore();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cacheStats, setCacheStats] = useState<{
        totalPatients: number;
        lastSync: number | null;
        cacheSize: number;
    } | null>(null);

    // Initialize cache on mount
    useEffect(() => {
        if (enableCache && autoInit) {
            initializeCache();
        }
    }, [enableCache, autoInit]);

    const initializeCache = async () => {
        try {
            await patientCache.init();
            const stats = await patientCache.getStats();
            setCacheStats(stats);

            // If cache is empty or stale, fetch from network
            if (stats.totalPatients === 0 || await patientCache.needsRefresh()) {
                await refresh();
            }
        } catch (err) {
            console.error('Failed to initialize patient cache:', err);
        }
    };

    const search = useCallback(async (query: string) => {
        setLoading(true);
        setError(null);

        try {
            if (enableCache && query.trim()) {
                // Try local search first
                const localResults = await patientCache.searchLocal(query, 20);

                if (localResults.length > 0) {
                    setPatients(localResults);
                    setLoading(false);
                    return;
                }
            }

            // Fallback to network search
            const response = await patientsApi.getPatients({
                search: query,
                page: 1,
                limit: 20,
            });

            setPatients(response.data || []);

            // Update cache with results
            if (enableCache && response.data && response.data.length > 0) {
                await patientCache.updateCache(response.data, primaryStore?.id || '');
                const stats = await patientCache.getStats();
                setCacheStats(stats);
            }
        } catch (err: any) {
            console.error('Patient search error:', err);
            setError(err.message || 'Failed to search patients');
            setPatients([]);
        } finally {
            setLoading(false);
        }
    }, [enableCache, primaryStore]);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch recent patients from network
            const response = await patientsApi.getPatients({
                page: 1,
                limit: 100, // Fetch more for cache
            });

            setPatients(response.data || []);

            // Update cache
            if (enableCache && response.data && response.data.length > 0) {
                await patientCache.updateCache(response.data, primaryStore?.id || '');
                const stats = await patientCache.getStats();
                setCacheStats(stats);
            }
        } catch (err: any) {
            console.error('Patient refresh error:', err);
            setError(err.message || 'Failed to refresh patients');
        } finally {
            setLoading(false);
        }
    }, [enableCache, primaryStore]);

    return {
        patients,
        loading,
        error,
        search,
        refresh,
        cacheStats,
    };
}

/**
 * React Hook for Medicine Cache Management
 * 
 * Provides UI controls for downloading, syncing, and searching
 * the local medicine cache
 */

import { useState, useEffect, useCallback } from 'react';
import { medicineCacheService } from '@/lib/cache/medicineCacheService';

interface CacheStatus {
    hasCache: boolean;
    count: number;
    lastSync: Date | null;
    estimatedMB: number;
}

interface SyncStatus {
    isLoading: boolean;
    progress: number; // 0-100
    loaded: number;
    total: number;
    error: string | null;
}

export function useMedicineCache() {
    const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
        hasCache: false,
        count: 0,
        lastSync: null,
        estimatedMB: 0
    });

    const [syncStatus, setSyncStatus] = useState<SyncStatus>({
        isLoading: false,
        progress: 0,
        loaded: 0,
        total: 0,
        error: null
    });

    const [updateAvailable, setUpdateAvailable] = useState(false);

    // Load cache status on mount
    const refreshCacheStatus = useCallback(async () => {
        try {
            const [info, size] = await Promise.all([
                medicineCacheService.getCacheInfo(),
                medicineCacheService.getCacheSize()
            ]);

            setCacheStatus({
                hasCache: info.hasCache,
                count: info.count,
                lastSync: info.lastSync,
                estimatedMB: size.estimatedMB
            });
        } catch (error) {
            console.error('Failed to get cache status:', error);
        }
    }, []);

    // Check for updates
    const checkForUpdates = useCallback(async () => {
        try {
            const updateCheck = await medicineCacheService.checkForUpdates();
            setUpdateAvailable(updateCheck.needsUpdate);
            return updateCheck;
        } catch (error) {
            console.error('Failed to check for updates:', error);
            return null;
        }
    }, []);

    // Load all medicines (full download)
    const loadMedicines = useCallback(async () => {
        setSyncStatus({
            isLoading: true,
            progress: 0,
            loaded: 0,
            total: 0,
            error: null
        });

        try {
            const result = await medicineCacheService.loadAllMedicines(
                (loaded, total) => {
                    setSyncStatus(prev => ({
                        ...prev,
                        progress: Math.round((loaded / total) * 100),
                        loaded,
                        total
                    }));
                }
            );

            setSyncStatus(prev => ({
                ...prev,
                isLoading: false,
                progress: 100
            }));

            await refreshCacheStatus();
            setUpdateAvailable(false);

            return result;
        } catch (error: any) {
            setSyncStatus(prev => ({
                ...prev,
                isLoading: false,
                error: error?.message || 'Failed to load medicines'
            }));
            throw error;
        }
    }, [refreshCacheStatus]);

    // Sync with server (incremental)
    const syncCache = useCallback(async () => {
        setSyncStatus({
            isLoading: true,
            progress: 50,
            loaded: 0,
            total: 0,
            error: null
        });

        try {
            const result = await medicineCacheService.syncWithServer();

            setSyncStatus(prev => ({
                ...prev,
                isLoading: false,
                progress: 100
            }));

            await refreshCacheStatus();
            setUpdateAvailable(false);

            return result;
        } catch (error: any) {
            setSyncStatus(prev => ({
                ...prev,
                isLoading: false,
                error: error?.message || 'Failed to sync cache'
            }));
            throw error;
        }
    }, [refreshCacheStatus]);

    // Clear cache
    const clearCache = useCallback(async () => {
        try {
            await medicineCacheService.clearCache();
            await refreshCacheStatus();
            setUpdateAvailable(false);
        } catch (error) {
            console.error('Failed to clear cache:', error);
            throw error;
        }
    }, [refreshCacheStatus]);

    // Search locally
    const searchLocal = useCallback(async (query: string, limit?: number) => {
        if (!cacheStatus.hasCache) {
            return [];
        }
        return medicineCacheService.search(query, { limit });
    }, [cacheStatus.hasCache]);

    // Initialize with auto-download
    useEffect(() => {
        const initialize = async () => {
            await refreshCacheStatus();
            const updateCheck = await checkForUpdates();

            // Auto-download if no cache exists
            if (updateCheck?.type === 'full') {
                console.log('🔄 No medicine cache found. Auto-downloading...');
                loadMedicines().catch(err => {
                    console.error('Auto-download failed:', err);
                });
            }
            // Auto-sync if updates available
            else if (updateCheck?.needsUpdate && updateCheck?.type === 'incremental') {
                console.log('🔄 Updates available. Auto-syncing...');
                syncCache().catch(err => {
                    console.error('Auto-sync failed:', err);
                });
            }
        };

        initialize();

        // Check for updates every 6 hours and auto-sync
        const interval = setInterval(async () => {
            const updateCheck = await checkForUpdates();
            if (updateCheck?.needsUpdate && updateCheck?.type === 'incremental') {
                console.log('🔄 Auto-syncing incremental updates...');
                syncCache().catch(err => {
                    console.error('Background sync failed:', err);
                });
            }
        }, 6 * 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, []); // Run once on mount

    return {
        cacheStatus,
        syncStatus,
        updateAvailable,
        loadMedicines,
        syncCache,
        clearCache,
        searchLocal,
        refreshCacheStatus,
        checkForUpdates
    };
}

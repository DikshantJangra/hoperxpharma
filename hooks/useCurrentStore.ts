'use client';

import { useState, useEffect } from 'react';
import { storesApi } from '@/lib/api/stores';

/**
 * Hook to get the current user's store ID
 * Fetches from backend and caches the result
 */
export function useCurrentStore() {
    const [storeId, setStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchStoreId = async () => {
            try {
                setLoading(true);
                const store = await storesApi.getMyStore();
                setStoreId(store.id);
            } catch (err) {
                console.error('Failed to fetch current store:', err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchStoreId();
    }, []);

    return { storeId, loading, error };
}

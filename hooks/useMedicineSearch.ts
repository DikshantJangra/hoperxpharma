import { useState, useEffect, useCallback, useRef } from 'react';
import { medicineSearch } from '@/lib/search/medicineSearch';
import type { Medicine, MedicineSearchResult } from '@/types/medicine';

const RECENT_MEDICINES_KEY = 'recentMedicines';
const MAX_RECENT = 5;

export function useMedicineSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MedicineSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [indexLoaded, setIndexLoaded] = useState(false);
    const [recentMedicines, setRecentMedicines] = useState<Medicine[]>([]);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Load recent medicines from localStorage
    useEffect(() => {
        const loadRecent = () => {
            try {
                const stored = localStorage.getItem(RECENT_MEDICINES_KEY);
                if (stored) {
                    setRecentMedicines(JSON.parse(stored));
                }
            } catch (error) {
                console.error('Failed to load recent medicines:', error);
            }
        };
        loadRecent();
    }, []);

    // Preload index on mount
    useEffect(() => {
        const preloadIndex = async () => {
            try {
                await medicineSearch.loadIndex();
                setIndexLoaded(true);
            } catch (error) {
                console.error('Failed to preload medicine index:', error);
            }
        };
        preloadIndex();
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (!query || query.trim().length === 0) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        debounceTimer.current = setTimeout(async () => {
            try {
                const searchResults = await medicineSearch.search(query, {
                    limit: 20,
                    includeDiscontinued: false
                });
                setResults(searchResults);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 150); // 150ms debounce

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [query]);

    const addToRecent = useCallback((medicine: Medicine) => {
        setRecentMedicines(prev => {
            // Remove if already exists
            const filtered = prev.filter(m => m.id !== medicine.id);
            // Add to front
            const updated = [medicine, ...filtered].slice(0, MAX_RECENT);
            // Save to localStorage
            try {
                localStorage.setItem(RECENT_MEDICINES_KEY, JSON.stringify(updated));
            } catch (error) {
                console.error('Failed to save recent medicines:', error);
            }
            return updated;
        });
    }, []);

    const clearRecent = useCallback(() => {
        setRecentMedicines([]);
        try {
            localStorage.removeItem(RECENT_MEDICINES_KEY);
        } catch (error) {
            console.error('Failed to clear recent medicines:', error);
        }
    }, []);

    return {
        query,
        setQuery,
        results,
        loading,
        indexLoaded,
        recentMedicines,
        addToRecent,
        clearRecent
    };
}

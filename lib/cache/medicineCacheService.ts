/**
 * Medicine Cache Service using IndexedDB
 * 
 * Stores medicines locally in the browser for ultra-fast search
 * - No server memory issues
 * - Offline capability
 * - Smart sync with server
 */

import Dexie, { Table } from 'dexie';
import { apiClient } from '@/lib/api-client';

// Type definitions
interface CachedMedicine {
    id: string;
    name: string;
    genericName?: string | null;
    strength?: string | null;
    form?: string | null;
    manufacturerName?: string | null;
    compositionText?: string | null;
    primaryBarcode?: string | null;
    packSize?: string | null;
    schedule?: string | null;
    requiresPrescription?: boolean | null;
    usageCount?: number;
}

interface CacheMetadata {
    key: string;
    value: any;
    updatedAt: Date;
}

// IndexedDB Database class
class MedicineCacheDB extends Dexie {
    medicines!: Table<CachedMedicine, string>;
    metadata!: Table<CacheMetadata, string>;

    constructor() {
        super('MedicineCache');

        this.version(1).stores({
            // Index by id (primary key), name, and manufacturer for fast lookups
            medicines: 'id, name, genericName, manufacturerName',
            // Metadata for version tracking and sync info
            metadata: 'key'
        });
    }
}

const db = new MedicineCacheDB();

// Cache Service Class
class MedicineCacheService {
    private isLoading = false;
    private loadProgress = 0;
    private onProgressCallback?: (loaded: number, total: number) => void;

    /**
     * Check if local cache exists and get metadata
     */
    async getCacheInfo() {
        const [count, version, lastSync] = await Promise.all([
            db.medicines.count(),
            db.metadata.get('version'),
            db.metadata.get('lastSync')
        ]);

        return {
            count,
            version: version?.value,
            lastSync: lastSync?.value ? new Date(lastSync.value) : null,
            hasCache: count > 0
        };
    }

    /**
     * Check for updates from server
     */
    async checkForUpdates() {
        try {
            const serverVersion = await apiClient.get('/medicines/version');
            const localVersion = await db.metadata.get('version');

            if (!localVersion) {
                // No local cache - need full download
                return {
                    needsUpdate: true,
                    type: 'full' as const,
                    serverCount: serverVersion.data.count
                };
            }

            if (localVersion.value !== serverVersion.data.version) {
                // Data changed - incremental update available
                return {
                    needsUpdate: true,
                    type: 'incremental' as const,
                    since: localVersion.value,
                    serverCount: serverVersion.data.count
                };
            }

            // Cache is up to date
            return {
                needsUpdate: false,
                type: 'current' as const,
                serverCount: serverVersion.data.count
            };
        } catch (error) {
            console.error('Failed to check for updates:', error);
            throw error;
        }
    }

    /**
     * Load all medicines from server (full download)
     */
    async loadAllMedicines(onProgress?: (loaded: number, total: number) => void) {
        if (this.isLoading) {
            console.log('Already loading medicines...');
            return;
        }

        this.isLoading = true;
        this.onProgressCallback = onProgress;

        try {
            let page = 1;
            const limit = 10000; // 10K medicines per chunk
            let totalLoaded = 0;
            let total = 0;

            console.log('📥 Starting medicine download...');

            while (true) {
                const response = await apiClient.get(`/medicines/export?page=${page}&limit=${limit}`);

                if (!response.data || !Array.isArray(response.data)) {
                    throw new Error('Invalid response format');
                }

                const medicines = response.data;
                total = response.pagination.total;

                // Store in IndexedDB
                await db.medicines.bulkPut(medicines);

                totalLoaded += medicines.length;
                this.loadProgress = (totalLoaded / total) * 100;

                // Update progress
                if (onProgress) {
                    onProgress(totalLoaded, total);
                }

                console.log(`📦 Loaded ${totalLoaded.toLocaleString()} / ${total.toLocaleString()} medicines (${Math.round(this.loadProgress)}%)`);

                if (!response.pagination.hasMore) {
                    break;
                }

                page++;
            }

            // Save version metadata
            const versionResponse = await apiClient.get('/medicines/version');
            await db.metadata.put({
                key: 'version',
                value: versionResponse.data.version,
                updatedAt: new Date()
            });

            await db.metadata.put({
                key: 'lastSync',
                value: new Date().toISOString(),
                updatedAt: new Date()
            });

            console.log(`✅ Successfully loaded ${totalLoaded.toLocaleString()} medicines`);

            return { loaded: totalLoaded, total };
        } catch (error) {
            console.error('Failed to load medicines:', error);
            throw error;
        } finally {
            this.isLoading = false;
            this.loadProgress = 0;
        }
    }

    /**
     * Sync with server (incremental updates)
     */
    async syncWithServer() {
        const check = await this.checkForUpdates();

        if (!check.needsUpdate) {
            console.log('✅ Medicine cache is up to date');
            return { synced: 0, type: 'none' as const };
        }

        if (check.type === 'full') {
            // Full download needed
            console.log('🔄 No local cache - performing full download');
            const result = await this.loadAllMedicines();
            return { synced: result?.loaded || 0, type: 'full' as const };
        }

        // Incremental update
        console.log('🔄 Syncing incremental updates...');
        const updates = await apiClient.get(`/medicines/updates?since=${check.since}`);

        if (!updates.data || !Array.isArray(updates.data.updates)) {
            throw new Error('Invalid updates response');
        }

        const updateRecords = updates.data.updates;
        let added = 0;
        let removed = 0;

        // Apply updates
        for (const medicine of updateRecords) {
            if (medicine.status === 'DISCONTINUED') {
                await db.medicines.delete(medicine.id);
                removed++;
            } else {
                await db.medicines.put(medicine);
                added++;
            }
        }

        // Update version
        await db.metadata.put({
            key: 'version',
            value: updates.data.version,
            updatedAt: new Date()
        });

        await db.metadata.put({
            key: 'lastSync',
            value: new Date().toISOString(),
            updatedAt: new Date()
        });

        console.log(`✅ Synced ${updateRecords.length} changes (${added} added/updated, ${removed} removed)`);
        return { synced: updateRecords.length, type: 'incremental' as const, added, removed };
    }

    /**
     * Search medicines locally using Fuse.js for fuzzy matching
     */
    async search(query: string, options?: { limit?: number }) {
        const limit = options?.limit || 20;

        if (!query || query.trim().length === 0) {
            return [];
        }

        // Get all medicines from cache
        const allMedicines = await db.medicines.toArray();

        // Use Fuse.js for intelligent fuzzy search
        const Fuse = (await import('fuse.js')).default;

        const fuse = new Fuse(allMedicines, {
            keys: [
                { name: 'name', weight: 0.5 },           // Highest priority - medicine name
                { name: 'genericName', weight: 0.2 },    // Second priority - generic name
                { name: 'compositionText', weight: 0.2 }, // Composition/salt
                { name: 'manufacturerName', weight: 0.1 } // Manufacturer
            ],
            threshold: 0.4,        // 0 = perfect match, 1 = match anything
            ignoreLocation: true,  // Search anywhere in string
            minMatchCharLength: 2, // Minimum characters to match
            includeScore: true     // Include relevance score
        });

        // Perform fuzzy search
        const fuseResults = fuse.search(query);

        // Transform results and sort by score (lower is better in Fuse.js)
        const results = fuseResults
            .slice(0, limit * 2) // Get more than needed for further filtering
            .map(result => ({
                ...result.item,
                searchScore: result.score || 1
            }))
            .sort((a, b) => {
                // Sort by score first (lower is better)
                if (a.searchScore !== b.searchScore) {
                    return a.searchScore - b.searchScore;
                }
                // Then by usage count (higher is better)
                return (b.usageCount || 0) - (a.usageCount || 0);
            })
            .slice(0, limit);

        console.log(`🔍 Fuse.js found ${fuseResults.length} results for "${query}", returning top ${results.length}`);

        return results;
    }

    /**
     * Clear all cache
     */
    async clearCache() {
        await db.medicines.clear();
        await db.metadata.clear();
        console.log('🗑️ Cache cleared');
    }

    /**
     * Get cache size estimate
     */
    async getCacheSize() {
        const count = await db.medicines.count();
        // Rough estimate: ~300 bytes per medicine
        const estimatedBytes = count * 300;
        const estimatedMB = estimatedBytes / (1024 * 1024);

        return {
            count,
            estimatedBytes,
            estimatedMB: Math.round(estimatedMB * 10) / 10 // Round to 1 decimal
        };
    }
}

// Export singleton
export const medicineCacheService = new MedicineCacheService();
export { db as medicineCacheDB };

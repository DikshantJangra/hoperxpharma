import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { baseFetch } from '@/lib/api/client';

interface Mutation {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body: any;
    timestamp: number;
    retryCount: number;
}

interface SyncDB extends DBSchema {
    mutations: {
        key: string;
        value: Mutation;
        indexes: { 'by-timestamp': number };
    };
}

class SyncManager {
    private db: IDBPDatabase<SyncDB> | null = null;
    private readonly DB_NAME = 'hoperx-sync';
    private readonly DB_VERSION = 1;
    private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
    private isSyncing: boolean = false;
    private lastSyncAttempt: number = 0;
    private readonly SYNC_COOLDOWN = 5000; // 5 seconds between sync attempts
    private readonly MAX_RETRIES = 3; // Max retries before dropping mutation

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.sync();
            });
            window.addEventListener('offline', () => {
                this.isOnline = false;
            });
        }
    }

    async init() {
        if (this.db) return;

        this.db = await openDB<SyncDB>(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('mutations')) {
                    const store = db.createObjectStore('mutations', { keyPath: 'id' });
                    store.createIndex('by-timestamp', 'timestamp');
                }
            },
        });
    }

    /**
     * Add a mutation to the sync queue
     */
    async queueMutation(url: string, method: Mutation['method'], body: any) {
        if (!this.db) await this.init();

        const mutation: Mutation = {
            id: crypto.randomUUID(),
            url,
            method,
            body,
            timestamp: Date.now(),
            retryCount: 0,
        };

        await this.db!.put('mutations', mutation);
        console.log(`Queued mutation ${mutation.id} for sync`);

        // If online, try to sync after a short delay (debounce)
        if (this.isOnline) {
            setTimeout(() => this.sync(), 1000);
        }
    }

    /**
     * Process the sync queue
     */
    async sync() {
        // Prevent concurrent sync operations
        if (this.isSyncing) {
            return;
        }

        // Enforce cooldown between sync attempts
        const now = Date.now();
        if (now - this.lastSyncAttempt < this.SYNC_COOLDOWN) {
            return;
        }

        if (!this.isOnline || !this.db) return;

        this.isSyncing = true;
        this.lastSyncAttempt = now;

        try {
            const mutations = await this.db.getAll('mutations');

            if (mutations.length === 0) {
                return;
            }

            // Sort by timestamp to ensure order
            mutations.sort((a, b) => a.timestamp - b.timestamp);

            for (const mutation of mutations) {
                try {
                    await this.processMutation(mutation);
                    // Use a new transaction for each delete to avoid inactive transaction errors
                    await this.db.delete('mutations', mutation.id);
                } catch (error) {
                    console.error(`Failed to sync mutation ${mutation.id}:`, error);
                    
                    // Increment retry count
                    if (mutation.retryCount >= this.MAX_RETRIES) {
                        await this.db.delete('mutations', mutation.id);
                        console.warn(`Dropped mutation ${mutation.id} after ${this.MAX_RETRIES} retries`);
                    } else {
                        mutation.retryCount++;
                        await this.db.put('mutations', mutation);
                    }
                    
                    // Stop processing more mutations if one fails
                    // This prevents cascading failures
                    break;
                }
            }
        } catch (error) {
            console.error('Sync operation failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Execute the mutation against the API
     */
    private async processMutation(mutation: Mutation) {
        try {
            await baseFetch(mutation.url, {
                method: mutation.method,
                body: mutation.body ? JSON.stringify(mutation.body) : undefined,
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get pending mutations count
     */
    async getPendingCount(): Promise<number> {
        if (!this.db) await this.init();
        return await this.db!.count('mutations');
    }

    /**
     * Clear all pending mutations (emergency use only)
     */
    async clearAllMutations(): Promise<void> {
        if (!this.db) await this.init();
        const mutations = await this.db!.getAll('mutations');
        for (const mutation of mutations) {
            await this.db!.delete('mutations', mutation.id);
        }
        console.log(`Cleared ${mutations.length} pending mutations`);
    }

    /**
     * Get all pending mutations (for debugging)
     */
    async getPendingMutations(): Promise<Mutation[]> {
        if (!this.db) await this.init();
        return await this.db!.getAll('mutations');
    }
}

export const syncManager = new SyncManager();

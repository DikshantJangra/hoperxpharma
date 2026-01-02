import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { getApiBaseUrl } from '@/lib/config/env';
import { tokenManager } from '@/lib/api/client';

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

        // If online, try to sync immediately
        if (this.isOnline) {
            this.sync();
        }
    }

    /**
     * Process the sync queue
     */
    async sync() {
        if (!this.isOnline || !this.db) return;

        try {
            const mutations = await this.db.getAll('mutations');

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
                    if (mutation.retryCount > 5) {
                        await this.db.delete('mutations', mutation.id);
                        console.error(`Dropped mutation ${mutation.id} after max retries`);
                    } else {
                        mutation.retryCount++;
                        await this.db.put('mutations', mutation);
                    }
                }
            }
        } catch (error) {
            console.error('Sync operation failed:', error);
        }
    }

    /**
     * Execute the mutation against the API
     */
    private async processMutation(mutation: Mutation) {
        const token = tokenManager.getAccessToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(`${getApiBaseUrl()}${mutation.url}`, {
                method: mutation.method,
                headers,
                body: JSON.stringify(mutation.body),
                signal: controller.signal,
                credentials: 'include', // Send cookies for httpOnly token
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            clearTimeout(timeoutId);
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
}

export const syncManager = new SyncManager();

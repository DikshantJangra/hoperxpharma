import { openDB, DBSchema, IDBPDatabase } from 'idb';

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

        const tx = this.db.transaction('mutations', 'readwrite');
        const store = tx.objectStore('mutations');
        const mutations = await store.getAll();

        // Sort by timestamp to ensure order
        mutations.sort((a, b) => a.timestamp - b.timestamp);

        for (const mutation of mutations) {
            try {
                await this.processMutation(mutation);
                await store.delete(mutation.id);
            } catch (error) {
                console.error(`Failed to sync mutation ${mutation.id}:`, error);
                // Increment retry count or move to dead letter queue
                // For now, we'll leave it in the queue to retry later
                // but maybe with a max retry limit
                if (mutation.retryCount > 5) {
                    await store.delete(mutation.id); // Give up
                    console.error(`Dropped mutation ${mutation.id} after max retries`);
                } else {
                    mutation.retryCount++;
                    await store.put(mutation);
                }
            }
        }

        await tx.done;
    }

    /**
     * Execute the mutation against the API
     */
    private async processMutation(mutation: Mutation) {
        // We need to import apiClient dynamically or pass it in to avoid circular deps if apiClient uses SyncManager
        // For now, assume standard fetch or axios
        // But we need auth headers. 
        // Best to use the existing apiClient from lib/api/client if possible, 
        // but that might cause issues if we modify apiClient to use this.

        // Let's use fetch with the token from localStorage for now
        const token = localStorage.getItem('accessToken'); // Match tokenManager key

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${mutation.url}`, {
            method: mutation.method,
            headers,
            body: JSON.stringify(mutation.body),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
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

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import Fuse from 'fuse.js';
import { Patient } from '@/lib/api/patients';

interface PatientDB extends DBSchema {
    patients: {
        key: string;
        value: Patient & { cachedAt: number };
        indexes: { 'by-phone': string; 'by-name': string };
    };
    metadata: {
        key: string;
        value: { key: string; lastSync: number; storeId: string };
    };
}

class PatientCache {
    private db: IDBPDatabase<PatientDB> | null = null;
    private fuse: Fuse<Patient> | null = null;
    private patients: Patient[] = [];
    private readonly DB_NAME = 'hoperx-patients';
    private readonly DB_VERSION = 1;
    private readonly MAX_CACHE_SIZE = 500;
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * Initialize the IndexedDB database
     */
    async init(): Promise<void> {
        if (this.db) return;

        this.db = await openDB<PatientDB>(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                // Create patients store
                if (!db.objectStoreNames.contains('patients')) {
                    const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
                    patientStore.createIndex('by-phone', 'phoneNumber');
                    patientStore.createIndex('by-name', ['lastName', 'firstName']);
                }

                // Create metadata store
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            },
        });

        // Load patients into memory for Fuse.js
        await this.loadPatientsFromDB();
    }

    /**
     * Load all patients from IndexedDB into memory
     */
    private async loadPatientsFromDB(): Promise<void> {
        if (!this.db) return;

        const allPatients = await this.db.getAll('patients');
        this.patients = allPatients.map(p => {
            const { cachedAt, ...patient } = p;
            return patient as Patient;
        });

        // Initialize Fuse.js for fuzzy search
        this.fuse = new Fuse(this.patients, {
            keys: [
                { name: 'firstName', weight: 2 },
                { name: 'lastName', weight: 2 },
                { name: 'phoneNumber', weight: 1.5 },
                { name: 'email', weight: 1 },
            ],
            threshold: 0.3,
            includeScore: true,
            minMatchCharLength: 2,
        });
    }

    /**
     * Search patients locally using Fuse.js
     */
    async searchLocal(query: string, limit: number = 20): Promise<Patient[]> {
        if (!this.fuse || !query.trim()) {
            return this.patients.slice(0, limit);
        }

        const results = this.fuse.search(query, { limit });
        return results.map(result => result.item);
    }

    /**
     * Get patient by ID from cache
     */
    async getById(id: string): Promise<Patient | null> {
        if (!this.db) await this.init();

        const cached = await this.db!.get('patients', id);
        if (!cached) return null;

        // Check if cache is stale
        if (Date.now() - cached.cachedAt > this.CACHE_TTL) {
            return null;
        }

        const { cachedAt, ...patient } = cached;
        return patient as Patient;
    }

    /**
     * Get patient by phone number from cache
     */
    async getByPhone(phone: string): Promise<Patient | null> {
        if (!this.db) await this.init();

        const tx = this.db!.transaction('patients', 'readonly');
        const index = tx.store.index('by-phone');
        const cached = await index.get(phone);

        if (!cached) return null;

        // Check if cache is stale
        if (Date.now() - cached.cachedAt > this.CACHE_TTL) {
            return null;
        }

        const { cachedAt, ...patient } = cached;
        return patient as Patient;
    }

    /**
     * Update cache with new patients
     */
    async updateCache(patients: Patient[], storeId: string): Promise<void> {
        if (!this.db) await this.init();

        const tx = this.db!.transaction(['patients', 'metadata'], 'readwrite');
        const now = Date.now();

        // Add/update patients
        for (const patient of patients) {
            await tx.objectStore('patients').put({
                ...patient,
                cachedAt: now,
            });
        }

        // Update metadata
        await tx.objectStore('metadata').put({
            key: 'lastSync',
            lastSync: now,
            storeId,
        });

        await tx.done;

        // Reload patients into memory
        await this.loadPatientsFromDB();

        // Enforce cache size limit
        await this.enforceCacheLimit();
    }

    /**
     * Add single patient to cache
     */
    async addPatient(patient: Patient): Promise<void> {
        if (!this.db) await this.init();

        await this.db!.put('patients', {
            ...patient,
            cachedAt: Date.now(),
        });

        // Reload patients into memory
        await this.loadPatientsFromDB();
    }

    /**
     * Remove patient from cache
     */
    async removePatient(id: string): Promise<void> {
        if (!this.db) await this.init();

        await this.db!.delete('patients', id);

        // Reload patients into memory
        await this.loadPatientsFromDB();
    }

    /**
     * Enforce cache size limit (keep most recent 500 patients)
     */
    private async enforceCacheLimit(): Promise<void> {
        if (!this.db) return;

        const allPatients = await this.db.getAll('patients');

        if (allPatients.length <= this.MAX_CACHE_SIZE) return;

        // Sort by cachedAt descending
        allPatients.sort((a, b) => b.cachedAt - a.cachedAt);

        // Delete oldest patients
        const tx = this.db.transaction('patients', 'readwrite');
        const patientsToDelete = allPatients.slice(this.MAX_CACHE_SIZE);

        for (const patient of patientsToDelete) {
            await tx.store.delete(patient.id);
        }

        await tx.done;
    }

    /**
     * Clear all cached data
     */
    async clear(): Promise<void> {
        if (!this.db) await this.init();

        const tx = this.db!.transaction(['patients', 'metadata'], 'readwrite');
        await tx.objectStore('patients').clear();
        await tx.objectStore('metadata').clear();
        await tx.done;

        this.patients = [];
        this.fuse = null;
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{
        totalPatients: number;
        lastSync: number | null;
        cacheSize: number;
    }> {
        if (!this.db) await this.init();

        const metadata = await this.db!.get('metadata', 'lastSync');
        const allPatients = await this.db!.getAll('patients');

        return {
            totalPatients: allPatients.length,
            lastSync: metadata?.lastSync || null,
            cacheSize: JSON.stringify(allPatients).length,
        };
    }

    /**
     * Check if cache needs refresh
     */
    async needsRefresh(): Promise<boolean> {
        if (!this.db) await this.init();

        const metadata = await this.db!.get('metadata', 'lastSync');
        if (!metadata) return true;

        return Date.now() - metadata.lastSync > this.CACHE_TTL;
    }
}

// Export singleton instance
export const patientCache = new PatientCache();

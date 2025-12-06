import MiniSearch from 'minisearch';
import type { Medicine, MedicineSearchIndex, MedicineSearchResult } from '@/types/medicine';

class MedicineSearchService {
    private miniSearch: MiniSearch<Medicine> | null = null;
    private medicines: Medicine[] = [];
    private indexLoaded = false;
    private loadingPromise: Promise<void> | null = null;

    constructor() {
        // Initialize MiniSearch configuration
        this.miniSearch = new MiniSearch({
            fields: ['name', 'composition', 'manufacturer', 'packSize'], // fields to index
            storeFields: ['id', 'name', 'price', 'manufacturer', 'packSize', 'composition', 'type', 'discontinued'], // fields to return
            searchOptions: {
                boost: { name: 3, composition: 2, manufacturer: 1 },
                fuzzy: 0.2,
                prefix: true,
                combineWith: 'AND'
            }
        });
    }

    /**
     * Load the medicine index from the JSON file
     */
    async loadIndex(): Promise<void> {
        if (this.indexLoaded) return;

        // If already loading, return the existing promise
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = (async () => {
            try {
                const response = await fetch('/data/medicine-index.json');
                if (!response.ok) {
                    throw new Error(`Failed to load medicine index: ${response.statusText}`);
                }

                const data: MedicineSearchIndex = await response.json();
                this.medicines = data.medicines;

                // Add all medicines to MiniSearch
                if (this.miniSearch) {
                    this.miniSearch.addAll(this.medicines);
                }

                this.indexLoaded = true;
                console.log(`✅ Loaded ${data.totalRecords.toLocaleString()} medicines (v${data.version})`);
            } catch (error) {
                console.error('Failed to load medicine index:', error);
                throw error;
            } finally {
                this.loadingPromise = null;
            }
        })();

        return this.loadingPromise;
    }

    /**
     * Search for medicines
     */
    async search(query: string, options?: {
        limit?: number;
        includeDiscontinued?: boolean;
    }): Promise<MedicineSearchResult[]> {
        if (!this.indexLoaded) {
            await this.loadIndex();
        }

        if (!query || query.trim().length === 0) {
            return [];
        }

        const limit = options?.limit || 20;
        const includeDiscontinued = options?.includeDiscontinued ?? false;

        try {
            const results = this.miniSearch?.search(query, {
                boost: { name: 3, composition: 2, manufacturer: 1 },
                fuzzy: 0.2,
                prefix: true
            }) || [];

            // Filter out discontinued medicines if needed
            let filteredResults = results;
            if (!includeDiscontinued) {
                filteredResults = results.filter(r => !r.discontinued);
            }

            // Limit results
            const limitedResults = filteredResults.slice(0, limit);

            // Transform to MedicineSearchResult
            return limitedResults.map(result => {
                const medicine = result as unknown as Medicine;
                return {
                    id: medicine.id,
                    name: medicine.name,
                    price: medicine.price,
                    manufacturer: medicine.manufacturer,
                    packSize: medicine.packSize,
                    composition: medicine.composition,
                    type: medicine.type,
                    discontinued: medicine.discontinued,
                    score: result.score,
                    match: result.match || {}
                } as MedicineSearchResult;
            });
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    /**
     * Search by composition (salt/active ingredient)
     */
    async searchByComposition(salt: string): Promise<MedicineSearchResult[]> {
        if (!this.indexLoaded) {
            await this.loadIndex();
        }

        const results = this.medicines
            .filter(m =>
                !m.discontinued &&
                m.composition.toLowerCase().includes(salt.toLowerCase())
            )
            .slice(0, 20)
            .map(m => ({
                ...m,
                score: 1,
                match: { composition: [salt] }
            }));

        return results;
    }

    /**
     * Search by manufacturer
     */
    async searchByManufacturer(manufacturer: string): Promise<MedicineSearchResult[]> {
        if (!this.indexLoaded) {
            await this.loadIndex();
        }

        const results = this.medicines
            .filter(m =>
                !m.discontinued &&
                m.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())
            )
            .slice(0, 20)
            .map(m => ({
                ...m,
                score: 1,
                match: { manufacturer: [manufacturer] }
            }));

        return results;
    }

    /**
     * Get medicine by ID
     */
    async getMedicineById(id: string): Promise<Medicine | null> {
        if (!this.indexLoaded) {
            await this.loadIndex();
        }

        return this.medicines.find(m => m.id === id) || null;
    }

    /**
     * Get random medicines (for suggestions)
     */
    async getRandomMedicines(count: number = 10): Promise<Medicine[]> {
        if (!this.indexLoaded) {
            await this.loadIndex();
        }

        const activeMedicines = this.medicines.filter(m => !m.discontinued);
        const shuffled = [...activeMedicines].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Check if index is loaded
     */
    isLoaded(): boolean {
        return this.indexLoaded;
    }

    /**
     * Get total medicine count
     */
    getTotalCount(): number {
        return this.medicines.length;
    }
}

// Export singleton instance
export const medicineSearch = new MedicineSearchService();

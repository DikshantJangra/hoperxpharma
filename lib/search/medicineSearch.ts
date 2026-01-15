import type { Medicine, MedicineSearchResult } from '@/types/medicine';
import { medicineSearchAdapter } from './medicineSearchAdapter';

class MedicineSearchService {
    /**
     * Load the medicine index
     */
    async loadIndex(): Promise<void> {
        return medicineSearchAdapter.loadIndex();
    }

    /**
     * Search for medicines
     */
    async search(query: string, options?: {
        limit?: number;
        includeDiscontinued?: boolean;
    }): Promise<MedicineSearchResult[]> {
        return medicineSearchAdapter.search(query, options);
    }

    /**
     * Search by composition (salt/active ingredient)
     */
    async searchByComposition(salt: string): Promise<MedicineSearchResult[]> {
        return medicineSearchAdapter.searchByComposition(salt);
    }

    /**
     * Search by manufacturer
     */
    async searchByManufacturer(manufacturer: string): Promise<MedicineSearchResult[]> {
        return medicineSearchAdapter.searchByManufacturer(manufacturer);
    }

    /**
     * Get medicine by ID
     */
    async getMedicineById(id: string): Promise<Medicine | null> {
        return medicineSearchAdapter.getMedicineById(id);
    }

    /**
     * Get random medicines (for suggestions)
     */
    async getRandomMedicines(count: number = 10): Promise<Medicine[]> {
        return medicineSearchAdapter.getRandomMedicines(count);
    }

    /**
     * Check if index is loaded
     */
    isLoaded(): boolean {
        return medicineSearchAdapter.isLoaded();
    }

    /**
     * Get total medicine count
     */
    getTotalCount(): number {
        return medicineSearchAdapter.getTotalCount();
    }
}

// Export singleton instance
export const medicineSearch = new MedicineSearchService();

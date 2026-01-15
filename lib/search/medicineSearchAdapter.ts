/**
 * Medicine Search Adapter
 * 
 * Provides backward-compatible interface using the new API
 */

import { medicineApi } from '@/lib/api/medicineApi';
import type { Medicine, MedicineSearchResult } from '@/types/medicine';

class MedicineSearchAdapter {
  private indexLoaded = false;
  private totalCount = 0;

  /**
   * Load the index (fetch stats from API)
   */
  async loadIndex(): Promise<void> {
    if (this.indexLoaded) return;

    try {
      const stats = await medicineApi.getStats();
      this.totalCount = stats.totalDocuments || 0;
      this.indexLoaded = true;
      console.log(`✅ Connected to medicine API (${this.totalCount.toLocaleString()} medicines)`);
    } catch (error) {
      console.error('Failed to connect to medicine API:', error);
      throw error;
    }
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

    try {
      const response = await medicineApi.search({
        q: query,
        limit: options?.limit || 20,
        discontinued: options?.includeDiscontinued,
      });

      // Transform API response to match old format
      return response.results.map((result: any) => ({
        id: result.id || result.canonicalId,
        name: result.name,
        price: result.defaultPrice || 0,
        manufacturer: result.manufacturerName,
        packSize: result.packSize,
        composition: result.compositionText,
        type: result.form,
        discontinued: result.status === 'DISCONTINUED',
        score: result.score || 1,
        match: result.match || {}
      }));
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

    try {
      const results = await medicineApi.searchByComposition(salt);
      
      return results.map((result: any) => ({
        id: result.id || result.canonicalId,
        name: result.name,
        price: result.defaultPrice || 0,
        manufacturer: result.manufacturerName,
        packSize: result.packSize,
        composition: result.compositionText,
        type: result.form,
        discontinued: result.status === 'DISCONTINUED',
        score: 1,
        match: { composition: [salt] }
      }));
    } catch (error) {
      console.error('Search by composition error:', error);
      return [];
    }
  }

  /**
   * Search by manufacturer
   */
  async searchByManufacturer(manufacturer: string): Promise<MedicineSearchResult[]> {
    if (!this.indexLoaded) {
      await this.loadIndex();
    }

    try {
      const results = await medicineApi.searchByManufacturer(manufacturer);
      
      return results.map((result: any) => ({
        id: result.id || result.canonicalId,
        name: result.name,
        price: result.defaultPrice || 0,
        manufacturer: result.manufacturerName,
        packSize: result.packSize,
        composition: result.compositionText,
        type: result.form,
        discontinued: result.status === 'DISCONTINUED',
        score: 1,
        match: { manufacturer: [manufacturer] }
      }));
    } catch (error) {
      console.error('Search by manufacturer error:', error);
      return [];
    }
  }

  /**
   * Get medicine by ID
   */
  async getMedicineById(id: string): Promise<Medicine | null> {
    try {
      const result = await medicineApi.getMedicineById(id);
      if (!result) return null;

      return {
        id: result.id || result.canonicalId,
        name: result.name,
        price: result.defaultPrice || 0,
        manufacturer: result.manufacturerName,
        packSize: result.packSize,
        composition: result.compositionText,
        type: result.form,
        discontinued: result.status === 'DISCONTINUED',
      };
    } catch (error) {
      console.error('Get medicine by ID error:', error);
      return null;
    }
  }

  /**
   * Get random medicines (not supported by API, return empty)
   */
  async getRandomMedicines(count: number = 10): Promise<Medicine[]> {
    // This feature is not supported by the new API
    // Could be implemented by fetching recent medicines or popular medicines
    return [];
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
    return this.totalCount;
  }
}

// Export singleton instance
export const medicineSearchAdapter = new MedicineSearchAdapter();

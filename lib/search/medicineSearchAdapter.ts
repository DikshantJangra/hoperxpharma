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
    if (this.indexLoaded) {
      console.log(`ℹ️  Index already loaded (${this.totalCount.toLocaleString()} medicines)`);
      return;
    }

    try {
      console.log('🔄 Loading medicine index from API...');
      const stats = await medicineApi.getStats();
      console.log('📊 API Stats response:', stats);

      this.totalCount = stats.totalDocuments || stats.numDocuments || 0;
      this.indexLoaded = true;

      console.log(`✅ Connected to medicine API (${this.totalCount.toLocaleString()} medicines)`);
    } catch (error) {
      console.error('❌ Failed to connect to medicine API:', error);
      throw error;
    }
  }

  /**
   * Search for medicines (hybrid: local cache first, API fallback)
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
      // Try local cache first (ultra-fast)
      const { medicineCacheService } = await import('@/lib/cache/medicineCacheService');
      const cacheInfo = await medicineCacheService.getCacheInfo();

      if (cacheInfo.hasCache && cacheInfo.count > 0) {
        console.log('🚀 Using local cache for search');
        const results = await medicineCacheService.search(query, { limit: options?.limit });
        console.log('📦 Cache returned:', results.length, 'results');
        if (results.length > 0) console.log('First result:', results[0]);

        // Transform to match expected format
        return results.map(result => ({
          id: result.id,
          name: result.name,
          genericName: result.genericName || undefined,
          price: 0, // Not stored in cache
          manufacturerName: result.manufacturerName || undefined,
          packSize: result.packSize || undefined,
          composition: result.compositionText || undefined,
          type: result.form || undefined,
          discontinued: false, // Discontinued items not in cache
          score: 1,
          match: {}
        }));
      }

      // Fallback to API search
      console.log('📡 Using API search (no local cache)');
      const results = await medicineApi.search({
        q: query,
        limit: options?.limit || 50, // Increased from 20 to 50
        discontinued: options?.includeDiscontinued,
      });

      // API returns array directly, not { results: [] }
      if (!Array.isArray(results)) {
        console.error('Unexpected API response format:', results);
        return [];
      }

      // Transform API response to match old format
      return results.map((result: any) => ({
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
        manufacturerName: result.manufacturerName,
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

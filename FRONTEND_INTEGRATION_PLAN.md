# Frontend Integration Plan - Medicine Master System

## Overview

The frontend currently uses **MiniSearch** with a local JSON file (`/data/medicine-index.json`). We need to migrate to the new **Typesense-powered backend API** for real-time search with the universal medicine master database.

## Current Architecture

```
Frontend (Next.js)
    │
    ├─ lib/search/medicineSearch.ts (MiniSearch)
    │   └─ Loads /data/medicine-index.json
    │
    ├─ hooks/useMedicineSearch.ts
    │   └─ Uses medicineSearch service
    │
    └─ components/search/MedicineCommandPalette.tsx
        └─ Uses useMedicineSearch hook
```

## Target Architecture

```
Frontend (Next.js)
    │
    ├─ lib/api/medicineApi.ts (NEW)
    │   └─ Calls backend API endpoints
    │
    ├─ hooks/useMedicineSearch.ts (UPDATED)
    │   └─ Uses medicineApi service
    │
    └─ components/search/MedicineCommandPalette.tsx (NO CHANGES)
        └─ Uses useMedicineSearch hook (same interface)
```

## Migration Strategy

### Phase 1: Create API Client (No Breaking Changes)
1. Create new `lib/api/medicineApi.ts` with backend API calls
2. Keep existing MiniSearch implementation as fallback
3. Add feature flag to switch between implementations

### Phase 2: Update Hook (Backward Compatible)
1. Update `useMedicineSearch` to use new API
2. Maintain same interface (no component changes needed)
3. Add loading states and error handling

### Phase 3: Update Components (Optional)
1. Add store-specific features (overlays, stock)
2. Add real-time updates
3. Remove MiniSearch dependency

---

## Implementation

### Step 1: Create Medicine API Client

**File**: `lib/api/medicineApi.ts`

```typescript
/**
 * Medicine Master API Client
 * 
 * Provides methods to interact with the backend Medicine Master API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface MedicineSearchParams {
  q: string;
  manufacturer?: string;
  schedule?: string;
  requiresPrescription?: boolean;
  discontinued?: boolean;
  form?: string;
  limit?: number;
  offset?: number;
}

export interface MedicineSearchResponse {
  query: string;
  results: any[];
  count: number;
  limit: number;
  offset: number;
}

export interface AutocompleteParams {
  q: string;
  limit?: number;
  manufacturer?: string;
  form?: string;
}

export interface AutocompleteResponse {
  suggestions: any[];
  count: number;
}

class MedicineApiClient {
  private baseUrl: string;
  private storeId: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set the store ID for store-specific operations
   */
  setStoreId(storeId: string) {
    this.storeId = storeId;
  }

  /**
   * Search medicines with fuzzy matching
   */
  async search(params: MedicineSearchParams): Promise<MedicineSearchResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await fetch(`${this.baseUrl}/medicines/search?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Autocomplete search with prefix matching
   */
  async autocomplete(params: AutocompleteParams): Promise<AutocompleteResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await fetch(`${this.baseUrl}/medicines/search/autocomplete?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Autocomplete failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search by composition (salt)
   */
  async searchByComposition(salt: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/medicines/search/by-composition?salt=${encodeURIComponent(salt)}`
    );
    if (!response.ok) {
      throw new Error(`Search by composition failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results;
  }

  /**
   * Search by manufacturer
   */
  async searchByManufacturer(manufacturer: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/medicines/search/by-manufacturer?manufacturer=${encodeURIComponent(manufacturer)}`
    );
    if (!response.ok) {
      throw new Error(`Search by manufacturer failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results;
  }

  /**
   * Get medicine by canonical ID
   */
  async getMedicineById(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/medicines/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Get medicine failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : data;
  }

  /**
   * Get merged medicine (master + store overlay)
   */
  async getMergedMedicine(id: string): Promise<any> {
    if (!this.storeId) {
      return this.getMedicineById(id);
    }

    const response = await fetch(`${this.baseUrl}/stores/${this.storeId}/medicines/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Get merged medicine failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get search index statistics
   */
  async getStats(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/medicines/search/stats`);
    if (!response.ok) {
      throw new Error(`Get stats failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Find medicine by barcode
   */
  async findByBarcode(barcode: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/medicines/barcode/${barcode}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Find by barcode failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : data;
  }
}

// Export singleton instance
export const medicineApi = new MedicineApiClient();
```

### Step 2: Create Adapter for Backward Compatibility

**File**: `lib/search/medicineSearchAdapter.ts`

```typescript
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
```

### Step 3: Update Medicine Search Service with Feature Flag

**File**: `lib/search/medicineSearch.ts` (Updated)

```typescript
import MiniSearch from 'minisearch';
import type { Medicine, MedicineSearchIndex, MedicineSearchResult } from '@/types/medicine';
import { medicineSearchAdapter } from './medicineSearchAdapter';

// Feature flag to switch between implementations
const USE_API = process.env.NEXT_PUBLIC_USE_MEDICINE_API === 'true';

class MedicineSearchService {
    private miniSearch: MiniSearch<Medicine> | null = null;
    private medicines: Medicine[] = [];
    private indexLoaded = false;
    private loadingPromise: Promise<void> | null = null;

    constructor() {
        if (!USE_API) {
            // Initialize MiniSearch configuration (legacy)
            this.miniSearch = new MiniSearch({
                fields: ['name', 'composition', 'manufacturer', 'packSize'],
                storeFields: ['id', 'name', 'price', 'manufacturer', 'packSize', 'composition', 'type', 'discontinued'],
                searchOptions: {
                    boost: { name: 3, composition: 2, manufacturer: 1 },
                    fuzzy: 0.2,
                    prefix: true,
                    combineWith: 'AND'
                }
            });
        }
    }

    /**
     * Load the medicine index
     */
    async loadIndex(): Promise<void> {
        if (USE_API) {
            return medicineSearchAdapter.loadIndex();
        }

        // Legacy MiniSearch implementation
        if (this.indexLoaded) return;
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = (async () => {
            try {
                const response = await fetch('/data/medicine-index.json');
                if (!response.ok) {
                    throw new Error(`Failed to load medicine index: ${response.statusText}`);
                }

                const data: MedicineSearchIndex = await response.json();
                this.medicines = data.medicines;

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
        if (USE_API) {
            return medicineSearchAdapter.search(query, options);
        }

        // Legacy MiniSearch implementation
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

            let filteredResults = results;
            if (!includeDiscontinued) {
                filteredResults = results.filter(r => !r.discontinued);
            }

            const limitedResults = filteredResults.slice(0, limit);

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
        if (USE_API) {
            return medicineSearchAdapter.searchByComposition(salt);
        }

        // Legacy implementation
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
        if (USE_API) {
            return medicineSearchAdapter.searchByManufacturer(manufacturer);
        }

        // Legacy implementation
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
        if (USE_API) {
            return medicineSearchAdapter.getMedicineById(id);
        }

        // Legacy implementation
        if (!this.indexLoaded) {
            await this.loadIndex();
        }

        return this.medicines.find(m => m.id === id) || null;
    }

    /**
     * Get random medicines (for suggestions)
     */
    async getRandomMedicines(count: number = 10): Promise<Medicine[]> {
        if (USE_API) {
            return medicineSearchAdapter.getRandomMedicines(count);
        }

        // Legacy implementation
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
        if (USE_API) {
            return medicineSearchAdapter.isLoaded();
        }
        return this.indexLoaded;
    }

    /**
     * Get total medicine count
     */
    getTotalCount(): number {
        if (USE_API) {
            return medicineSearchAdapter.getTotalCount();
        }
        return this.medicines.length;
    }
}

// Export singleton instance
export const medicineSearch = new MedicineSearchService();
```

### Step 4: Environment Configuration

**File**: `.env.local` (Add these variables)

```bash
# Medicine Master API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_USE_MEDICINE_API=true

# Store ID (for store-specific features)
NEXT_PUBLIC_STORE_ID=your-store-id
```

---

## Migration Steps

### Phase 1: Setup (No Breaking Changes)
1. ✅ Create `lib/api/medicineApi.ts`
2. ✅ Create `lib/search/medicineSearchAdapter.ts`
3. ✅ Update `lib/search/medicineSearch.ts` with feature flag
4. ✅ Add environment variables
5. ✅ Test with `NEXT_PUBLIC_USE_MEDICINE_API=false` (legacy mode)

### Phase 2: Testing
1. Set `NEXT_PUBLIC_USE_MEDICINE_API=true`
2. Test search functionality
3. Test autocomplete
4. Test medicine details
5. Compare results with legacy implementation

### Phase 3: Cleanup (After Validation)
1. Remove MiniSearch dependency
2. Remove `/data/medicine-index.json`
3. Remove legacy code from `medicineSearch.ts`
4. Remove `scripts/buildMedicineIndex.ts`

---

## Benefits of Migration

### Performance
- ✅ No large JSON file download (saves ~5-10MB)
- ✅ Faster initial page load
- ✅ Real-time search results
- ✅ Server-side caching

### Features
- ✅ Store-specific pricing and inventory
- ✅ Real-time stock updates
- ✅ Custom GST rates per store
- ✅ QR code management
- ✅ Medicine versioning and history

### Scalability
- ✅ Supports 300K+ medicines
- ✅ No client-side memory limits
- ✅ Centralized data management
- ✅ Multi-store support

### Maintenance
- ✅ Single source of truth
- ✅ No need to rebuild index
- ✅ Automatic updates
- ✅ Better error handling

---

## Testing Checklist

### Functional Testing
- [ ] Search returns results
- [ ] Autocomplete works
- [ ] Search by composition works
- [ ] Search by manufacturer works
- [ ] Medicine details load correctly
- [ ] Discontinued medicines are filtered
- [ ] Recent medicines are tracked

### Performance Testing
- [ ] Initial load time < 2s
- [ ] Search response time < 500ms
- [ ] Autocomplete response time < 300ms
- [ ] No memory leaks

### Error Handling
- [ ] API errors are caught and logged
- [ ] Fallback to empty results on error
- [ ] User-friendly error messages
- [ ] Retry logic for failed requests

---

## Rollback Plan

If issues arise:

1. Set `NEXT_PUBLIC_USE_MEDICINE_API=false`
2. System reverts to MiniSearch
3. No code changes needed
4. No data loss

---

## Timeline

- **Phase 1 (Setup)**: 2 hours
- **Phase 2 (Testing)**: 1 hour
- **Phase 3 (Cleanup)**: 30 minutes
- **Total**: 3.5 hours

---

## Next Steps

1. Create the three new files
2. Add environment variables
3. Test with feature flag disabled
4. Test with feature flag enabled
5. Compare results
6. Deploy to production
7. Monitor for issues
8. Clean up legacy code

---

**Status**: Ready to Implement  
**Priority**: High  
**Estimated Time**: 3.5 hours  
**Risk**: Low (feature flag allows easy rollback)

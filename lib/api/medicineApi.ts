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
    
    // Auto-set store ID from environment
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STORE_ID) {
      this.storeId = process.env.NEXT_PUBLIC_STORE_ID;
    }
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

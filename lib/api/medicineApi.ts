/**
 * Medicine Master API Client
 * 
 * Provides methods to interact with the backend Medicine Master API
 * Store ID is automatically retrieved from the user's session cookies
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1';

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

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make authenticated request with cookies
   * Store ID is automatically included from session cookies
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
      ...options,
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
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

    const response = await this.fetchWithAuth(`${this.baseUrl}/medicines/search?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : data;
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

    const response = await this.fetchWithAuth(`${this.baseUrl}/medicines/autocomplete?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Autocomplete failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : data;
  }

  /**
   * Search by composition (salt)
   */
  async searchByComposition(salt: string): Promise<any[]> {
    const response = await this.fetchWithAuth(
      `${this.baseUrl}/medicines/search/by-composition?salt=${encodeURIComponent(salt)}`
    );
    if (!response.ok) {
      throw new Error(`Search by composition failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : data.results || data;
  }

  /**
   * Search by manufacturer
   */
  async searchByManufacturer(manufacturer: string): Promise<any[]> {
    const response = await this.fetchWithAuth(
      `${this.baseUrl}/medicines/search/by-manufacturer?manufacturer=${encodeURIComponent(manufacturer)}`
    );
    if (!response.ok) {
      throw new Error(`Search by manufacturer failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : data.results || data;
  }

  /**
   * Get medicine by canonical ID
   */
  async getMedicineById(id: string): Promise<any> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/medicines/${id}`);
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
   * Store ID is automatically retrieved from session
   */
  async getMergedMedicine(id: string): Promise<any> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/medicines/${id}/merged`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Get merged medicine failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : data;
  }

  /**
   * Get search index statistics
   */
  async getStats(): Promise<any> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/medicines/stats`);
    if (!response.ok) {
      throw new Error(`Get stats failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : data;
  }

  /**
   * Find medicine by barcode
   */
  async findByBarcode(barcode: string): Promise<any> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/medicines/barcode/${barcode}`);
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

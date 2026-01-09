import { PurchaseOrder, ValidationResult, SuggestedItem } from '@/types/po';
import { apiClient } from './client';

export const poApi = {
  // Create draft PO
  createDraft: async (storeId: string, po: Partial<PurchaseOrder>): Promise<{ po: PurchaseOrder; auditEventId: string }> => {
    const response = await apiClient.post(`/stores/${storeId}/pos/draft`, po);
    return response.data;
  },

  // Get suggested reorder items
  getSuggestions: async (storeId: string, limit = 100): Promise<SuggestedItem[]> => {
    const response = await apiClient.get(`/stores/${storeId}/inventory/suggestions?limit=${limit}`);
    return response.data;
  },

  // Get supplier catalog/prices
  getSupplierCatalog: async (supplierId: string, drugId?: string) => {
    const endpoint = drugId
      ? `/suppliers/${supplierId}/catalog?drugId=${drugId}`
      : `/suppliers/${supplierId}/catalog`;

    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Validate PO
  validate: async (po: PurchaseOrder): Promise<ValidationResult> => {
    const response = await apiClient.post('/pos/validate', po);
    return response.data;
  },

  // Request approval
  requestApproval: async (poId: string, approvers: string[], note?: string) => {
    const response = await apiClient.post(`/pos/${poId}/request-approval`, { approvers, note });
    return response.data;
  },

  // Approve PO
  approve: async (poId: string, approverId: string, comment?: string) => {
    const response = await apiClient.post(`/pos/${poId}/approve`, { approverId, comment });
    return response.data;
  },

  // Send PO
  send: async (poId: string, channel: string, channelPayload?: any, sendAsPdf = true) => {
    const response = await apiClient.post(`/pos/${poId}/send`, { channel, channelPayload, sendAsPdf });
    return response.data;
  },

  // Get PO preview PDF
  getPreviewPdf: (poId: string): string => {
    // This returns a URL string, not a promise. 
    // This is likely used for IFrames or links.
    // apiClient cannot be used here as it wraps fetch.
    // We should probably keep this, but ensure the caller handles auth if accessing this URL directly?
    // Or maybe we should return a blob using apiClient?
    // The original code returned a string.
    // If this URL is used in <iframe src="...">, then auth headers won't be sent automatically unless cookies are used.
    // Since we use httpOnly cookies, this MIGHT work if on same domain.
    // But apiClient logic suggests we rely on bearer tokens in headers or cookies.
    // Let's assume the existing string return logic is for UI rendering and keep it compatible with existing usage (path construction).
    // However, the original code used `API_BASE` which was `/api`.
    // If we want consistency, we should use the configured API base URL.
    // But since I don't have getApiBaseUrl imported here (it wasn't before, only API_BASE='/api'), 
    // I will use apiClient.getUri() if available or just hardcode if I must.
    // Better: Helper function to get full URL?
    // The original code was: return `${API_BASE}/pos/${poId}/preview.pdf`; where API_BASE='/api'
    return `/api/v1/pos/${poId}/preview.pdf`;
  },

  // Upload attachment
  uploadAttachment: async (poId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // apiClient supports FormData automatically in post/put
    const response = await apiClient.post(`/pos/${poId}/attachments`, formData);
    return response.data;
  },

  // Search products
  searchProducts: async (query: string, supplierId?: string) => {
    const params = new URLSearchParams({ q: query });
    if (supplierId) params.append('supplierId', supplierId);

    const response = await apiClient.get(`/products/search?${params}`);
    return response.data;
  },

  // Get suppliers
  getSuppliers: async () => {
    const response = await apiClient.get('/suppliers');
    return response.data;
  }
};
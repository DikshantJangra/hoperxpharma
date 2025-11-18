import { PurchaseOrder, ValidationResult, SuggestedItem } from '@/types/po';

const API_BASE = '/api';

export const poApi = {
  // Create draft PO
  createDraft: async (storeId: string, po: Partial<PurchaseOrder>): Promise<{ po: PurchaseOrder; auditEventId: string }> => {
    const response = await fetch(`${API_BASE}/stores/${storeId}/pos/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(po)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create draft PO');
    }
    
    return response.json();
  },

  // Get suggested reorder items
  getSuggestions: async (storeId: string, limit = 100): Promise<SuggestedItem[]> => {
    const response = await fetch(`${API_BASE}/stores/${storeId}/inventory/suggestions?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }
    
    return response.json();
  },

  // Get supplier catalog/prices
  getSupplierCatalog: async (supplierId: string, drugId?: string) => {
    const url = drugId 
      ? `${API_BASE}/suppliers/${supplierId}/catalog?drugId=${drugId}`
      : `${API_BASE}/suppliers/${supplierId}/catalog`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch supplier catalog');
    }
    
    return response.json();
  },

  // Validate PO
  validate: async (po: PurchaseOrder): Promise<ValidationResult> => {
    const response = await fetch(`${API_BASE}/pos/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(po)
    });
    
    if (!response.ok) {
      throw new Error('Validation failed');
    }
    
    return response.json();
  },

  // Request approval
  requestApproval: async (poId: string, approvers: string[], note?: string) => {
    const response = await fetch(`${API_BASE}/pos/${poId}/request-approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvers, note })
    });
    
    if (!response.ok) {
      throw new Error('Failed to request approval');
    }
    
    return response.json();
  },

  // Approve PO
  approve: async (poId: string, approverId: string, comment?: string) => {
    const response = await fetch(`${API_BASE}/pos/${poId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverId, comment })
    });
    
    if (!response.ok) {
      throw new Error('Failed to approve PO');
    }
    
    return response.json();
  },

  // Send PO
  send: async (poId: string, channel: string, channelPayload?: any, sendAsPdf = true) => {
    const response = await fetch(`${API_BASE}/pos/${poId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, channelPayload, sendAsPdf })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send PO');
    }
    
    return response.json();
  },

  // Get PO preview PDF
  getPreviewPdf: (poId: string): string => {
    return `${API_BASE}/pos/${poId}/preview.pdf`;
  },

  // Upload attachment
  uploadAttachment: async (poId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/pos/${poId}/attachments`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload attachment');
    }
    
    return response.json();
  },

  // Search products
  searchProducts: async (query: string, supplierId?: string) => {
    const params = new URLSearchParams({ q: query });
    if (supplierId) params.append('supplierId', supplierId);
    
    const response = await fetch(`${API_BASE}/products/search?${params}`);
    
    if (!response.ok) {
      throw new Error('Product search failed');
    }
    
    return response.json();
  },

  // Get suppliers
  getSuppliers: async () => {
    const response = await fetch(`${API_BASE}/suppliers`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch suppliers');
    }
    
    return response.json();
  }
};
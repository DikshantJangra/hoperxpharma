import { apiClient } from '@/lib/api/client';

export const prescriptionApi = {
  // Get all prescriptions with optional filters
  async getPrescriptions(params?: { status?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    return apiClient.get(`/prescriptions${queryString ? `?${queryString}` : ''}`);
  },

  // Get single prescription by ID
  async getPrescriptionById(id: string) {
    return apiClient.get(`/prescriptions/${id}`);
  },

  // Create new prescription
  async createPrescription(data: any) {
    return apiClient.post('/prescriptions', data);
  },

  // Verify prescription (Clinical Check)
  async verifyPrescription(id: string, data?: { override?: boolean; reason?: string }) {
    return apiClient.post(`/prescriptions/${id}/verify`, data || {});
  },

  // Place prescription on hold
  async holdPrescription(id: string, data: { reason: string; expectedResolutionDate?: string; assignTo?: string }) {
    return apiClient.post(`/prescriptions/${id}/hold`, data);
  }
};

export const dispenseApi = {
  // Get dispense queue
  async getQueue() {
    return apiClient.get('/dispense/queue');
  },

  // Start fill workflow
  async startFill(prescriptionId: string) {
    return apiClient.post(`/dispense/${prescriptionId}/start`);
  },

  // Scan barcode (safety-critical)
  async scanBarcode(dispenseEventId: string, data: {
    barcode?: string;
    drugId: string;
    batchNumber: string;
    quantity: number;
  }) {
    return apiClient.post(`/dispense/${dispenseEventId}/scan`, data);
  },

  // Release prescription (pharmacist only)
  async release(dispenseEventId: string, data: { visualCheckConfirmed: boolean }) {
    return apiClient.post(`/dispense/${dispenseEventId}/release`, data);
  }
};

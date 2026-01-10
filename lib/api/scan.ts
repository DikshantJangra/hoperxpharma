import { apiClient } from './client';

/**
 * Scan API Client
 * Handles all barcode/QR scanning operations
 */

export interface BarcodeEnrollRequest {
    barcode: string;
    batchId: string;
    barcodeType?: 'MANUFACTURER' | 'INTERNAL' | 'SECONDARY';
    unitType?: 'STRIP' | 'BOTTLE' | 'BOX';
}

export interface ScanProcessResponse {
    batchId: string;
    drugId: string;
    drugName: string;
    strength: string;
    form: string;
    manufacturer: string;
    batchNumber: string;
    expiryDate: string;
    daysToExpiry: number;
    isExpiringSoon: boolean;
    isExpired: boolean;
    quantityInStock: number;
    baseUnitQuantity: number;
    mrp: number;
    gstRate: number;
    location?: string;
    tabletsPerStrip?: number;
    hasPartialStrips: boolean;
}

export interface BulkLookupRequest {
    barcodes: string[];
}

export const scanApi = {
    /**
     * Enroll barcode for a batch (during GRN)
     */
    enrollBarcode: async (data: BarcodeEnrollRequest) => {
        const response = await apiClient.post('/scan/enroll', data);
        return response.data;
    },

    /**
     * Generate internal QR code for a batch
     */
    generateQR: async (batchId: string) => {
        const response = await apiClient.post(`/scan/qr/${batchId}`);
        return response.data;
    },

    /**
     * Process scanned barcode (main POS workflow)
     */
    processScan: async (barcode: string, context: 'SALE' | 'VERIFICATION' | 'ADJUSTMENT' | 'RETURN' | 'GRN' = 'SALE') => {
        const response = await apiClient.post('/scan/process', {
            barcode,
            context
        });
        return response.data;
    },

    /**
     * Verify barcode validity
     */
    verifyBarcode: async (barcode: string) => {
        const response = await apiClient.get(`/scan/verify/${barcode}`);
        return response.data;
    },

    /**
     * Get scan history for employee
     */
    getScanHistory: async (params?: { employeeId?: string; startDate?: string; endDate?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.employeeId) searchParams.append('employeeId', params.employeeId);
        if (params?.startDate) searchParams.append('startDate', params.startDate);
        if (params?.endDate) searchParams.append('endDate', params.endDate);

        const response = await apiClient.get(`/scan/history?${searchParams.toString()}`);
        return response.data;
    },

    /**
     * Bulk barcode lookup
     */
    bulkLookup: async (data: BulkLookupRequest) => {
        const response = await apiClient.post('/scan/bulk-lookup', data);
        return response.data;
    }
};

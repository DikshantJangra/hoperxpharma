import { apiClient } from './client';

// ========== TAX SLABS ==========

export interface TaxSlab {
    id: string;
    storeId: string | null;
    name: string;
    rate: number;
    taxType: string;
    isActive: boolean;
    isSplit: boolean;
    cgstRate: number | null;
    sgstRate: number | null;
    igstRate: number | null;
    cessRate: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaxSlabData {
    name: string;
    rate: number;
    taxType: 'GST' | 'CESS' | 'EXEMPT';
    isSplit?: boolean;
    cessRate?: number;
}

export const getTaxSlabs = async (isActive?: boolean) => {
    const params = isActive !== undefined ? { isActive: isActive.toString() } : {};
    const response = await apiClient.get('/gst/tax-slabs', { params });
    return response.data.data as TaxSlab[];
};

export const getTaxSlabById = async (id: string) => {
    const response = await apiClient.get(`/gst/tax-slabs/${id}`);
    return response.data.data as TaxSlab;
};

export const createTaxSlab = async (data: CreateTaxSlabData) => {
    const response = await apiClient.post('/gst/tax-slabs', data);
    return response.data.data as TaxSlab;
};

export const updateTaxSlab = async (id: string, data: Partial<CreateTaxSlabData>) => {
    const response = await apiClient.put(`/gst/tax-slabs/${id}`, data);
    return response.data.data as TaxSlab;
};

export const deleteTaxSlab = async (id: string) => {
    const response = await apiClient.delete(`/gst/tax-slabs/${id}`);
    return response.data;
};

// ========== HSN CODES ==========

export interface HsnCode {
    id: string;
    storeId: string | null;
    code: string;
    description: string;
    taxSlabId: string;
    category: string | null;
    isActive: boolean;
    taxSlab: TaxSlab;
    createdAt: string;
    updatedAt: string;
}

export interface CreateHsnCodeData {
    code: string;
    description: string;
    taxSlabId: string;
    category?: string;
}

export const getHsnCodes = async (params?: {
    search?: string;
    category?: string;
    isActive?: boolean;
}) => {
    const response = await apiClient.get('/gst/hsn-codes', { params });
    return response.data.data as HsnCode[];
};

export const getHsnCodeById = async (id: string) => {
    const response = await apiClient.get(`/gst/hsn-codes/${id}`);
    return response.data.data as HsnCode;
};

export const createHsnCode = async (data: CreateHsnCodeData) => {
    const response = await apiClient.post('/gst/hsn-codes', data);
    return response.data.data as HsnCode;
};

export const updateHsnCode = async (id: string, data: Partial<CreateHsnCodeData>) => {
    const response = await apiClient.put(`/gst/hsn-codes/${id}`, data);
    return response.data.data as HsnCode;
};

export const deleteHsnCode = async (id: string) => {
    const response = await apiClient.delete(`/gst/hsn-codes/${id}`);
    return response.data;
};

// ========== REPORTING ==========

export interface GSTDashboardData {
    totalSales: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    cessAmount: number;
    totalGstCollected: number;
    totalInvoices: number;
    zeroRatedCount: number;
    zeroRatedTotal: number;
    b2bCount: number;
    b2cCount: number;
    categoryBreakdown: Record<string, number>;
    confidenceScore: number;
    risks: Array<{
        type: string;
        severity: 'HIGH' | 'MEDIUM' | 'LOW';
        message: string;
        deduction: number;
    }>;
}

export interface GSTR1Summary {
    b2b: {
        invoices: Array<{
            invoiceNumber: string;
            invoiceDate: string;
            buyerGstin: string;
            placeOfSupply: string;
            taxableValue: number;
            cgst: number;
            sgst: number;
            igst: number;
            cess: number;
            invoiceValue: number;
        }>;
        count: number;
        totalValue: number;
    };
    b2cLarge: {
        invoices: Array<any>;
        count: number;
        totalValue: number;
    };
    b2cSmall: {
        count: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalValue: number;
    };
    hsnSummary: Array<{
        hsnCode: string;
        description: string;
        uqc: string;
        totalQuantity: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
        cess: number;
    }>;
    period: {
        from: string;
        to: string;
    };
}

export interface GSTR3BSummary {
    outwardSupplies: {
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
        cess: number;
    };
    interStateSupplies: {
        taxableValue: number;
        igst: number;
    };
    inputTaxCredit: {
        cgst: number;
        sgst: number;
        igst: number;
        cess: number;
        note: string;
    };
    taxPayable: {
        cgst: number;
        sgst: number;
        igst: number;
        cess: number;
    };
    period: {
        from: string;
        to: string;
    };
}

export const getGSTDashboard = async (month?: string) => {
    const params = month ? { month } : {};
    const response = await apiClient.get('/gst/dashboard', { params });
    return response.data.data as GSTDashboardData;
};

export const getGSTR1Summary = async (month?: string) => {
    const params = month ? { month } : {};
    const response = await apiClient.get('/gst/gstr1-summary', { params });
    return response.data.data as GSTR1Summary;
};

export const getGSTR3BSummary = async (month?: string) => {
    const params = month ? { month } : {};
    const response = await apiClient.get('/gst/gstr3b-summary', { params });
    return response.data.data as GSTR3BSummary;
};

export const getMonthlyTrends = async (months: number = 6) => {
    const response = await apiClient.get('/gst/trends', { params: { months } });
    return response.data.data as Array<{
        month: string;
        taxableAmount: number;
        totalGstCollected: number;
        invoiceCount: number;
    }>;
};

// ========== UTILITIES ==========

export const seedGSTDefaults = async () => {
    const response = await apiClient.post('/gst/seed-defaults');
    return response.data;
};

export const validateGSTIN = async (gstin: string) => {
    const response = await apiClient.post('/gst/validate-gstin', { gstin });
    return response.data.data as { gstin: string; isValid: boolean };
};

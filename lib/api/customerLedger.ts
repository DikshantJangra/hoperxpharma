import { apiClient } from './client';

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    currentBalance: number;
    creditLimit: number;
}

export type LedgerType = 'DEBIT' | 'CREDIT';
export type LedgerReferenceType = 'SALE' | 'PAYMENT' | 'RETURN' | 'OPENING_BALANCE' | 'ADJUSTMENT' | 'REFUND';

export interface CustomerLedgerEntry {
    id: string;
    storeId: string;
    patientId: string;
    type: LedgerType;
    amount: number;
    balanceAfter: number;
    referenceType: LedgerReferenceType;
    referenceId?: string;
    notes?: string;
    createdBy?: string;
    createdAt: string;
    allocations?: {
        sale: {
            invoiceNumber: string;
        };
        amount: number;
    }[];
}

export const customerLedgerApi = {
    /**
     * Get Customer Ledger History
     */
    async getLedger(patientId: string, params: { page?: number; limit?: number } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());

        const response = await apiClient.get(`/patients/${patientId}/ledger?${query.toString()}`);
        return response; // Returns { data: CustomerLedgerEntry[], meta: ... }
    },

    /**
     * Get Unpaid Invoices
     */
    async getUnpaidInvoices(patientId: string) {
        const response = await apiClient.get(`/patients/${patientId}/invoices/unpaid`);
        return response.data; // Returns UnpaidInvoice[]
    },

    /**
     * Process a Payment to settle debt
     */
    async makePayment(patientId: string, data: {
        amount: number;
        paymentMethod: string;
        notes?: string;
        allocations?: { saleId: string; amount: number }[]
    }) {
        const response = await apiClient.post(`/patients/${patientId}/payments`, data);
        return response.data;
    },
};

export interface UnpaidInvoice {
    id: string;
    invoiceNumber: string;
    createdAt: string;
    total: number;
    balance: number;
    paymentStatus: 'UNPAID' | 'PARTIAL' | 'OVERDUE';
    expectedPaymentDate?: string;
}

export type SupplierCategory = 'Distributor' | 'Manufacturer' | 'Wholesaler';
export type SupplierStatus = 'Active' | 'Inactive' | 'Pending Verification' | 'Blacklisted';
export type PaymentTerm = 'Net 0' | 'Net 7' | 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60';

export interface SupplierContact {
    primaryName: string;
    phone: string;
    email: string;
    whatsapp?: string;
    address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    };
}

export interface SupplierLicense {
    id: string;
    type: 'Drug License' | 'FSSAI' | 'Trade License' | 'GST Certificate' | 'Other';
    number: string;
    validFrom: string;
    validTo: string;
    documentUrl?: string;
    status: 'Active' | 'Expired' | 'Expiring Soon';
}

export interface SupplierBankDetails {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branchName?: string;
    upiId?: string;
}

export interface SupplierPerformance {
    rating: number; // 1-5
    onTimeDeliveryRate: number; // percentage
    returnRate: number; // percentage
    qualityScore: number; // 1-10
    totalOrders: number;
    lastOrderDate?: string;
    totalSpent: number;
    outstandingBalance: number;
}

export interface Supplier {
    id: string;
    name: string;
    category: SupplierCategory;
    status: SupplierStatus;
    gstin: string;
    dlNumber?: string;
    pan?: string;

    contact: SupplierContact;

    paymentTerms: PaymentTerm;
    creditLimit?: number;
    bankDetails?: SupplierBankDetails;

    licenses: SupplierLicense[];

    performance: SupplierPerformance;

    tags: string[];
    notes?: string;

    createdAt: string;
    updatedAt: string;

    purchaseOrders?: PurchaseOrder[];
    returns?: SupplierReturn[];
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    createdAt: string;
    total: number;
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
}

export interface SupplierReturn {
    id: string;
    returnNumber: string;
    createdAt: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
    total: number;
}

export interface SupplierFilter {
    search?: string;
    category?: SupplierCategory[];
    status?: SupplierStatus[];
    minRating?: number;
    hasOutstanding?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  gstin?: string;
  defaultLeadTimeDays: number;
  contact: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  paymentTerms?: string;
}

export interface POLine {
  lineId: string;
  drugId?: string; // Optional for catalog medicines
  description: string;
  packUnit: string;
  packSize: number;
  qty: number;
  unit: string;
  pricePerUnit: number;
  discountPercent: number;
  gstPercent: number;
  lineNet: number;
  lastPurchasePrice?: number;
  suggestedQty?: number;
  reorderReason?: string;
  preferredBatch?: string;
  notes?: string;
  moq?: number;
}

export interface PurchaseOrder {
  poId?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'closed' | 'cancelled';
  supplier?: Supplier;
  storeId: string;
  deliveryAddress: {
    line1: string;
    city: string;
    pin: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  currency: string;
  lines: POLine[];
  subtotal: number;
  taxBreakdown: Array<{
    gstPercent: number;
    taxable: number;
    tax: number;
  }>;
  total: number;
  notes?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  auditEventId?: string;
  approvalThreshold?: number;
  approvers?: string[];
  store?: {
    name: string;
    displayName: string;
    addressLine1: string;
    city: string;
    state: string;
    pinCode: string;
    phoneNumber: string;
    email: string;
    licenses?: Array<{ type: string; number: string }>;
  };
}

export interface SuggestedItem {
  drugId: string;
  description: string;
  suggestedQty: number;
  reason: string;
  confidenceScore: number;
  lastPurchasePrice?: number;
  currentStock: number;
  packUnit: string;
  gstPercent: number;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface ApprovalRequest {
  approvers: string[];
  note?: string;
}

export interface SendPORequest {
  channel: 'email' | 'whatsapp' | 'print' | 'api';
  channelPayload?: any;
  sendAsPdf?: boolean;
}
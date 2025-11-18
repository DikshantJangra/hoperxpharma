export type LedgerType = 'INVOICE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
export type PaymentSource = 'POS' | 'ONLINE' | 'MANUAL';
export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED';
export type ReconStatus = 'MATCHED' | 'UNMATCHED' | 'PARTIAL';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'WALLET';

export interface LedgerRow {
  id: string;
  type: LedgerType;
  date: string;
  invoiceId: string;
  storeId: string;
  source: PaymentSource;
  customer: { id: string; name: string };
  gross: number;
  tax: number;
  net: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bankTransactionId?: string;
  reconStatus: ReconStatus;
  tags: string[];
  auditEventId?: string;
}

export interface SalesSummary {
  revenue: number;
  cash: number;
  card: number;
  upi: number;
  wallet: number;
  outstanding: number;
  refunds: { count: number; amount: number };
  reconRate: number;
}

export interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  reference: string;
  description: string;
  matched: boolean;
}

export interface MatchCandidate {
  bankTx: BankTransaction;
  confidence: number;
}

export interface SalesFilters {
  from: string;
  to: string;
  storeId?: string;
  source?: PaymentSource;
  paymentMethod?: PaymentMethod;
  reconStatus?: ReconStatus;
  tags?: string[];
}

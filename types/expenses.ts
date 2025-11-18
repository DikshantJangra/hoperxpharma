export type ExpenseStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'PARTIAL' | 'DISPUTED' | 'CANCELLED';

export interface Expense {
  expenseId: string;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  grossAmount: number;
  gstAmount: number;
  tdsAmount: number;
  netAmount: number;
  category: string;
  glAccount: string;
  storeId: string;
  status: ExpenseStatus;
  attachments: Array<{ id: string; name: string; url: string }>;
  createdBy: { id: string; name: string };
  createdAt: string;
  approvalHistory: Array<{ actor: string; action: string; timestamp: string; comment: string }>;
  reconciliation: { matched: boolean; bankTxId: string | null };
  auditEventId?: string;
}

export interface ExpenseSummary {
  totalSpend: number;
  outstanding: number;
  overdue: number;
  pendingApproval: number;
}

export interface ExpenseFilters {
  from: string;
  to: string;
  storeId?: string;
  vendorId?: string;
  category?: string;
  status?: ExpenseStatus;
}

export interface OCRResult {
  ocrId: string;
  vendorCandidates: Array<{ id: string; score: number; name: string }>;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  lines: Array<{ desc: string; qty: number; rate: number; gstPercent: number }>;
  confidence: number;
}

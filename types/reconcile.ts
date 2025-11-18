export type TxnDirection = 'CR' | 'DR';
export type TxnStatus = 'UNMATCHED' | 'SUGGESTED' | 'MATCHED' | 'SUSPICIOUS';
export type AllocationType = 'INVOICE' | 'EXPENSE' | 'ADJUSTMENT';

export interface BankTransaction {
  txnId: string;
  accountId: string;
  date: string;
  amount: number;
  currency: string;
  direction: TxnDirection;
  description: string;
  bankRef: string;
  normalized: {
    invoiceIds: string[];
    upiId?: string;
  };
  status: TxnStatus;
  suggestions: MatchSuggestion[];
  audit: { createdBy: string; createdAt: string };
}

export interface MatchSuggestion {
  candidateId: string;
  type: AllocationType;
  score: number;
  reason: string;
  amount: number;
  reference: string;
}

export interface Allocation {
  type: AllocationType;
  id: string;
  amount: number;
}

export interface ReconcileSummary {
  lastSync: string;
  unmatched: number;
  suggested: number;
  suspicious: number;
}

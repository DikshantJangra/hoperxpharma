'use client';

import React, { useState } from 'react';
import { BankTransaction, ReconcileSummary, Allocation } from '@/types/reconcile';
import FeedListPanel from './FeedListPanel';
import TxnListView from './TxnListView';
import MatchDetailPanel from './MatchDetailPanel';
import UploadFeedWizard from './UploadFeedWizard';

interface ReconcilePageProps {
  storeId: string;
}

export default function ReconcilePage({ storeId }: ReconcilePageProps) {
  const [summary] = useState<ReconcileSummary>({
    lastSync: '2 hours ago',
    unmatched: 12,
    suggested: 8,
    suspicious: 2
  });

  const [transactions, setTransactions] = useState<BankTransaction[]>([
    {
      txnId: 'bank_001',
      accountId: 'acct_01',
      date: '2025-11-14T10:12:00Z',
      amount: 1500,
      currency: 'INR',
      direction: 'CR',
      description: 'UPI-PAYMENT INV#INV-12345 REF UPI:1234567890',
      bankRef: 'UTR000123',
      normalized: { invoiceIds: ['INV-12345'], upiId: '1234567890' },
      status: 'SUGGESTED',
      suggestions: [
        {
          candidateId: 'inv_12345',
          type: 'INVOICE',
          score: 98,
          reason: 'invoice id in narration; amount exact',
          amount: 1500,
          reference: 'INV-12345'
        }
      ],
      audit: { createdBy: 'system', createdAt: '2025-11-14T10:12:00Z' }
    },
    {
      txnId: 'bank_002',
      accountId: 'acct_01',
      date: '2025-11-14T11:30:00Z',
      amount: 850,
      currency: 'INR',
      direction: 'CR',
      description: 'NEFT PAYMENT FROM CUSTOMER',
      bankRef: 'UTR000124',
      normalized: { invoiceIds: [] },
      status: 'UNMATCHED',
      suggestions: [],
      audit: { createdBy: 'system', createdAt: '2025-11-14T11:30:00Z' }
    },
    {
      txnId: 'bank_003',
      accountId: 'acct_01',
      date: '2025-11-14T14:20:00Z',
      amount: 1500,
      currency: 'INR',
      direction: 'CR',
      description: 'UPI DUPLICATE AMOUNT',
      bankRef: 'UTR000125',
      normalized: { invoiceIds: [] },
      status: 'SUSPICIOUS',
      suggestions: [],
      audit: { createdBy: 'system', createdAt: '2025-11-14T14:20:00Z' }
    }
  ]);

  const [selectedTxn, setSelectedTxn] = useState<BankTransaction | null>(null);
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [activeQueue, setActiveQueue] = useState<string>('unmatched');

  const filteredTransactions = transactions.filter(txn => {
    if (activeQueue === 'unmatched') return txn.status === 'UNMATCHED';
    if (activeQueue === 'suggested') return txn.status === 'SUGGESTED';
    if (activeQueue === 'suspicious') return txn.status === 'SUSPICIOUS';
    return true;
  });

  const handleMatch = async (txnId: string, allocations: Allocation[], note: string) => {
    try {
      const response = await fetch('/api/reconcile/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnId,
          allocations,
          matchedBy: 'u_01',
          note,
          idempotencyKey: `match-${txnId}-${Date.now()}`
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTransactions(transactions.map(t =>
          t.txnId === txnId ? { ...t, status: 'MATCHED' } : t
        ));
        alert(`Matched • Audit ${result.auditEventId}`);
        setSelectedTxn(null);
      }
    } catch (error) {
      alert('Failed to match transaction');
    }
  };

  const handleCreateAdjustment = (txnId: string) => {
    alert('Adjustment modal would open here');
  };

  const handleUploadSubmit = (file: File, mapping: any) => {
    alert(`Processing ${file.name}...`);
    // Mock: add new transactions
    const newTxn: BankTransaction = {
      txnId: `bank_${Date.now()}`,
      accountId: mapping.accountId,
      date: new Date().toISOString(),
      amount: 2000,
      currency: 'INR',
      direction: 'CR',
      description: 'Uploaded transaction',
      bankRef: `UTR${Date.now()}`,
      normalized: { invoiceIds: [] },
      status: 'UNMATCHED',
      suggestions: [],
      audit: { createdBy: 'u_01', createdAt: new Date().toISOString() }
    };
    setTransactions([newTxn, ...transactions]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Reconciliation</h1>
          <div className="flex gap-4 text-sm">
            <div className="text-gray-600">
              Last sync: <span className="font-medium text-gray-900">{summary.lastSync}</span>
            </div>
            <div className="text-gray-600">
              Unmatched: <span className="font-medium text-orange-600">{summary.unmatched}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12">
        <div className="col-span-3">
          <FeedListPanel
            summary={summary}
            onUploadClick={() => setShowUploadWizard(true)}
            onQueueClick={setActiveQueue}
          />
        </div>

        <div className="col-span-6 p-6">
          <TxnListView
            transactions={filteredTransactions}
            selectedId={selectedTxn?.txnId}
            onRowClick={setSelectedTxn}
          />
        </div>

        <div className="col-span-3">
          <MatchDetailPanel
            txn={selectedTxn}
            onMatch={handleMatch}
            onCreateAdjustment={handleCreateAdjustment}
          />
        </div>
      </div>

      <UploadFeedWizard
        isOpen={showUploadWizard}
        onClose={() => setShowUploadWizard(false)}
        onSubmit={handleUploadSubmit}
      />
    </div>
  );
}

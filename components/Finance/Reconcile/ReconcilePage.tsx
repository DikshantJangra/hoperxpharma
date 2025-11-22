'use client';

import React, { useState, useEffect } from 'react';
import { BankTransaction, ReconcileSummary, Allocation } from '@/types/reconcile';
import FeedListPanel from './FeedListPanel';
import TxnListView from './TxnListView';
import MatchDetailPanel from './MatchDetailPanel';
import UploadFeedWizard from './UploadFeedWizard';

interface ReconcilePageProps {
  storeId: string;
}

export default function ReconcilePage({ storeId }: ReconcilePageProps) {
  const [summary, setSummary] = useState<ReconcileSummary>({
    lastSync: 'fetching...',
    unmatched: 0,
    suggested: 0,
    suspicious: 0
  });

  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTxn, setSelectedTxn] = useState<BankTransaction | null>(null);
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [activeQueue, setActiveQueue] = useState<string>('unmatched');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setSummary({
            lastSync: 'Just now',
            unmatched: 0,
            suggested: 0,
            suspicious: 0
        });
        setTransactions([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs once on mount


  const filteredTransactions = transactions.filter(txn => {
    if (activeQueue === 'unmatched') return txn.status === 'UNMATCHED';
    if (activeQueue === 'suggested') return txn.status === 'SUGGESTED';
    if (activeQueue === 'suspicious') return txn.status === 'SUSPICIOUS';
    return true;
  });

  const handleMatch = async (txnId: string, allocations: Allocation[], note: string) => {
    // Simulate API call
    alert(`Matching transaction ${txnId}...`);
    setTransactions(prevTxns => prevTxns.map(t =>
      t.txnId === txnId ? { ...t, status: 'MATCHED' } : t
    ));
    setSelectedTxn(null);
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
    setTransactions(prevTxns => [newTxn, ...prevTxns]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Reconciliation</h1>
          <div className="flex gap-4 text-sm">
            <div className="text-gray-600">
              Last sync: {isLoading ? <span className="font-medium text-gray-400 animate-pulse">fetching...</span> : <span className="font-medium text-gray-900">{summary.lastSync}</span>}
            </div>
            <div className="text-gray-600">
              Unmatched: {isLoading ? <span className="font-medium text-gray-400 animate-pulse">...</span> : <span className="font-medium text-orange-600">{summary.unmatched}</span>}
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
            isLoading={isLoading}
          />
        </div>

        <div className="col-span-6 p-6">
          <TxnListView
            transactions={filteredTransactions}
            selectedId={selectedTxn?.txnId}
            onRowClick={setSelectedTxn}
            isLoading={isLoading}
          />
        </div>

        <div className="col-span-3">
          <MatchDetailPanel
            txn={selectedTxn}
            onMatch={handleMatch}
            onCreateAdjustment={handleCreateAdjustment}
            isLoading={isLoading && !selectedTxn}
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

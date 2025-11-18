'use client';

import React from 'react';
import { BankTransaction } from '@/types/reconcile';
import TxnRow from './TxnRow';

interface TxnListViewProps {
  transactions: BankTransaction[];
  selectedId?: string;
  onRowClick: (txn: BankTransaction) => void;
}

export default function TxnListView({ transactions, selectedId, onRowClick }: TxnListViewProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No transactions found.</p>
        <p className="text-sm text-gray-400 mt-1">Upload a bank feed to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Ref</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matches</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map(txn => (
              <TxnRow
                key={txn.txnId}
                txn={txn}
                selected={txn.txnId === selectedId}
                onClick={() => onRowClick(txn)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

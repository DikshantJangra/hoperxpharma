'use client';

import React from 'react';
import { BankTransaction } from '@/types/reconcile';
import { HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineLightBulb } from 'react-icons/hi2';

interface TxnRowProps {
  txn: BankTransaction;
  selected: boolean;
  onClick: () => void;
}

export default function TxnRow({ txn, selected, onClick }: TxnRowProps) {
  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  const statusIcons = {
    MATCHED: <HiOutlineCheckCircle className="h-4 w-4 text-green-600" />,
    SUGGESTED: <HiOutlineLightBulb className="h-4 w-4 text-blue-600" />,
    UNMATCHED: <span className="h-4 w-4 inline-block rounded-full bg-orange-400"></span>,
    SUSPICIOUS: <HiOutlineExclamationTriangle className="h-4 w-4 text-red-600" />
  };

  const statusColors = {
    MATCHED: 'bg-green-100 text-green-800',
    SUGGESTED: 'bg-blue-100 text-blue-800',
    UNMATCHED: 'bg-orange-100 text-orange-800',
    SUSPICIOUS: 'bg-red-100 text-red-800'
  };

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''} ${
        txn.status === 'UNMATCHED' ? 'border-l-4 border-orange-400' : ''
      } ${txn.status === 'SUSPICIOUS' ? 'border-l-4 border-red-400' : ''}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {statusIcons[txn.status]}
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[txn.status]}`}>
            {txn.status}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(txn.date)}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{txn.bankRef}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{txn.description}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {txn.direction === 'CR' ? '+' : '-'}{formatCurrency(txn.amount)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {txn.suggestions.length > 0 && (
          <span className="text-xs text-blue-600">{txn.suggestions.length} suggestions</span>
        )}
      </td>
    </tr>
  );
}

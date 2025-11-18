'use client';

import React from 'react';
import { LedgerRow as LedgerRowType } from '@/types/finance';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamationCircle } from 'react-icons/hi2';

interface LedgerRowProps {
  row: LedgerRowType;
  selected: boolean;
  onClick: () => void;
}

export default function LedgerRow({ row, selected, onClick }: LedgerRowProps) {
  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  const reconIcon = {
    MATCHED: <HiOutlineCheckCircle className="h-4 w-4 text-green-600" />,
    UNMATCHED: <HiOutlineXCircle className="h-4 w-4 text-red-600" />,
    PARTIAL: <HiOutlineExclamationCircle className="h-4 w-4 text-yellow-600" />
  };

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''}`}
    >
      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(row.date)}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.invoiceId}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{row.source}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{row.customer.name}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(row.gross)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(row.tax)}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(row.net)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{row.paymentMethod}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          row.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
          row.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {row.paymentStatus}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {reconIcon[row.reconStatus]}
          <span className="text-xs text-gray-600">{row.reconStatus}</span>
        </div>
      </td>
    </tr>
  );
}

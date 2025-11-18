'use client';

import React from 'react';
import { Expense } from '@/types/expenses';

interface ExpenseRowProps {
  expense: Expense;
  selected: boolean;
  onClick: () => void;
}

export default function ExpenseRow({ expense, selected, onClick }: ExpenseRowProps) {
  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    DISPUTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-600'
  };

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''}`}
    >
      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(expense.invoiceDate)}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{expense.invoiceNumber}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{expense.vendorName}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{expense.category}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(expense.grossAmount)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(expense.gstAmount)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(expense.tdsAmount)}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(expense.netAmount)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(expense.dueDate)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[expense.status]}`}>
          {expense.status.replace('_', ' ')}
        </span>
      </td>
    </tr>
  );
}

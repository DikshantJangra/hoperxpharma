'use client';

import React from 'react';
import { Expense } from '@/types/expenses';
import ExpenseRow from './ExpenseRow';

interface ExpenseLedgerTableProps {
  expenses: Expense[];
  selectedId?: string;
  onRowClick: (expense: Expense) => void;
}

export default function ExpenseLedgerTable({ expenses, selectedId, onRowClick }: ExpenseLedgerTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No expenses found for the selected filters.</p>
        <p className="text-sm text-gray-400 mt-1">Try a wider date range or upload a bill.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TDS</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map(expense => (
              <ExpenseRow
                key={expense.expenseId}
                expense={expense}
                selected={expense.expenseId === selectedId}
                onClick={() => onRowClick(expense)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

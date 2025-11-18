'use client';

import React from 'react';
import { ExpenseSummary } from '@/types/expenses';
import { HiOutlineCurrencyRupee, HiOutlineExclamationCircle, HiOutlineClock, HiOutlineDocumentCheck } from 'react-icons/hi2';

interface ExpensesHeaderKPIsProps {
  summary: ExpenseSummary;
  dateRange: { from: string; to: string };
  onDateChange: (from: string, to: string) => void;
  onKPIClick: (filter: string) => void;
}

export default function ExpensesHeaderKPIs({ summary, dateRange, onDateChange, onKPIClick }: ExpensesHeaderKPIsProps) {
  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => onDateChange(e.target.value, dateRange.to)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => onDateChange(dateRange.from, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => onKPIClick('spend')}
          className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineCurrencyRupee className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Spend (Period)</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalSpend)}</div>
        </button>

        <button
          onClick={() => onKPIClick('outstanding')}
          className="bg-yellow-50 p-4 rounded-lg hover:bg-yellow-100 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineClock className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-gray-600">Outstanding</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.outstanding)}</div>
        </button>

        <button
          onClick={() => onKPIClick('overdue')}
          className="bg-red-50 p-4 rounded-lg hover:bg-red-100 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineExclamationCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-600">Overdue</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.overdue)}</div>
        </button>

        <button
          onClick={() => onKPIClick('pending')}
          className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineDocumentCheck className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600">Pending Approval</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.pendingApproval)}</div>
        </button>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { SalesSummary } from '@/types/finance';
import { HiOutlineCurrencyRupee, HiOutlineBanknotes, HiOutlineCreditCard, HiOutlineReceiptRefund } from 'react-icons/hi2';

interface SalesHeaderKPIsProps {
  summary: SalesSummary;
  dateRange: { from: string; to: string };
  onDateChange: (from: string, to: string) => void;
  onKPIClick: (filter: string) => void;
}

export default function SalesHeaderKPIs({ summary, dateRange, onDateChange, onKPIClick }: SalesHeaderKPIsProps) {
  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Sales</h1>
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

      <div className="grid grid-cols-6 gap-4">
        <button
          onClick={() => onKPIClick('revenue')}
          className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineCurrencyRupee className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Revenue (Period)</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.revenue)}</div>
        </button>

        <button
          onClick={() => onKPIClick('cash')}
          className="bg-green-50 p-4 rounded-lg hover:bg-green-100 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineBanknotes className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Cash</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.cash)}</div>
        </button>

        <button
          onClick={() => onKPIClick('card')}
          className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineCreditCard className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600">Card/UPI</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.card + summary.upi)}</div>
        </button>

        <button
          onClick={() => onKPIClick('outstanding')}
          className="bg-yellow-50 p-4 rounded-lg hover:bg-yellow-100 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineCurrencyRupee className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-gray-600">Outstanding</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.outstanding)}</div>
        </button>

        <button
          onClick={() => onKPIClick('refunds')}
          className="bg-red-50 p-4 rounded-lg hover:bg-red-100 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineReceiptRefund className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-600">Refunds</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.refunds.amount)}</div>
          <div className="text-xs text-gray-500">{summary.refunds.count} txns</div>
        </button>

        <button
          onClick={() => onKPIClick('recon')}
          className="bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Recon %</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{summary.reconRate.toFixed(1)}%</div>
        </button>
      </div>
    </div>
  );
}

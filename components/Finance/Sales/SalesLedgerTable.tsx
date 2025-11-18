'use client';

import React from 'react';
import { LedgerRow as LedgerRowType } from '@/types/finance';
import LedgerRow from './LedgerRow';

interface SalesLedgerTableProps {
  rows: LedgerRowType[];
  selectedId?: string;
  onRowClick: (row: LedgerRowType) => void;
}

export default function SalesLedgerTable({ rows, selectedId, onRowClick }: SalesLedgerTableProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No sales found for the selected filters.</p>
        <p className="text-sm text-gray-400 mt-1">Try a wider date range.</p>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recon</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map(row => (
              <LedgerRow
                key={row.id}
                row={row}
                selected={row.id === selectedId}
                onClick={() => onRowClick(row)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

export default function FilterBar({ filters, onFilterChange }: any) {
  const handleFilterChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const setDateRange = (range: 'today' | 'week' | 'month') => {
    const now = new Date();
    let startDate = new Date();

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    onFilterChange({ ...filters, startDate: startDate.toISOString(), endDate: now.toISOString() });
  };

  const clearFilters = () => {
    onFilterChange({
      paymentMethod: 'all',
      invoiceType: 'all',
      paymentStatus: 'all',
      hasPrescription: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  return (
    <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-[#64748b] mb-1 block">Payment Method</label>
          <select
            value={filters.paymentMethod || 'all'}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
          >
            <option value="all">All</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="credit">Pay Later</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-[#64748b] mb-1 block">Invoice Type</label>
          <select
            value={filters.invoiceType || 'all'}
            onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
          >
            <option value="all">All</option>
            <option value="regular">Regular</option>
            <option value="gst">GST</option>
            <option value="credit">Credit Note</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-[#64748b] mb-1 block">Payment Status</label>
          <select
            value={filters.paymentStatus || 'all'}
            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Pending</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-[#64748b] mb-1 block">Sale Type</label>
          <select
            value={filters.hasPrescription !== undefined ? (filters.hasPrescription ? 'prescription' : 'otc') : 'all'}
            onChange={(e) => {
              const val = e.target.value;
              handleFilterChange('hasPrescription', val === 'all' ? undefined : val === 'prescription');
            }}
            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
          >
            <option value="all">All</option>
            <option value="otc">OTC</option>
            <option value="prescription">Prescription-linked</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setDateRange('today')}
          className="px-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-full hover:bg-[#f8fafc]"
        >
          Today
        </button>
        <button
          onClick={() => setDateRange('week')}
          className="px-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-full hover:bg-[#f8fafc]"
        >
          This Week
        </button>
        <button
          onClick={() => setDateRange('month')}
          className="px-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-full hover:bg-[#f8fafc]"
        >
          This Month
        </button>
        <button
          onClick={clearFilters}
          className="px-3 py-1.5 text-xs text-[#ef4444] hover:underline ml-auto"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}

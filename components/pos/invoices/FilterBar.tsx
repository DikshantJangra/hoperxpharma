'use client';

import { useState } from 'react';

export default function FilterBar() {
  const [filters, setFilters] = useState({
    paymentMethod: 'all',
    invoiceType: 'all',
    status: 'all',
    saleType: 'all',
  });

  return (
    <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-[#64748b] mb-1 block">Payment Method</label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
          >
            <option value="all">All</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="wallet">Wallet</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-[#64748b] mb-1 block">Invoice Type</label>
          <select
            value={filters.invoiceType}
            onChange={(e) => setFilters({ ...filters, invoiceType: e.target.value })}
            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
          >
            <option value="all">All</option>
            <option value="regular">Regular</option>
            <option value="gst">GST</option>
            <option value="einvoice">E-Invoice</option>
            <option value="credit">Credit Note</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-[#64748b] mb-1 block">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partially Paid</option>
            <option value="returned">Returned</option>
            <option value="void">Void</option>
            <option value="pending">Pending Sync</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-[#64748b] mb-1 block">Sale Type</label>
          <select
            value={filters.saleType}
            onChange={(e) => setFilters({ ...filters, saleType: e.target.value })}
            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
          >
            <option value="all">All</option>
            <option value="otc">OTC</option>
            <option value="prescription">Prescription-linked</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="px-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-full hover:bg-[#f8fafc]">
          Today
        </button>
        <button className="px-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-full hover:bg-[#f8fafc]">
          This Week
        </button>
        <button className="px-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-full hover:bg-[#f8fafc]">
          This Month
        </button>
        <button className="px-3 py-1.5 text-xs text-[#ef4444] hover:underline ml-auto">
          Clear Filters
        </button>
      </div>
    </div>
  );
}

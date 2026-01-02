'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiCalendar } from 'react-icons/fi';
import InvoiceTable from '@/components/pos/invoices/InvoiceTable';
import InvoiceDrawer from '@/components/pos/invoices/InvoiceDrawer';
import FilterBar from '@/components/pos/invoices/FilterBar';

export default function InvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    paymentMethod: 'all',
    invoiceType: 'all',
    paymentStatus: 'all',
    hasPrescription: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#0f172a]">
            Invoices
            {totalCount > 0 && (
              <span className="ml-2 text-lg font-normal text-[#64748b]">({totalCount})</span>
            )}
          </h1>
          <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2" disabled={isLoading}>
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, customer, phone, SKU, batch..."
              className="w-full pl-10 pr-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 border rounded-lg flex items-center gap-2 ${showFilters ? 'bg-[#f0fdfa] border-[#0ea5a3] text-[#0ea5a3]' : 'border-[#cbd5e1] hover:bg-[#f8fafc]'
              }`}
            disabled={isLoading}
          >
            <FiFilter className="w-4 h-4" />
            Filters
          </button>

          <button className="px-4 py-2.5 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2" disabled={isLoading}>
            <FiCalendar className="w-4 h-4" />
            Today
          </button>
        </div>

        {showFilters && <FilterBar filters={filters} onFilterChange={setFilters} />}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden" data-tour="pos-invoices-tab">
        <div className={`${selectedInvoice ? 'w-[60%]' : 'w-full'} transition-all`}>
          <InvoiceTable
            searchQuery={searchQuery}
            onSelectInvoice={setSelectedInvoice}
            selectedInvoice={selectedInvoice}
            isLoading={isLoading}
            filters={filters}
            onTotalChange={setTotalCount}
          />
        </div>

        {selectedInvoice && (
          <div data-tour="invoice-actions">
            <InvoiceDrawer
              invoice={selectedInvoice}
              onClose={() => setSelectedInvoice(null)}
              isLoading={isLoading && !selectedInvoice}
            />
          </div>
        )}
      </div>
    </div>
  );
}

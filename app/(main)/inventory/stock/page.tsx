'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiRefreshCw, FiUpload } from 'react-icons/fi';
import StockFilters from '@/components/inventory/StockFilters';
import StockTable from '@/components/inventory/StockTable';
import StockDetailPanel from '@/components/inventory/StockDetailPanel';

const StatCard = ({ label, value, loading, colorClass = 'bg-[#f1f5f9]' }: any) => (
    <div className={`px-3 py-1.5 rounded-lg text-sm ${colorClass}`}>
        <span className="text-[#64748b]">{label}:</span>{' '}
        {loading ? (
            <span className="inline-block h-4 w-12 bg-gray-300 rounded-md animate-pulse"></span>
        ) : (
            <span className="font-semibold text-[#0f172a]">{value}</span>
        )}
    </div>
)

export default function StockPage() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSearchFocus(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setIsStatsLoading(true);
    const timer = setTimeout(() => {
        setStats({
            totalSKUs: 0,
            onHand: 0,
            lowStock: 0,
            expiring: 0,
        });
        setIsStatsLoading(false);
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Stock</h1>
            <p className="text-sm text-[#64748b]">Inventory › Stock</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm">
              <FiRefreshCw className="w-4 h-4" />
              Sync
            </button>
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm">
              <FiUpload className="w-4 h-4" />
              Import
            </button>
            <button className="px-3 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm">
              <FiPlus className="w-4 h-4" />
              New SKU
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder="Search by name, barcode, batch (#) or HSN — press / to focus"
              className="w-full pl-10 pr-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
            <StatCard label="Total SKUs" value={stats?.totalSKUs} loading={isStatsLoading}/>
            <StatCard label="On-hand" value={stats?.onHand} loading={isStatsLoading}/>
            <StatCard label="Low stock" value={stats?.lowStock} loading={isStatsLoading} colorClass="bg-[#fef3c7]"/>
            <StatCard label="Expiring <30d" value={stats?.expiring} loading={isStatsLoading} colorClass="bg-[#fee2e2]"/>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <StockFilters />
        
        <div className={`${selectedItem ? 'w-[45%]' : 'flex-1'} transition-all`}>
          <StockTable
            searchQuery={searchQuery}
            onSelectItem={setSelectedItem}
            selectedItem={selectedItem}
          />
        </div>

        {selectedItem && (
          <StockDetailPanel
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiUpload, FiDownload } from 'react-icons/fi';
import { BsQrCodeScan } from 'react-icons/bs';
import BatchFilters from '@/components/inventory/batches/BatchFilters';
import BatchTable from '@/components/inventory/batches/BatchTable';
import BatchDetailDrawer from '@/components/inventory/batches/BatchDetailDrawer';

export default function BatchesPage() {
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const { inventoryApi } = await import('@/lib/api/inventory');
      const response = await inventoryApi.getBatches({
        page: 1,
        limit: 100,
        search: searchQuery,
      });

      console.log('📦 Batches API Response:', response);

      // Handle both response formats
      const batchesData = Array.isArray(response) ? response : (response.data || []);
      console.log('📦 Batches Data:', batchesData);
      console.log('📦 Number of batches:', batchesData.length);

      setBatches(batchesData);

      // Calculate stats
      const total = batchesData.length;
      const onHand = batchesData.reduce((sum: number, b: any) => sum + (b.quantityInStock || 0), 0);
      const expiringSoon = batchesData.filter((b: any) => {
        const daysToExpiry = Math.floor((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysToExpiry < 7 && daysToExpiry > 0;
      }).length;

      setStats({
        total,
        onHand,
        expiringSoon,
        quarantined: 0,
        recalled: 0,
      });

      console.log('📊 Stats:', { total, onHand, expiringSoon });
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      setBatches([]);
      setStats({ total: 0, onHand: 0, expiringSoon: 0, quarantined: 0, recalled: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchBatches, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchBatches, 30000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById('batch-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Batches</h1>
            <p className="text-sm text-[#64748b]">Inventory › Batches</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchBatches} className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm" disabled={isLoading}>
              <FiDownload className="w-4 h-4" />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm" disabled={isLoading}>
              <BsQrCodeScan className="w-4 h-4" />
              Scan
            </button>
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm" disabled={isLoading}>
              <FiUpload className="w-4 h-4" />
              Import
            </button>
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm" disabled={isLoading}>
              <FiDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
            <input
              id="batch-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search batch# / drug name / barcode — press /"
              className="w-full pl-10 pr-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-[#f1f5f9] rounded-lg text-sm">
            <span className="text-[#64748b]">Total batches:</span>{' '}
            <span className="font-semibold text-[#0f172a]">{isLoading ? '...' : stats?.total || 0}</span>
          </div>
          <div className="px-3 py-1.5 bg-[#f1f5f9] rounded-lg text-sm">
            <span className="text-[#64748b]">On-hand:</span>{' '}
            <span className="font-semibold text-[#0f172a]">{isLoading ? '...' : stats?.onHand || 0}</span>
          </div>
          <div className="px-3 py-1.5 bg-[#fee2e2] rounded-lg text-sm">
            <span className="text-[#991b1b]">Expiring &lt;7d:</span>{' '}
            <span className="font-semibold text-[#991b1b]">{isLoading ? '...' : stats?.expiringSoon || 0}</span>
          </div>
          <div className="px-3 py-1.5 bg-[#fef3c7] rounded-lg text-sm">
            <span className="text-[#92400e]">Quarantined:</span>{' '}
            <span className="font-semibold text-[#92400e]">{isLoading ? '...' : stats?.quarantined || 0}</span>
          </div>
          <div className="px-3 py-1.5 bg-[#fee2e2] rounded-lg text-sm">
            <span className="text-[#991b1b]">Recalled:</span>{' '}
            <span className="font-semibold text-[#991b1b]">{isLoading ? '...' : stats?.recalled || 0}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <BatchFilters />

        <div className={`${selectedBatch ? 'w-[50%]' : 'flex-1'} transition-all`}>
          <BatchTable
            batches={batches}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSelectBatch={setSelectedBatch}
            selectedBatch={selectedBatch}
            onRefresh={fetchBatches}
          />
        </div>

        {selectedBatch && (
          <BatchDetailDrawer
            batch={selectedBatch}
            onClose={() => setSelectedBatch(null)}
          />
        )}
      </div>
    </div>
  );
}

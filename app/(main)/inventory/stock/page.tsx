'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiRefreshCw, FiUpload } from 'react-icons/fi';
import StockFilters from '@/components/inventory/StockFilters';
import StockTable from '@/components/inventory/StockTable';
import StockDetailPanel from '@/components/inventory/StockDetailPanel';
import AddDrugModal from '@/components/inventory/AddDrugModal';

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddDrug, setShowAddDrug] = useState(false);

  // Filter states
  const [stockStatusFilters, setStockStatusFilters] = useState<string[]>([]);
  const [expiryFilters, setExpiryFilters] = useState<string[]>([]);
  const [storageFilters, setStorageFilters] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ field: string, order: 'asc' | 'desc' } | null>(null);

  // Saved view configurations
  const savedViews = {
    '1': { stockStatus: ['low_stock'], expiry: [], storage: [] },
    '2': { stockStatus: [], expiry: ['<30days'], storage: [] },
    '3': { stockStatus: [], expiry: [], storage: ['cold_chain'] },
    '4': { stockStatus: [], expiry: [], storage: ['controlled'] },
  };

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
    const fetchStats = async () => {
      setIsStatsLoading(true);
      try {
        const { inventoryApi } = await import('@/lib/api/inventory');
        const [summaryResponse, lowStockResponse, expiringResponse] = await Promise.all([
          inventoryApi.getSummary(),
          inventoryApi.getLowStockAlerts(),
          inventoryApi.getExpiringItems(),
        ]);

        if (summaryResponse.success) {
          const summary = summaryResponse.data;
          setStats({
            totalSKUs: summary.uniqueDrugs || 0,
            onHand: summary.totalUnits || 0,
            lowStock: lowStockResponse.success ? lowStockResponse.data.length : 0,
            expiring: expiringResponse.success ? expiringResponse.data.length : 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch inventory stats:', error);
        setStats({
          totalSKUs: 0,
          onHand: 0,
          lowStock: 0,
          expiring: 0,
        });
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchStats();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleFilterChange = (type: 'stockStatus' | 'expiry' | 'storage', values: string[]) => {
    if (type === 'stockStatus') setStockStatusFilters(values);
    if (type === 'expiry') setExpiryFilters(values);
    if (type === 'storage') setStorageFilters(values);
    setActiveView(null); // Clear active view when manually changing filters
  };

  const handleViewChange = (viewId: string | null) => {
    setActiveView(viewId);
    if (viewId && savedViews[viewId as keyof typeof savedViews]) {
      const view = savedViews[viewId as keyof typeof savedViews];
      setStockStatusFilters(view.stockStatus);
      setExpiryFilters(view.expiry);
      setStorageFilters(view.storage);
    }
  };

  const handleResetFilters = () => {
    setStockStatusFilters([]);
    setExpiryFilters([]);
    setStorageFilters([]);
    setActiveView(null);
    setSortConfig(null);
  };

  const handleItemUpdate = async () => {
    // 1. Refresh list
    setRefreshKey(prev => prev + 1);

    // 2. Refresh selected item details
    if (selectedItem) {
      try {
        const { inventoryApi } = await import('@/lib/api/inventory');
        const response = await inventoryApi.getDrugById(selectedItem.id);
        if (response.success && response.data) {
          setSelectedItem(response.data);
        }
      } catch (error) {
        console.error('Failed to refresh item details:', error);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] p-4">
        {/* ... (header content remains same) ... */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Stock</h1>
            <p className="text-sm text-[#64748b]">Inventory › Stock</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm"
            >
              <FiRefreshCw className="w-4 h-4" />
              Sync
            </button>
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm">
              <FiUpload className="w-4 h-4" />
              Import
            </button>
            <button onClick={() => setShowAddDrug(true)} className="px-3 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm" data-tour="new-sku-button">
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
          <StatCard label="Total SKUs" value={stats?.totalSKUs} loading={isStatsLoading} />
          <StatCard label="On-hand" value={stats?.onHand} loading={isStatsLoading} />
          <StatCard label="Low stock" value={stats?.lowStock} loading={isStatsLoading} colorClass="bg-[#fef3c7]" />
          <StatCard label="Expiring <30d" value={stats?.expiring} loading={isStatsLoading} colorClass="bg-[#fee2e2]" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <StockFilters
          stockStatusFilters={stockStatusFilters}
          expiryFilters={expiryFilters}
          storageFilters={storageFilters}
          activeView={activeView}
          onFilterChange={handleFilterChange}
          onViewChange={handleViewChange}
          onReset={handleResetFilters}
        />

        <div className={`${selectedItem ? 'w-[45%]' : 'flex-1'} transition-all`} data-tour="inventory-table">
          <StockTable
            searchQuery={searchQuery}
            onSelectItem={setSelectedItem}
            selectedItem={selectedItem}
            refreshKey={refreshKey}
            stockStatusFilters={stockStatusFilters}
            expiryFilters={expiryFilters}
            storageFilters={storageFilters}
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
          />
        </div>

        {selectedItem && (
          <StockDetailPanel
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onUpdate={handleItemUpdate}
          />
        )}
      </div>

      {/* Add Drug Modal */}
      <AddDrugModal
        isOpen={showAddDrug}
        onClose={() => setShowAddDrug(false)}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
          setShowAddDrug(false);
        }}
      />
    </div>
  );
}

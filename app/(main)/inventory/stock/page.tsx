'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiRefreshCw, FiUpload, FiTool, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import StockFilters from '@/components/inventory/StockFilters';
import StockTable from '@/components/inventory/StockTable';
import StockDetailPanel from '@/components/inventory/StockDetailPanel';
import AddDrugModal from '@/components/inventory/AddDrugModal';
import IngestModal from '@/components/inventory/IngestModal';
import Link from 'next/link';

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
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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
          inventoryApi.getExpiringItems()
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

        // Fetch pending count separately to avoid type error
        try {
          const pendingResponse = await inventoryApi.getDrugs({ search: '', limit: 100 });
          if (pendingResponse.success && Array.isArray(pendingResponse.data)) {
            const pending = pendingResponse.data.filter((d: any) => d.ingestionStatus === 'SALT_PENDING').length;
            setPendingCount(pending);
          }
        } catch {
          setPendingCount(0);
        }
      } catch (error) {
        console.error('Failed to fetch inventory stats:', error);
        setStats({
          totalSKUs: 0,
          onHand: 0,
          lowStock: 0,
          expiring: 0,
        });
        setPendingCount(0);
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
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Inventory Overview</h1>
            <p className="text-sm text-[#64748b]">Manage your pharmacy inventory and stock levels</p>
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
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 mb-4">
          <StatCard label="Total SKUs" value={stats?.totalSKUs} loading={isStatsLoading} />
          <StatCard label="On-hand" value={stats?.onHand} loading={isStatsLoading} />
          <StatCard label="Low stock" value={stats?.lowStock} loading={isStatsLoading} colorClass="bg-[#fef3c7]" />
          <StatCard label="Expiring <30d" value={stats?.expiring} loading={isStatsLoading} colorClass="bg-[#fee2e2]" />
        </div>

        {/* Primary Action - Add Medicine */}
        <button
          onClick={() => setShowIngestModal(true)}
          className="w-full p-4 bg-gradient-to-br from-[#0ea5a3] to-[#0d9491] text-white rounded-xl hover:shadow-lg transition-all mb-4 group text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all">
                <FiPlus size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Add New Medicine</h3>
                <p className="text-sm text-white text-opacity-90">
                  Scan strip or enter details manually
                </p>
              </div>
            </div>
            <div className="text-white text-opacity-75 group-hover:text-opacity-100 group-hover:translate-x-1 transition-all">
              →
            </div>
          </div>
        </button>

        {/* Search */}
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

      {/* Quick Actions - Secondary Features */}
      <div className="bg-white border-b border-[#e2e8f0] px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Stock Adjustment */}
          <Link
            href="/inventory/adjust"
            className="p-3 bg-white border border-[#e2e8f0] rounded-lg hover:shadow-md hover:border-[#0ea5a3] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <FiTool className="text-blue-600" size={18} />
              </div>
              <div>
                <h3 className="font-medium text-sm text-[#0f172a]">Adjust Stock</h3>
                <p className="text-xs text-[#64748b]">Manual corrections</p>
              </div>
            </div>
          </Link>

          {/* Maintenance - Conditional Display */}
          {pendingCount > 0 ? (
            <Link
              href="/inventory/maintenance"
              className="p-3 bg-orange-50 border-2 border-orange-200 rounded-lg hover:shadow-md hover:border-orange-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <FiAlertCircle className="text-orange-600" size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-orange-900">Fix {pendingCount} Pending</h3>
                  <p className="text-xs text-orange-600">Need salt mapping</p>
                </div>
              </div>
            </Link>
          ) : (
            <Link
              href="/inventory/maintenance"
              className="p-3 bg-white border border-[#e2e8f0] rounded-lg hover:shadow-md hover:border-[#0ea5a3] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <FiAlertCircle className="text-green-600" size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-[#0f172a]">Maintenance</h3>
                  <p className="text-xs text-[#64748b]">All items verified</p>
                </div>
              </div>
            </Link>
          )}

          {/* Demand Forecast */}
          <Link
            href="/inventory/forecast"
            className="p-3 bg-white border border-[#e2e8f0] rounded-lg hover:shadow-md hover:border-[#0ea5a3] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <FiTrendingUp className="text-purple-600" size={18} />
              </div>
              <div>
                <h3 className="font-medium text-sm text-[#0f172a]">Forecast</h3>
                <p className="text-xs text-[#64748b]">Demand planning</p>
              </div>
            </div>
          </Link>
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

      {/* Ingest Modal */}
      <IngestModal
        isOpen={showIngestModal}
        onClose={() => setShowIngestModal(false)}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
          setShowIngestModal(false);
        }}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight, FiAlertCircle, FiPackage } from 'react-icons/fi';
import { BsSnow } from 'react-icons/bs';
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';

const TableRowSkeleton = () => (
  <tr className="border-b border-[#f1f5f9] animate-pulse">
    <td className="px-4 py-3"><div className="h-5 w-5 bg-gray-200 rounded"></div></td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-2">
        <div>
          <div className="h-5 bg-gray-200 rounded-md w-48 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded-md w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded-md w-24"></div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="px-4 py-3 text-center"><div className="h-6 w-8 bg-gray-200 rounded mx-auto"></div></td>
    <td className="px-4 py-3 text-right"><div className="h-5 bg-gray-200 rounded w-10 ml-auto"></div></td>
    <td className="px-4 py-3 text-right"><div className="h-5 bg-gray-200 rounded w-10 ml-auto"></div></td>
    <td className="px-4 py-3 text-right"><div className="h-5 bg-gray-200 rounded w-10 ml-auto"></div></td>
    <td className="px-4 py-3 text-center"><div className="h-6 w-8 bg-gray-200 rounded mx-auto"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
  </tr>
)

export default function StockTable({
  searchQuery,
  onSelectItem,
  selectedItem,
  refreshKey,
  stockStatusFilters,
  expiryFilters,
  storageFilters,
  sortConfig,
  onSortChange
}: any) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [drugs, setDrugs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { isPremium } = usePremiumTheme();

  useEffect(() => {
    const fetchDrugs = async () => {
      setIsLoading(true);
      try {
        const { inventoryApi } = await import('@/lib/api/inventory');
        const response = await inventoryApi.getDrugs({
          page,
          limit: 50,
          search: searchQuery,
          stockStatus: stockStatusFilters,
          expiryWindow: expiryFilters,
          storage: storageFilters,
          sortBy: sortConfig?.field,
          sortOrder: sortConfig?.order
        });

        console.log('📦 Drugs API Response:', response);

        // Safely handle response - check if response exists first
        if (!response) {
          console.warn('API returned undefined response');
          setDrugs([]);
          setTotal(0);
          return;
        }

        // Handle both response formats (array or object with data property)
        const drugsData = Array.isArray(response)
          ? response
          : (response?.data || []);

        const totalCount = response?.pagination?.total
          || (Array.isArray(response) ? response.length : (response?.total || 0));

        console.log('📦 Drugs Data:', drugsData);
        console.log('📦 Number of drugs:', drugsData.length);

        setDrugs(drugsData);
        setTotal(totalCount);
      } catch (error) {
        console.error('Failed to fetch drugs:', error);
        setDrugs([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchDrugs, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery, page, refreshKey, stockStatusFilters, expiryFilters, storageFilters, sortConfig]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <table className="w-full">
        <thead className={`sticky top-0 z-10 ${isPremium ? 'bg-white/80 backdrop-blur-md border-b border-emerald-500/10 shadow-sm' : 'bg-[#f8fafc] border-b border-[#e2e8f0]'}`}>
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase w-8"></th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Drug / Item</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">HSN</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Batches</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Stock</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">GST %</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Reorder</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Manufacturer</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <>
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </>
          ) : drugs.length > 0 ? (
            drugs.map((drug) => {
              const totalStock = drug.inventory?.reduce((sum: number, batch: any) => sum + batch.quantityInStock, 0) || 0;
              const batchCount = drug.inventory?.length || 0;
              const lowStock = totalStock <= (drug.lowStockThreshold || 10);

              return (
                <React.Fragment key={drug.id}>
                  <tr
                    onClick={() => onSelectItem(drug)}
                    className={`border-b border-[#f1f5f9] cursor-pointer group transition-all duration-200
                        ${selectedItem?.id === drug.id
                        ? isPremium ? 'bg-emerald-50/80' : 'bg-[#f0fdfa]'
                        : isPremium ? 'hover:bg-white hover:shadow-lg hover:scale-[1.002] hover:-translate-y-0.5 hover:shadow-emerald-900/5' : 'hover:bg-[#f8fafc]'
                      } 
                        ${lowStock ? 'border-l-4 border-l-[#f59e0b]' : ''}`}
                  >
                    <td className="px-4 py-3">
                      {batchCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(drug.id);
                          }}
                          className="p-1 hover:bg-[#f1f5f9] rounded"
                        >
                          {expandedRows.has(drug.id) ? (
                            <FiChevronDown className="w-4 h-4 text-[#64748b]" />
                          ) : (
                            <FiChevronRight className="w-4 h-4 text-[#64748b]" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-[#0f172a] flex items-center gap-2">
                            {drug.name}
                            {drug.requiresColdStorage && <BsSnow className="w-3 h-3 text-[#3b82f6]" title="Cold chain" />}
                          </div>
                          <div className="text-xs text-[#64748b]">{drug.strength} • {drug.form}</div>
                          <div className="text-xs text-[#94a3b8]">Generic: {drug.genericName || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{drug.hsnCode || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-[#f1f5f9] text-[#64748b] text-xs rounded">{batchCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">{totalStock}</td>
                    <td className="px-4 py-3 text-right text-[#64748b]">{drug.gstRate}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={lowStock ? 'text-[#ef4444] font-semibold' : 'text-[#64748b]'}>
                        {drug.lowStockThreshold || 10}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {lowStock ? (
                        <span className="px-2 py-1 bg-[#fee2e2] text-[#991b1b] text-xs rounded flex items-center gap-1 justify-center">
                          <FiAlertCircle className="w-3 h-3" />
                          Low
                        </span>
                      ) : (
                        <span className="text-[#10b981]">✓</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{drug.manufacturer || '-'}</td>
                  </tr>

                  {/* Expanded Batch Rows */}
                  {expandedRows.has(drug.id) && drug.inventory?.map((batch: any) => {
                    const daysToExpiry = Math.floor((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <tr key={batch.id} className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 pl-12" colSpan={2}>
                          <div className="flex items-center gap-2">
                            <FiPackage className="w-3 h-3 text-[#64748b]" />
                            <span className="text-sm font-medium text-[#0f172a]">{batch.batchNumber}</span>
                            <span className="text-xs text-[#64748b]">• Rack: {batch.rackLocation || 'N/A'}</span>
                            {daysToExpiry < 30 && daysToExpiry > 0 && (
                              <span className="px-2 py-0.5 bg-[#fee2e2] text-[#991b1b] text-xs rounded">
                                Expires in {daysToExpiry}d
                              </span>
                            )}
                            {daysToExpiry <= 0 && (
                              <span className="px-2 py-0.5 bg-[#991b1b] text-white text-xs rounded">
                                Expired
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-[#64748b]">{batch.quantityInStock}</td>
                        <td className="px-4 py-2 text-right text-sm text-[#64748b]">₹{Number(batch.purchasePrice).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-sm text-[#64748b]">₹{Number(batch.mrp).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-[#64748b]">{new Date(batch.expiryDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2"></td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan={9}>
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FiPackage className="w-12 h-12 text-[#cbd5e1] mb-3" />
                  <p className="text-[#64748b] font-medium">No drugs found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery ? "Try adjusting your search." : "Add drugs to your inventory to get started."}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {!isLoading && drugs.length > 0 && (
        <div className="p-4 border-t border-[#e2e8f0] bg-white flex items-center justify-between text-sm text-[#64748b]">
          <div>Showing {drugs.length} of {total} drugs</div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-[#cbd5e1] rounded hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={drugs.length < 50}
              className="px-3 py-1 border border-[#cbd5e1] rounded hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

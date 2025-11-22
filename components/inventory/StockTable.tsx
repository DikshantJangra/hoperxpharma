'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight, FiAlertCircle, FiPackage } from 'react-icons/fi';
import { BsSnow } from 'react-icons/bs';

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

export default function StockTable({ searchQuery, onSelectItem, selectedItem }: any) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [stock, setStock] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setStock([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer)
  }, []);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredStock = stock.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.hsn.includes(searchQuery)
  );

  return (
    <div className="h-full overflow-y-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0] z-10">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase w-8"></th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">SKU / Item</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">HSN</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Batches</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">On-hand</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Available</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Reorder</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Expiring</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Supplier</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
              <>
                <TableRowSkeleton/>
                <TableRowSkeleton/>
                <TableRowSkeleton/>
                <TableRowSkeleton/>
                <TableRowSkeleton/>
              </>
          ) : filteredStock.length > 0 ? (
            filteredStock.map((item) => (
                <React.Fragment key={item.id}>
                <tr
                    onClick={() => onSelectItem(item)}
                    className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer group ${selectedItem?.id === item.id ? 'bg-[#f0fdfa]' : ''
                    } ${item.lowStock ? 'border-l-4 border-l-[#f59e0b]' : ''} ${item.expiringCount > 0 ? 'border-l-4 border-l-[#ef4444]' : ''
                    }`}
                >
                    <td className="px-4 py-3">
                    <button
                        onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(item.id);
                        }}
                        className="p-1 hover:bg-[#f1f5f9] rounded"
                    >
                        {expandedRows.has(item.id) ? (
                        <FiChevronDown className="w-4 h-4 text-[#64748b]" />
                        ) : (
                        <FiChevronRight className="w-4 h-4 text-[#64748b]" />
                        )}
                    </button>
                    </td>
                    <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div>
                        <div className="font-medium text-[#0f172a] flex items-center gap-2">
                            {item.name}
                            {item.coldChain && <BsSnow className="w-3 h-3 text-[#3b82f6]" title="Cold chain" />}
                        </div>
                        <div className="text-xs text-[#64748b]">{item.generic} • {item.pack}</div>
                        <div className="text-xs text-[#94a3b8]">SKU: {item.sku}</div>
                        </div>
                    </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{item.hsn}</td>
                    <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-[#f1f5f9] text-[#64748b] text-xs rounded">{item.batchCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">{item.onHand}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">{item.available}</td>
                    <td className="px-4 py-3 text-right">
                    <span className={item.available < item.reorderPoint ? 'text-[#ef4444] font-semibold' : 'text-[#64748b]'}>
                        {item.reorderPoint}
                    </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                    {item.expiringCount > 0 ? (
                        <span className="px-2 py-1 bg-[#fee2e2] text-[#991b1b] text-xs rounded flex items-center gap-1 justify-center">
                        <FiAlertCircle className="w-3 h-3" />
                        {item.expiringCount}
                        </span>
                    ) : (
                        <span className="text-[#94a3b8]">—</span>
                    )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{item.supplier}</td>
                </tr>

                {/* Expanded Batch Rows */}
                {expandedRows.has(item.id) && item.batches.map((batch: any) => (
                    <tr key={batch.id} className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2 pl-12" colSpan={2}>
                        <div className="flex items-center gap-2">
                        <FiPackage className="w-3 h-3 text-[#64748b]" />
                        <span className="text-sm font-medium text-[#0f172a]">{batch.id}</span>
                        <span className="text-xs text-[#64748b]">• Location: {batch.location}</span>
                        {batch.daysToExpiry < 30 && (
                            <span className="px-2 py-0.5 bg-[#fee2e2] text-[#991b1b] text-xs rounded">
                            Expires in {batch.daysToExpiry}d
                            </span>
                        )}
                        </div>
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-[#64748b]">{batch.qty}</td>
                    <td className="px-4 py-2 text-right text-sm text-[#64748b]">₹{batch.cost}</td>
                    <td className="px-4 py-2 text-right text-sm text-[#64748b]">₹{batch.mrp}</td>
                    <td className="px-4 py-2 text-sm text-[#64748b]">{batch.expiry}</td>
                    <td className="px-4 py-2"></td>
                    </tr>
                ))}
                </React.Fragment>
            ))
          ) : (
            <tr>
                <td colSpan={9}>
                     <div className="flex flex-col items-center justify-center h-64 text-center">
                        <FiPackage className="w-12 h-12 text-[#cbd5e1] mb-3" />
                        <p className="text-[#64748b] font-medium">No stock items found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchQuery ? "Try adjusting your search or filters." : "Add a new item to get started."}
                        </p>
                    </div>
                </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

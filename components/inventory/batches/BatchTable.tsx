'use client';

import React from 'react';
import { FiAlertCircle, FiThermometer } from 'react-icons/fi';
import { BsSnow } from 'react-icons/bs';

const BatchRowSkeleton = () => (
  <tr className="animate-pulse border-b border-[#f1f5f9]">
    <td className="px-4 py-3"><div className="w-4 h-4 bg-gray-200 rounded"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
      <div className="h-3 bg-gray-100 rounded w-24"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
      <div className="h-5 bg-gray-100 rounded w-10"></div>
    </td>
    <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-8 ml-auto"></div></td>
    <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-8 ml-auto"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-8"></div></td>
    <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
  </tr>
)

export default function BatchTable({ batches, isLoading, searchQuery, onSelectBatch, selectedBatch }: any) {
  const getExpiryColor = (days: number) => {
    if (days < 0) return 'bg-[#991b1b] text-white';
    if (days < 7) return 'bg-[#fee2e2] text-[#991b1b]';
    if (days < 30) return 'bg-[#fed7aa] text-[#9a3412]';
    if (days < 90) return 'bg-[#fef3c7] text-[#92400e]';
    return 'bg-[#f1f5f9] text-[#64748b]';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Quarantine') return 'border-[#ef4444] text-[#ef4444] bg-[#fef2f2]';
    if (status === 'Recalled') return 'border-[#dc2626] text-[#dc2626] bg-[#fee2e2]';
    if (status === 'Reserved') return 'border-[#f59e0b] text-[#f59e0b] bg-[#fef3c7]';
    return 'border-[#10b981] text-[#10b981] bg-[#d1fae5]';
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0] z-10">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase w-8">
              <input type="checkbox" className="w-4 h-4 rounded" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Batch #</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Drug / Item</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Expiry</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Stock</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">MRP</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Location</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Supplier</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <>
              <BatchRowSkeleton />
              <BatchRowSkeleton />
              <BatchRowSkeleton />
            </>
          ) : batches.length > 0 ? (
            batches.map((batch: any) => {
              const daysToExpiry = Math.floor((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const status = daysToExpiry < 0 ? 'Expired' : 'Active';

              return (
                <tr
                  key={batch.id}
                  onClick={() => onSelectBatch(batch)}
                  className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer group ${selectedBatch?.id === batch.id ? 'bg-[#f0fdfa]' : ''
                    } ${daysToExpiry < 7 && daysToExpiry >= 0 ? 'border-l-4 border-l-[#ef4444]' : ''} ${daysToExpiry < 0 ? 'border-l-4 border-l-[#991b1b]' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-[#0f172a]">{batch.batchNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-[#0f172a] flex items-center gap-2">
                          {batch.drug?.name || 'Unknown Drug'}
                          {batch.drug?.requiresColdStorage && <BsSnow className="w-3 h-3 text-[#3b82f6]" title="Cold chain" />}
                        </div>
                        <div className="text-xs text-[#64748b]">{batch.drug?.strength} • {batch.drug?.form}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm text-[#0f172a]">{new Date(batch.expiryDate).toLocaleDateString()}</div>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded mt-1 ${getExpiryColor(daysToExpiry)}`}>
                        {daysToExpiry < 0 ? 'Expired' : `${daysToExpiry}d`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">{batch.quantityInStock}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#0ea5a3]">₹{Number(batch.mrp).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-[#64748b]">{batch.location || batch.rackLocation || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#64748b]">
                    {batch.supplier?.name || (batch.supplierId ? 'Loading...' : 'N/A')}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9}>
                <div className="flex flex-col items-center justify-center h-64">
                  <FiAlertCircle className="w-12 h-12 text-[#cbd5e1] mb-3" />
                  <p className="text-[#64748b]">No batches found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery ? "Try adjusting your search." : "Batches will appear here once added."}
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

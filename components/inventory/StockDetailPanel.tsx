'use client';

import { useState } from 'react';
import { FiX, FiShoppingCart, FiEdit, FiSend, FiClock, FiPackage, FiAlertCircle } from 'react-icons/fi';
import { BsSnow, BsQrCode } from 'react-icons/bs';
import AdjustStockModal from './AdjustStockModal';

export default function StockDetailPanel({ item, onClose }: any) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  return (
    <>
      <div className="w-[35%] bg-white border-l border-[#e2e8f0] flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-[#0f172a]">{item.name}</h2>
              {item.coldChain && <BsSnow className="w-4 h-4 text-[#3b82f6]" title="Cold chain" />}
            </div>
            <p className="text-sm text-[#64748b]">{item.generic}</p>
            <p className="text-xs text-[#94a3b8] mt-1">SKU: {item.sku} • HSN: {item.hsn}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary */}
          <div className="bg-[#f8fafc] rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#64748b] mb-1">On-hand</p>
                <p className="text-2xl font-bold text-[#0f172a]">{item.onHand}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Available</p>
                <p className="text-2xl font-bold text-[#0ea5a3]">{item.available}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Reorder Point</p>
                <p className={`text-lg font-semibold ${item.available < item.reorderPoint ? 'text-[#ef4444]' : 'text-[#0f172a]'}`}>
                  {item.reorderPoint}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Avg Usage/mo</p>
                <p className="text-lg font-semibold text-[#0f172a]">{item.avgUsage}</p>
              </div>
            </div>
          </div>

          {/* AI Suggestion */}
          {item.available < item.reorderPoint && (
            <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#92400e] mb-1">Reorder Suggested</p>
                  <p className="text-xs text-[#92400e] mb-2">
                    Reorder {item.reorderPoint * 2} units • Lead time: 5 days
                  </p>
                  <button className="px-3 py-1.5 bg-[#f59e0b] text-white text-xs rounded-lg hover:bg-[#d97706]">
                    Create PO
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Supplier */}
          <div>
            <h3 className="text-sm font-semibold text-[#64748b] mb-2">Primary Supplier</h3>
            <div className="bg-white border border-[#e2e8f0] rounded-lg p-3">
              <p className="text-sm font-medium text-[#0f172a]">{item.supplier}</p>
              <p className="text-xs text-[#64748b] mt-1">Lead time: 5 days • MOQ: 100</p>
            </div>
          </div>

          {/* Batches */}
          <div>
            <h3 className="text-sm font-semibold text-[#64748b] mb-2">Batches ({item.batchCount})</h3>
            <div className="space-y-2">
              {item.batches.map((batch: any) => (
                <div key={batch.id} className="bg-white border border-[#e2e8f0] rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0f172a]">{batch.id}</span>
                        {batch.daysToExpiry < 30 && (
                          <span className="px-2 py-0.5 bg-[#fee2e2] text-[#991b1b] text-xs rounded">
                            {batch.daysToExpiry}d
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748b] mt-1">
                        Expiry: {batch.expiry} • Location: {batch.location}
                      </p>
                    </div>
                    <BsQrCode className="w-5 h-5 text-[#64748b] cursor-pointer hover:text-[#0f172a]" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748b]">Qty: {batch.qty}</span>
                    <span className="text-[#64748b]">Cost: ₹{batch.cost} • MRP: ₹{batch.mrp}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 px-2 py-1 text-xs border border-[#cbd5e1] rounded hover:bg-[#f8fafc]">
                      Pick
                    </button>
                    <button
                      onClick={() => setShowAdjustModal(true)}
                      className="flex-1 px-2 py-1 text-xs border border-[#cbd5e1] rounded hover:bg-[#f8fafc]"
                    >
                      Adjust
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-sm font-semibold text-[#64748b] mb-2">Recent Activity</h3>
            <div className="space-y-2">
              {[
                { action: 'Received 100 units', batch: 'B-2025-11', time: '2 days ago', user: 'Aman' },
                { action: 'Sold 45 units', batch: 'B-2025-01', time: '3 days ago', user: 'POS' },
                { action: 'Adjusted -5 units', batch: 'B-2024-33', time: '5 days ago', user: 'Meera' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <FiClock className="w-3 h-3 text-[#64748b] mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[#0f172a]">{activity.action}</p>
                    <p className="text-[#64748b]">{activity.batch} • {activity.time} • {activity.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[#e2e8f0] p-4 space-y-2">
          <button className="w-full py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center justify-center gap-2">
            <FiShoppingCart className="w-4 h-4" />
            Create PO
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowAdjustModal(true)}
              className="py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm"
            >
              <FiEdit className="w-4 h-4" />
              Adjust
            </button>
            <button className="py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm">
              <FiSend className="w-4 h-4" />
              Transfer
            </button>
          </div>
        </div>
      </div>

      {showAdjustModal && (
        <AdjustStockModal
          item={item}
          onClose={() => setShowAdjustModal(false)}
        />
      )}
    </>
  );
}

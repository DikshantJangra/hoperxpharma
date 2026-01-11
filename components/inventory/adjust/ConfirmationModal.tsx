'use client';

import { FiX, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { formatUnitName } from '@/lib/utils/stock-display';

export default function ConfirmationModal({ items, onConfirm, onClose }: any) {
  const totalDelta = items.reduce((sum: number, item: any) => sum + item.delta, 0);
  const hasNegative = items.some((item: any) => item.delta < 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <h3 className="text-xl font-bold text-[#0f172a]">Review & Confirm Adjustment</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#f8fafc] rounded">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {hasNegative && (
            <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-3 flex items-start gap-2">
              <FiAlertTriangle className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#92400e]">Negative Adjustment Detected</p>
                <p className="text-xs text-[#92400e] mt-1">
                  This will reduce inventory. Ensure physical verification is complete.
                </p>
              </div>
            </div>
          )}

          {items.map((item: any, index: number) => (
            <div key={index} className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-[#0f172a]">{item.name}</h4>
                  <p className="text-xs text-[#64748b] mt-0.5">Batch: {item.batchId}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${item.delta > 0 ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'
                  }`}>
                  {item.delta > 0 ? '+' : ''}{item.delta}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <p className="text-[#64748b] text-xs">Current Qty</p>
                  <p className="font-semibold text-[#0f172a]">{item.currentQty} <span className="text-[10px] text-gray-400 uppercase">{formatUnitName(item.unit || 'unit')}</span></p>
                </div>
                <div>
                  <p className="text-[#64748b] text-xs">New Qty</p>
                  <p className="font-semibold text-[#0f172a]">{item.newQty} <span className="text-[10px] text-gray-400 uppercase">{formatUnitName(item.unit || 'unit')}</span></p>
                </div>
                <div>
                  <p className="text-[#64748b] text-xs">Delta</p>
                  <p className={`font-semibold ${item.delta > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {item.delta > 0 ? '+' : ''}{item.delta} <span className="text-[10px] opacity-70 uppercase">{formatUnitName(item.unit || 'unit')}</span>
                  </p>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-[#64748b]">Reason: </span>
                <span className="text-[#0f172a] font-medium">{item.reason}</span>
              </div>
            </div>
          ))}

          <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
            <h4 className="font-semibold text-[#0f172a] mb-3">Audit Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Total Items:</span>
                <span className="font-medium text-[#0f172a]">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Total Delta:</span>
                <span className={`font-semibold ${totalDelta > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                  {totalDelta > 0 ? '+' : ''}{totalDelta} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Timestamp:</span>
                <span className="font-medium text-[#0f172a]">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">User:</span>
                <span className="font-medium text-[#0f172a]">Aman (Pharmacist)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#e2e8f0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] font-semibold"
          >
            Confirm Adjustment
          </button>
        </div>
      </div>
    </div>
  );
}

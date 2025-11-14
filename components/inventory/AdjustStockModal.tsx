'use client';

import { useState } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';

export default function AdjustStockModal({ item, onClose }: any) {
  const [selectedBatch, setSelectedBatch] = useState(item.batches[0]?.id || '');
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState('');

  const batch = item.batches.find((b: any) => b.id === selectedBatch);
  const resultingQty = batch ? batch.qty + delta : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <h3 className="text-lg font-bold text-[#0f172a]">Adjust Stock</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#f8fafc] rounded">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-[#0f172a] mb-1">{item.name}</p>
            <p className="text-xs text-[#64748b]">{item.generic}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Select Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
            >
              {item.batches.map((batch: any) => (
                <option key={batch.id} value={batch.id}>
                  {batch.id} • Qty: {batch.qty} • Exp: {batch.expiry}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Adjustment</label>
            <input
              type="number"
              value={delta || ''}
              onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
              placeholder="Enter +/- quantity"
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
            />
            <p className="text-xs text-[#64748b] mt-1">
              Current: {batch?.qty} → Resulting: <span className={resultingQty < 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}>{resultingQty}</span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
            >
              <option value="">Select reason...</option>
              <option value="count">Count correction</option>
              <option value="damage">Damage</option>
              <option value="expiry">Expiry write-off</option>
              <option value="return">Return to supplier</option>
              <option value="lost">Lost/Theft</option>
            </select>
          </div>

          {delta < 0 && (
            <div className="p-3 bg-[#fef3c7] border border-[#fde68a] rounded-lg flex items-start gap-2">
              <FiAlertCircle className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
              <p className="text-xs text-[#92400e]">
                Negative adjustments require audit trail. This action will be logged with your user ID and timestamp.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#e2e8f0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc]"
          >
            Cancel
          </button>
          <button
            disabled={!reason || delta === 0}
            className="flex-1 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed"
          >
            Confirm Adjustment
          </button>
        </div>
      </div>
    </div>
  );
}

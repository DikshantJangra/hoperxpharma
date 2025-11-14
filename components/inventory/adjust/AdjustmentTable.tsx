'use client';

import { FiX, FiUpload } from 'react-icons/fi';

const REASONS = [
  { value: 'count', label: '🔵 Count Correction', desc: 'Physical count differs from system' },
  { value: 'damage', label: '🟡 Damage / Breakage', desc: 'Product damaged or broken' },
  { value: 'expiry', label: '🟠 Expiry Removal', desc: 'Expired stock write-off' },
  { value: 'theft', label: '🔴 Theft / Loss', desc: 'Missing inventory' },
  { value: 'return', label: '🟣 Supplier Return', desc: 'Returned to supplier' },
  { value: 'overstock', label: '🟤 Overstock Mistake', desc: 'Incorrect stock entry' },
  { value: 'import', label: '⚪ Import Sync', desc: 'System sync correction' },
  { value: 'validation', label: '🟩 Manual Validation', desc: 'Cycle count validation' },
  { value: 'controlled', label: '🟥 Controlled Substance', desc: 'Requires approval' },
];

export default function AdjustmentTable({ items, onUpdate, onRemove }: any) {
  return (
    <div className="space-y-4">
      {items.map((item: any, index: number) => (
        <div key={index} className="bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#0f172a]">{item.name}</h3>
              <p className="text-xs text-[#64748b] mt-0.5">{item.pack} • SKU: {item.sku}</p>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="text-[#ef4444] hover:bg-[#fef2f2] p-1.5 rounded"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* Batch Selection */}
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1 block">Batch *</label>
              <select
                value={item.batchId || ''}
                onChange={(e) => onUpdate(index, { batchId: e.target.value, currentQty: 100 })}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              >
                <option value="">Select batch...</option>
                <option value="B-2025-01">B-2025-01 (Qty: 100)</option>
                <option value="B-2025-11">B-2025-11 (Qty: 90)</option>
              </select>
            </div>

            {/* Current Qty */}
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1 block">Current Qty</label>
              <input
                type="number"
                value={item.currentQty || ''}
                readOnly
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm bg-[#f8fafc] text-[#64748b]"
              />
            </div>

            {/* New Qty */}
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1 block">New Qty *</label>
              <input
                type="number"
                value={item.newQty || ''}
                onChange={(e) => onUpdate(index, { newQty: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              />
            </div>

            {/* Delta */}
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1 block">Delta</label>
              <div className={`px-3 py-2 border rounded-lg text-sm font-semibold ${
                item.delta > 0 ? 'bg-[#d1fae5] border-[#10b981] text-[#065f46]' :
                item.delta < 0 ? 'bg-[#fee2e2] border-[#ef4444] text-[#991b1b]' :
                'bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]'
              }`}>
                {item.delta > 0 ? '+' : ''}{item.delta}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[#64748b] mb-1 block">Reason *</label>
            <select
              value={item.reason}
              onChange={(e) => onUpdate(index, { reason: e.target.value })}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
            >
              <option value="">Select reason...</option>
              {REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {item.reason && (
              <p className="text-xs text-[#64748b] mt-1">
                {REASONS.find(r => r.value === item.reason)?.desc}
              </p>
            )}
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1 block">Evidence (Optional)</label>
            <button className="w-full px-3 py-2 border-2 border-dashed border-[#cbd5e1] rounded-lg hover:border-[#0ea5a3] hover:bg-[#f0fdfa] flex items-center justify-center gap-2 text-sm text-[#64748b]">
              <FiUpload className="w-4 h-4" />
              Upload Photo/Document
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

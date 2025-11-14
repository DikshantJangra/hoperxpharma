'use client';

import { useState } from 'react';
import { FiX, FiAlertOctagon, FiUpload } from 'react-icons/fi';

export default function QuarantineModal({ batch, onClose }: any) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            <FiAlertOctagon className="w-5 h-5 text-[#ef4444]" />
            <h3 className="text-lg font-bold text-[#0f172a]">Quarantine Batch</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#f8fafc] rounded">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-[#0f172a] mb-1">Batch: {batch.id}</p>
            <p className="text-xs text-[#64748b]">{batch.itemName}</p>
          </div>

          <div className="p-3 bg-[#fef3c7] border border-[#fde68a] rounded-lg">
            <p className="text-xs text-[#92400e]">
              Quarantining this batch will prevent it from being picked for sales until released.
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
              <option value="temp">Temperature breach</option>
              <option value="contamination">Suspected contamination</option>
              <option value="recall">Supplier recall</option>
              <option value="quality">Quality issue</option>
              <option value="investigation">Under investigation</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add investigation details..."
              rows={3}
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Attach Evidence</label>
            <button className="w-full px-3 py-2 border-2 border-dashed border-[#cbd5e1] rounded-lg hover:border-[#0ea5a3] hover:bg-[#f0fdfa] flex items-center justify-center gap-2 text-sm text-[#64748b]">
              <FiUpload className="w-4 h-4" />
              Upload Photo/Document
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-[#e2e8f0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc]"
          >
            Cancel
          </button>
          <button
            disabled={!reason}
            className="flex-1 py-2 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed"
          >
            Quarantine Batch
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

export default function PinModal({ onClose }: any) {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md m-4">
        <div className="p-6 border-b border-[#e2e8f0]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#fef3c7] rounded-full flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">Override Warning</h3>
                <p className="text-sm text-[#64748b]">Pharmacist PIN required</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[#f1f5f9] rounded">
              <FiX className="w-5 h-5 text-[#64748b]" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-2">Clinical Rationale (Required)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain clinical rationale for override..." rows={4} className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-2">Pharmacist PIN</label>
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter 4-digit PIN" maxLength={4} className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
          </div>

          <div className="p-3 bg-[#fef3c7] border border-[#fde68a] rounded-lg">
            <p className="text-xs text-[#92400e]">
              This action will be logged in the audit trail with your credentials and timestamp.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] text-sm font-medium">
            Cancel
          </button>
          <button disabled={!pin || !reason} className="px-4 py-2 bg-[#f59e0b] text-white rounded-lg hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
            Confirm Override
          </button>
        </div>
      </div>
    </div>
  );
}

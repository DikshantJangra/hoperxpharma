'use client';

import { useState } from 'react';
import { FiUpload, FiSettings } from 'react-icons/fi';
import { BsQrCodeScan } from 'react-icons/bs';
import NewAdjustment from '@/components/inventory/adjust/NewAdjustment';
import PastAdjustments from '@/components/inventory/adjust/PastAdjustments';

export default function AdjustPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'past'>('new');

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="flex items-center justify-between p-4 pb-0">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Adjust</h1>
            <p className="text-sm text-[#64748b]">Inventory › Adjust</p>
            <p className="text-xs text-[#94a3b8] mt-1">
              Adjust stock levels with full audit compliance. All changes require a reason and are permanently logged.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm">
              <BsQrCodeScan className="w-4 h-4" />
              Scan Batch
            </button>
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm">
              <FiUpload className="w-4 h-4" />
              Import CSV
            </button>
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm">
              <FiSettings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e2e8f0] px-4">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'new'
                ? 'border-[#0ea5a3] text-[#0ea5a3]'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            New Adjustment
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'past'
                ? 'border-[#0ea5a3] text-[#0ea5a3]'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Past Adjustments
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'new' ? <NewAdjustment /> : <PastAdjustments />}
      </div>
    </div>
  );
}

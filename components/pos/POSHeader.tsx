'use client';

import { useState } from 'react';

export default function POSHeader({ saleId, onOpenCustomer }: any) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  return (
    <div className="bg-white border-b border-[#e2e8f0] px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <select className="px-3 py-1.5 border border-[#cbd5e1] rounded-lg text-sm font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]">
          <option>Main Store</option>
          <option>Branch 1</option>
        </select>

        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            drawerOpen ? 'bg-[#10b981] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
          }`}
        >
          Cash Drawer: {drawerOpen ? 'Open' : 'Closed'}
        </button>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            syncStatus === 'synced' ? 'bg-[#10b981]' :
            syncStatus === 'syncing' ? 'bg-[#f59e0b] animate-pulse' :
            'bg-[#ef4444]'
          }`} />
          <span className="text-sm text-[#64748b]">
            {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}
          </span>
        </div>

        <div className="px-3 py-1.5 bg-[#f1f5f9] rounded-lg text-sm text-[#64748b]">
          Shift: <span className="font-medium text-[#0f172a]">Day</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-xs text-[#94a3b8] font-mono">
          Sale #{saleId}
        </div>
        <div className="text-sm text-[#64748b]">
          Press <kbd className="px-2 py-0.5 bg-[#f1f5f9] rounded border border-[#cbd5e1] text-xs font-mono">Shift + ?</kbd> for shortcuts
        </div>
      </div>
    </div>
  );
}

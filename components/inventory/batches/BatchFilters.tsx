'use client';

import { useState } from 'react';
import { FiChevronDown, FiSave } from 'react-icons/fi';

const SAVED_VIEWS = [
  { id: '1', name: 'Expiring soon (<30)', count: 18 },
  { id: '2', name: 'Quarantined', count: 3 },
  { id: '3', name: 'Cold-chain exceptions', count: 2 },
  { id: '4', name: 'Controlled substances', count: 24 },
];

export default function BatchFilters() {
  const [activeView, setActiveView] = useState<string | null>(null);
  const [expanded, setExpanded] = useState({ status: true, expiry: false });

  return (
    <div className="w-64 bg-white border-r border-[#e2e8f0] overflow-y-auto">
      <div className="p-4 border-b border-[#e2e8f0]">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Saved Views</h3>
        <div className="space-y-1">
          {SAVED_VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === view.id ? 'bg-[#f0fdfa] text-[#0ea5a3] font-medium' : 'hover:bg-[#f8fafc] text-[#64748b]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{view.name}</span>
                <span className="text-xs">{view.count}</span>
              </div>
            </button>
          ))}
        </div>
        <button className="w-full mt-3 px-3 py-2 border border-dashed border-[#cbd5e1] rounded-lg text-sm text-[#0ea5a3] hover:border-[#0ea5a3] hover:bg-[#f0fdfa] flex items-center justify-center gap-2">
          <FiSave className="w-4 h-4" />
          Save View
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0f172a]">Filters</h3>
          <button className="text-xs text-[#ef4444] hover:underline">Reset</button>
        </div>

        {/* Status */}
        <div className="mb-4">
          <button
            onClick={() => setExpanded({ ...expanded, status: !expanded.status })}
            className="w-full flex items-center justify-between text-sm font-medium text-[#0f172a] mb-2"
          >
            Status
            <FiChevronDown className={`w-4 h-4 transition-transform ${expanded.status ? 'rotate-180' : ''}`} />
          </button>
          {expanded.status && (
            <div className="space-y-2 pl-2">
              {['Active', 'Quarantine', 'Recalled', 'Reserved', 'Sold-out'].map((status) => (
                <label key={status} className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-[#0ea5a3]" />
                  {status}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Expiry Window */}
        <div className="mb-4">
          <button
            onClick={() => setExpanded({ ...expanded, expiry: !expanded.expiry })}
            className="w-full flex items-center justify-between text-sm font-medium text-[#0f172a] mb-2"
          >
            Expiry Window
            <FiChevronDown className={`w-4 h-4 transition-transform ${expanded.expiry ? 'rotate-180' : ''}`} />
          </button>
          {expanded.expiry && (
            <div className="space-y-2 pl-2">
              {['< 7 days', '< 30 days', '31-90 days', '> 90 days'].map((window) => (
                <label key={window} className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-[#0ea5a3]" />
                  {window}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

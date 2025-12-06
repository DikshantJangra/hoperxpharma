'use client';

import { useState } from 'react';
import { FiChevronDown, FiSave, FiX } from 'react-icons/fi';

const SAVED_VIEWS = [
  { id: '1', name: 'Low stock — reorder candidates', count: 23 },
  { id: '2', name: 'Expiring < 30 days', count: 12 },
  { id: '3', name: 'Cold chain stock', count: 45 },
  { id: '4', name: 'Controlled substances', count: 18 },
];

interface StockFiltersProps {
  stockStatusFilters: string[];
  expiryFilters: string[];
  storageFilters: string[];
  activeView: string | null;
  onFilterChange: (type: 'stockStatus' | 'expiry' | 'storage', values: string[]) => void;
  onViewChange: (viewId: string | null) => void;
  onReset: () => void;
}

export default function StockFilters({
  stockStatusFilters,
  expiryFilters,
  storageFilters,
  activeView,
  onFilterChange,
  onViewChange,
  onReset
}: StockFiltersProps) {
  const [expanded, setExpanded] = useState({
    status: true,
    expiry: false,
    storage: false,
  });

  const handleCheckboxChange = (type: 'stockStatus' | 'expiry' | 'storage', value: string, checked: boolean) => {
    const currentFilters = type === 'stockStatus' ? stockStatusFilters :
      type === 'expiry' ? expiryFilters : storageFilters;

    const newFilters = checked
      ? [...currentFilters, value]
      : currentFilters.filter(f => f !== value);

    onFilterChange(type, newFilters);
  };

  return (
    <div className="w-64 bg-white border-r border-[#e2e8f0] overflow-y-auto">
      <div className="p-4 border-b border-[#e2e8f0]">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Saved Views</h3>
        <div className="space-y-1">
          {SAVED_VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => onViewChange(activeView === view.id ? null : view.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeView === view.id
                ? 'bg-[#f0fdfa] text-[#0ea5a3] font-medium'
                : 'hover:bg-[#f8fafc] text-[#64748b]'
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
          Save Current View
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0f172a]">Filters</h3>
          <button onClick={onReset} className="text-xs text-[#ef4444] hover:underline">Reset</button>
        </div>

        {/* Stock Status */}
        <div className="mb-4">
          <button
            onClick={() => setExpanded({ ...expanded, status: !expanded.status })}
            className="w-full flex items-center justify-between text-sm font-medium text-[#0f172a] mb-2"
          >
            Stock Status
            <FiChevronDown className={`w-4 h-4 transition-transform ${expanded.status ? 'rotate-180' : ''}`} />
          </button>
          {expanded.status && (
            <div className="space-y-2 pl-2">
              {[
                { value: 'in_stock', label: 'In stock' },
                { value: 'out_of_stock', label: 'Out of stock' },
                { value: 'low_stock', label: 'Low stock' },
                { value: 'overstocked', label: 'Overstocked' }
              ].map((status) => (
                <label key={status.value} className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-[#0ea5a3]"
                    checked={stockStatusFilters.includes(status.value)}
                    onChange={(e) => handleCheckboxChange('stockStatus', status.value, e.target.checked)}
                  />
                  {status.label}
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
              {[
                { value: '<7days', label: '< 7 days' },
                { value: '<30days', label: '< 30 days' },
                { value: '30-90days', label: '30-90 days' },
                { value: '>90days', label: '> 90 days' }
              ].map((window) => (
                <label key={window.value} className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-[#0ea5a3]"
                    checked={expiryFilters.includes(window.value)}
                    onChange={(e) => handleCheckboxChange('expiry', window.value, e.target.checked)}
                  />
                  {window.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Storage */}
        <div className="mb-4">
          <button
            onClick={() => setExpanded({ ...expanded, storage: !expanded.storage })}
            className="w-full flex items-center justify-between text-sm font-medium text-[#0f172a] mb-2"
          >
            Storage
            <FiChevronDown className={`w-4 h-4 transition-transform ${expanded.storage ? 'rotate-180' : ''}`} />
          </button>
          {expanded.storage && (
            <div className="space-y-2 pl-2">
              {[
                { value: 'ambient', label: 'Ambient' },
                { value: 'cold_chain', label: 'Cold chain' },
                { value: 'schedule_h', label: 'Schedule H' },
                { value: 'controlled', label: 'Controlled' }
              ].map((storage) => (
                <label key={storage.value} className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-[#0ea5a3]"
                    checked={storageFilters.includes(storage.value)}
                    onChange={(e) => handleCheckboxChange('storage', storage.value, e.target.checked)}
                  />
                  {storage.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { FiChevronDown, FiSave, FiStar, FiPackage, FiClock, FiThermometer, FiFilter } from 'react-icons/fi';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [savedViewsCollapsed, setSavedViewsCollapsed] = useState(false);
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
    <div className={`flex flex-col h-full bg-white border-r border-[#e2e8f0] transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-64'}`}>
      <div className={`p-4 border-b border-[#e2e8f0] flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!sidebarCollapsed && (
          <h3 className="text-sm font-semibold text-[#0f172a]">Filters</h3>
        )}
        {sidebarCollapsed && (
          <FiFilter className="w-4 h-4 text-gray-400 mx-auto" />
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`text-gray-500 hover:text-gray-700 transition-colors ${sidebarCollapsed ? 'mt-4' : ''}`}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FiChevronDown className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      </div>

      {!sidebarCollapsed ? (
        <div className="flex-1 overflow-y-auto">
          {/* Saved Views Section */}
          <div className="p-4 border-b border-[#e2e8f0]">
            <button
              onClick={() => setSavedViewsCollapsed(!savedViewsCollapsed)}
              className="w-full flex items-center justify-between text-sm font-medium text-[#0f172a] mb-2 group"
            >
              <span className="group-hover:text-[#0ea5a3] transition-colors">Saved Views</span>
              <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${savedViewsCollapsed ? '-rotate-90' : ''}`} />
            </button>

            {!savedViewsCollapsed && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
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
                      <span className="truncate">{view.name}</span>
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{view.count}</span>
                    </div>
                  </button>
                ))}

                <button className="w-full mt-3 px-3 py-2 border border-dashed border-[#cbd5e1] rounded-lg text-sm text-[#0ea5a3] hover:border-[#0ea5a3] hover:bg-[#f0fdfa] flex items-center justify-center gap-2 transition-colors">
                  <FiSave className="w-4 h-4" />
                  Save View
                </button>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Filters</h3>
              <button
                onClick={onReset}
                className="text-xs text-[#ef4444] hover:text-red-600 hover:underline transition-colors"
                title="Clear all filters"
              >
                Reset All
              </button>
            </div>

            {/* Stock Status */}
            <div className="mb-4">
              <button
                onClick={() => setExpanded({ ...expanded, status: !expanded.status })}
                className="w-full flex items-center justify-between text-sm font-medium text-[#0f172a] mb-2 group"
              >
                <span className="group-hover:text-[#0ea5a3] transition-colors">Stock Status</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${expanded.status ? 'rotate-180' : ''}`} />
              </button>
              {expanded.status && (
                <div className="space-y-2 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {[
                    { value: 'zero_stock', label: 'Zero Stock', color: 'text-red-600' },
                    { value: 'in_stock', label: 'In stock', color: 'text-emerald-600' },
                    { value: 'out_of_stock', label: 'Out of stock', color: 'text-red-600' },
                    { value: 'low_stock', label: 'Low stock', color: 'text-amber-600' },
                    { value: 'overstocked', label: 'Overstocked', color: 'text-blue-600' }
                  ].map((status) => (
                    <label key={status.value} className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer hover:text-[#0f172a] transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-[#0ea5a3] focus:ring-[#0ea5a3]"
                        checked={stockStatusFilters.includes(status.value)}
                        onChange={(e) => handleCheckboxChange('stockStatus', status.value, e.target.checked)}
                      />
                      <span className={stockStatusFilters.includes(status.value) ? status.color : ''}>{status.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Expiry Window */}
            <div className="mb-4">
              <button
                onClick={() => setExpanded({ ...expanded, expiry: !expanded.expiry })}
                className="w-full flex items-center justify-between text-sm font-medium text-[#0f172a] mb-2 group"
              >
                <span className="group-hover:text-[#0ea5a3] transition-colors">Expiry Window</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${expanded.expiry ? 'rotate-180' : ''}`} />
              </button>
              {expanded.expiry && (
                <div className="space-y-2 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {[
                    { value: '<7days', label: 'Critical (< 7 days)', color: 'text-red-600' },
                    { value: '<30days', label: 'Warning (< 30 days)', color: 'text-orange-600' },
                    { value: '30-90days', label: 'Upcoming (30-90 days)', color: 'text-yellow-600' },
                    { value: '>90days', label: 'Safe (> 90 days)', color: 'text-emerald-600' }
                  ].map((window) => (
                    <label key={window.value} className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer hover:text-[#0f172a] transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-[#0ea5a3] focus:ring-[#0ea5a3]"
                        checked={expiryFilters.includes(window.value)}
                        onChange={(e) => handleCheckboxChange('expiry', window.value, e.target.checked)}
                      />
                      <span className={expiryFilters.includes(window.value) ? window.color : ''}>{window.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Storage */}
            <div className="mb-4">
              <button
                onClick={() => setExpanded({ ...expanded, storage: !expanded.storage })}
                className="w-full flex items-center justify-between text-sm font-medium text-[#0f172a] mb-2 group"
              >
                <span className="group-hover:text-[#0ea5a3] transition-colors">Storage Type</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${expanded.storage ? 'rotate-180' : ''}`} />
              </button>
              {expanded.storage && (
                <div className="space-y-2 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {[
                    { value: 'ambient', label: 'Ambient (Room Temp)' },
                    { value: 'cold_chain', label: 'Cold Chain (2-8°C)' },
                    { value: 'schedule_h', label: 'Schedule H' },
                    { value: 'controlled', label: 'Controlled (Narcotic)' }
                  ].map((storage) => (
                    <label key={storage.value} className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer hover:text-[#0f172a] transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-[#0ea5a3] focus:ring-[#0ea5a3]"
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
      ) : (
        /* Collapsed Icon View */
        <div className="flex-1 flex flex-col items-center py-4 space-y-6">
          {/* Saved Views Icon */}
          <button
            onClick={() => { setSidebarCollapsed(false); setSavedViewsCollapsed(false); }}
            className={`p-2 rounded-lg transition-colors ${activeView ? 'text-[#0ea5a3] bg-[#f0fdfa]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Saved Views"
          >
            <FiStar className="w-5 h-5" />
          </button>

          {/* Stock Status Icon */}
          <button
            onClick={() => { setSidebarCollapsed(false); setExpanded(p => ({ ...p, status: true })); }}
            className={`p-2 rounded-lg transition-colors ${stockStatusFilters.length > 0 ? 'text-[#0ea5a3] bg-[#f0fdfa]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Stock Status"
          >
            <FiPackage className="w-5 h-5" />
            {stockStatusFilters.length > 0 && (
              <span className="absolute ml-3 -mt-2 w-2 h-2 bg-[#0ea5a3] rounded-full" />
            )}
          </button>

          {/* Expiry Icon */}
          <button
            onClick={() => { setSidebarCollapsed(false); setExpanded(p => ({ ...p, expiry: true })); }}
            className={`p-2 rounded-lg transition-colors ${expiryFilters.length > 0 ? 'text-[#0ea5a3] bg-[#f0fdfa]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Expiry"
          >
            <FiClock className="w-5 h-5" />
            {expiryFilters.length > 0 && (
              <span className="absolute ml-3 -mt-2 w-2 h-2 bg-[#0ea5a3] rounded-full" />
            )}
          </button>

          {/* Storage Icon */}
          <button
            onClick={() => { setSidebarCollapsed(false); setExpanded(p => ({ ...p, storage: true })); }}
            className={`p-2 rounded-lg transition-colors ${storageFilters.length > 0 ? 'text-[#0ea5a3] bg-[#f0fdfa]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Storage"
          >
            <FiThermometer className="w-5 h-5" />
            {storageFilters.length > 0 && (
              <span className="absolute ml-3 -mt-2 w-2 h-2 bg-[#0ea5a3] rounded-full" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

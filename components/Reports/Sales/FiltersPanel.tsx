'use client';

import React from 'react';
import { SalesFilters } from '@/types/reports';

interface FiltersPanelProps {
  filters: SalesFilters;
  onChange: (filters: SalesFilters) => void;
}

export default function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  const savedViews = [
    { id: 'all', label: 'All Sales' },
    { id: 'top-performers', label: 'Top Performers' },
    { id: 'declining', label: 'Declining SKUs' },
    { id: 'promotions', label: 'Promotion Impact' }
  ];

  return (
    <div className="bg-white border-r border-gray-200 p-4 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Saved Views</h3>
        <div className="space-y-1">
          {savedViews.map(view => (
            <button
              key={view.id}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Filters</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Store</label>
            <select
              value={filters.storeId || ''}
              onChange={(e) => onChange({ ...filters, storeId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Stores</option>
              <option value="store_01">Main Store</option>
              <option value="store_02">Branch 1</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Channel</label>
            <select
              value={filters.channel || ''}
              onChange={(e) => onChange({ ...filters, channel: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Channels</option>
              <option value="POS">POS</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Categories</option>
              <option value="tablets">Tablets</option>
              <option value="syrups">Syrups</option>
              <option value="otc">OTC</option>
            </select>
          </div>

          <button
            onClick={() => onChange({ from: filters.from, to: filters.to })}
            className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}

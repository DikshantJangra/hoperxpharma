'use client';

import React from 'react';
import { SalesFilters, PaymentMethod, PaymentSource, ReconStatus } from '@/types/finance';

interface SalesFiltersPanelProps {
  filters: SalesFilters;
  onChange: (filters: SalesFilters) => void;
  onSavedViewClick: (view: string) => void;
  isLoading: boolean;
}

export default function SalesFiltersPanel({ filters, onChange, onSavedViewClick, isLoading }: SalesFiltersPanelProps) {
  const savedViews = [
    { id: 'monthly-close', label: 'Monthly Close' },
    { id: 'pending-reconcile', label: 'Pending Reconcile' },
    { id: 'gst-export', label: 'GST Export' },
    { id: 'refunds', label: 'Refunds' }
  ];

  return (
    <div className="bg-white border-r border-gray-200 p-4 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Saved Views</h3>
        <div className="space-y-1">
          {savedViews.map(view => (
            <button
              key={view.id}
              onClick={() => onSavedViewClick(view.id)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              disabled={isLoading}
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
              disabled={isLoading}
            >
              <option value="">All Stores</option>
              <option value="store_01">Main Store</option>
              <option value="store_02">Branch 1</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Source</label>
            <select
              value={filters.source || ''}
              onChange={(e) => onChange({ ...filters, source: e.target.value as PaymentSource || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isLoading}
            >
              <option value="">All Sources</option>
              <option value="POS">POS</option>
              <option value="ONLINE">Online</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Payment Method</label>
            <select
              value={filters.paymentMethod || ''}
              onChange={(e) => onChange({ ...filters, paymentMethod: e.target.value as PaymentMethod || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isLoading}
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="WALLET">Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Reconciliation Status</label>
            <select
              value={filters.reconStatus || ''}
              onChange={(e) => onChange({ ...filters, reconStatus: e.target.value as ReconStatus || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isLoading}
            >
              <option value="">All Status</option>
              <option value="MATCHED">Matched</option>
              <option value="UNMATCHED">Unmatched</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>

          <button
            onClick={() => onChange({ from: filters.from, to: filters.to })}
            className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isLoading}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Bank Feed</h3>
        {isLoading ? (
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
        ) : (
            <div className="text-xs text-gray-500 mb-2">Last sync: 2 hours ago</div>
        )}
        <button 
            className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
            disabled={isLoading}
        >
          Upload Bank Statement
        </button>
      </div>
    </div>
  );
}

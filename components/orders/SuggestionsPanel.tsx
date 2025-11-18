'use client';

import React from 'react';
import { SuggestedItem, POLine } from '@/types/po';
import { HiOutlinePlus, HiOutlineExclamationTriangle } from 'react-icons/hi2';

interface SuggestionsPanelProps {
  suggestions: SuggestedItem[];
  onAddItem: (item: Partial<POLine>) => void;
  storeId: string;
}

export default function SuggestionsPanel({ suggestions, onAddItem, storeId }: SuggestionsPanelProps) {
  const lowStockItems = suggestions.filter(item => item.reason.includes('Low stock'));
  const forecastItems = suggestions.filter(item => item.reason.includes('Forecast'));

  const handleAddSuggestion = (item: SuggestedItem) => {
    onAddItem({
      drugId: item.drugId,
      description: item.description,
      packUnit: item.packUnit,
      qty: item.suggestedQty,
      unit: item.packUnit.toLowerCase(),
      pricePerUnit: item.lastPurchasePrice || 0,
      gstPercent: item.gstPercent,
      suggestedQty: item.suggestedQty,
      reorderReason: item.reason,
      lastPurchasePrice: item.lastPurchasePrice
    });
  };

  const handleBulkAdd = (items: SuggestedItem[]) => {
    items.forEach(item => handleAddSuggestion(item));
  };

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200">
          <div className="px-4 py-3 border-b border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineExclamationTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-medium text-red-800">Low Stock Alerts</h3>
              </div>
              <button
                onClick={() => handleBulkAdd(lowStockItems)}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Add All
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {lowStockItems.map((item) => (
              <SuggestionItem
                key={item.drugId}
                item={item}
                onAdd={() => handleAddSuggestion(item)}
                variant="urgent"
              />
            ))}
          </div>
        </div>
      )}

      {/* Forecast Suggestions */}
      {forecastItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200">
          <div className="px-4 py-3 border-b border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-blue-800">Forecast Suggestions</h3>
              <button
                onClick={() => handleBulkAdd(forecastItems)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Add All
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {forecastItems.map((item) => (
              <SuggestionItem
                key={item.drugId}
                item={item}
                onAdd={() => handleAddSuggestion(item)}
                variant="forecast"
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-800">Quick Actions</h3>
        </div>
        <div className="p-4 space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
            Recent POs (Last 30 days)
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
            Supplier Catalog
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
            Import from Template
          </button>
        </div>
      </div>

      {suggestions.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500">No suggestions available</p>
          <p className="text-xs text-gray-400 mt-1">
            Suggestions will appear based on stock levels and forecasts
          </p>
        </div>
      )}
    </div>
  );
}

interface SuggestionItemProps {
  item: SuggestedItem;
  onAdd: () => void;
  variant: 'urgent' | 'forecast';
}

function SuggestionItem({ item, onAdd, variant }: SuggestionItemProps) {
  const isUrgent = variant === 'urgent';
  
  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {item.description}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Current: {item.currentStock} • Suggested: {item.suggestedQty}
          </div>
          <div className={`mt-1 text-xs ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
            {item.reason}
          </div>
          {item.lastPurchasePrice && (
            <div className="mt-1 text-xs text-gray-400">
              Last price: ₹{item.lastPurchasePrice}
            </div>
          )}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Confidence: {Math.round(item.confidenceScore * 100)}%
            </span>
            <div className={`h-1 w-8 rounded-full ${
              item.confidenceScore > 0.8 ? 'bg-green-400' :
              item.confidenceScore > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
          </div>
        </div>
        <button
          onClick={onAdd}
          className={`ml-3 p-1 rounded-md ${
            isUrgent 
              ? 'text-red-600 hover:bg-red-100' 
              : 'text-blue-600 hover:bg-blue-100'
          }`}
        >
          <HiOutlinePlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
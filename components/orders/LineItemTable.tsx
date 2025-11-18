'use client';

import React, { useState } from 'react';
import { POLine, Supplier } from '@/types/po';
import LineItemRow from './LineItemRow';
import ProductSearch from './ProductSearch';
import { MdAdd } from 'react-icons/md';

interface LineItemTableProps {
  lines: POLine[];
  onAddLine: (item: Partial<POLine>) => void;
  onUpdateLine: (lineId: string, updates: Partial<POLine>) => void;
  onRemoveLine: (lineId: string) => void;
  supplier?: Supplier;
}

export default function LineItemTable({ 
  lines, 
  onAddLine, 
  onUpdateLine, 
  onRemoveLine, 
  supplier 
}: LineItemTableProps) {
  const [showSearch, setShowSearch] = useState(false);

  const handleAddProduct = (product: any) => {
    onAddLine({
      drugId: product.id,
      description: product.name,
      packUnit: product.packUnit || 'Strip',
      packSize: product.packSize || 10,
      qty: 1,
      unit: product.unit || 'strip',
      pricePerUnit: product.price || 0,
      gstPercent: product.gstPercent || 12,
      lastPurchasePrice: product.lastPrice
    });
    setShowSearch(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-800">Line Items</h3>
          <button
            onClick={() => setShowSearch(true)}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <MdAdd className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <ProductSearch
            onSelect={handleAddProduct}
            onCancel={() => setShowSearch(false)}
            supplier={supplier}
          />
        </div>
      )}

      {lines.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-500">No items added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Use the search above or add from suggestions panel
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pack
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GST%
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disc%
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lines.map((line) => (
                <LineItemRow
                  key={line.lineId}
                  line={line}
                  onChange={(updates) => onUpdateLine(line.lineId, updates)}
                  onRemove={() => onRemoveLine(line.lineId)}
                  supplier={supplier}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lines.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {lines.length} item{lines.length !== 1 ? 's' : ''}
            </span>
            <span className="font-medium text-gray-900">
              Subtotal: ₹{lines.reduce((sum, line) => sum + line.lineNet, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
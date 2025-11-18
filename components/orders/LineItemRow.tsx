'use client';

import React, { useState } from 'react';
import { POLine, Supplier } from '@/types/po';
import { MdDelete, MdWarning } from 'react-icons/md';

interface LineItemRowProps {
  line: POLine;
  onChange: (updates: Partial<POLine>) => void;
  onRemove: () => void;
  supplier?: Supplier;
}

export default function LineItemRow({ line, onChange, onRemove, supplier }: LineItemRowProps) {
  const [editing, setEditing] = useState<string | null>(null);

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  const handleFieldChange = (field: keyof POLine, value: any) => {
    onChange({ [field]: value });
  };

  const handleBlur = () => {
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditing(null);
    } else if (e.key === 'Escape') {
      setEditing(null);
    }
  };

  // Validation warnings
  const warnings = [];
  if (line.lastPurchasePrice && line.pricePerUnit) {
    const priceDiff = Math.abs(line.pricePerUnit - line.lastPurchasePrice) / line.lastPurchasePrice;
    if (priceDiff > 0.2) {
      warnings.push(`Price differs from last purchase by ${Math.round(priceDiff * 100)}%`);
    }
  }
  if (line.moq && line.qty < line.moq) {
    warnings.push(`Qty below supplier MOQ (${line.moq})`);
  }

  const hasWarnings = warnings.length > 0;

  return (
    <tr className={hasWarnings ? 'bg-yellow-50' : ''}>
      <td className="px-4 py-3">
        <div>
          <div className="text-sm font-medium text-gray-900">{line.description}</div>
          {line.suggestedQty && (
            <div className="text-xs text-blue-600">
              Suggested: {line.suggestedQty} ({line.reorderReason})
            </div>
          )}
          {line.lastPurchasePrice && (
            <div className="text-xs text-gray-500">
              Last price: {formatCurrency(line.lastPurchasePrice)}
            </div>
          )}
          {hasWarnings && (
            <div className="flex items-center gap-1 mt-1">
              <MdWarning className="h-3 w-3 text-yellow-600" />
              <span className="text-xs text-yellow-700">{warnings[0]}</span>
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="text-sm text-gray-900">
          {line.packUnit} of {line.packSize}
        </div>
      </td>

      <td className="px-4 py-3">
        {editing === 'qty' ? (
          <input
            type="number"
            value={line.qty}
            onChange={(e) => handleFieldChange('qty', parseInt(e.target.value) || 0)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditing('qty')}
            className="text-sm text-gray-900 hover:text-blue-600 text-left"
          >
            {line.qty}
          </button>
        )}
      </td>

      <td className="px-4 py-3">
        {editing === 'price' ? (
          <input
            type="number"
            step="0.01"
            value={line.pricePerUnit}
            onChange={(e) => handleFieldChange('pricePerUnit', parseFloat(e.target.value) || 0)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditing('price')}
            className="text-sm text-gray-900 hover:text-blue-600 text-left"
          >
            {formatCurrency(line.pricePerUnit)}
          </button>
        )}
      </td>

      <td className="px-4 py-3">
        {editing === 'gst' ? (
          <select
            value={line.gstPercent}
            onChange={(e) => handleFieldChange('gstPercent', parseFloat(e.target.value))}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          >
            <option value={0}>0%</option>
            <option value={5}>5%</option>
            <option value={12}>12%</option>
            <option value={18}>18%</option>
            <option value={28}>28%</option>
          </select>
        ) : (
          <button
            onClick={() => setEditing('gst')}
            className="text-sm text-gray-900 hover:text-blue-600 text-left"
          >
            {line.gstPercent}%
          </button>
        )}
      </td>

      <td className="px-4 py-3">
        {editing === 'discount' ? (
          <input
            type="number"
            step="0.1"
            value={line.discountPercent}
            onChange={(e) => handleFieldChange('discountPercent', parseFloat(e.target.value) || 0)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditing('discount')}
            className="text-sm text-gray-900 hover:text-blue-600 text-left"
          >
            {line.discountPercent}%
          </button>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(line.lineNet)}
        </div>
      </td>

      <td className="px-4 py-3">
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 p-1"
          title="Remove item"
        >
          <MdDelete className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
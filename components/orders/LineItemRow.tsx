'use client';

import React from 'react';
import { POLine, Supplier } from '@/types/po';
import { MdDelete, MdWarning } from 'react-icons/md';

interface LineItemRowProps {
  line: POLine;
  onChange: (updates: Partial<POLine>) => void;
  onRemove: () => void;
  supplier?: Supplier;
}

export default function LineItemRow({ line, onChange, onRemove, supplier }: LineItemRowProps) {
  const formatCurrency = (amount: any) => {
    const val = Number(amount);
    return isNaN(val) ? '₹0.00' : `₹${val.toFixed(2)}`;
  };

  const handleFieldChange = (field: keyof POLine, value: any) => {
    onChange({ [field]: value });
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
    <tr className={`group hover:bg-gray-50 transition-colors ${hasWarnings ? 'bg-yellow-50/50' : ''}`}>
      <td className="px-4 py-3">
        <div>
          <div className="text-sm font-medium text-gray-900">{line.description}</div>

          {line.lastPurchasePrice && (
            <div className="text-xs text-gray-500 mt-0.5">
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
        <div className="text-sm text-gray-600">
          {line.packUnit} of {line.packSize}
        </div>
      </td>

      <td className="px-4 py-3">
        <input
          type="number"
          value={line.qty || ''}
          onChange={(e) => handleFieldChange('qty', e.target.value === '' ? 0 : parseFloat(e.target.value))}
          onFocus={(e) => e.target.select()}
          className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded bg-transparent focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
          min="1"
        />
      </td>

      <td className="px-4 py-3">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <input
            type="number"
            step="0.01"
            value={line.pricePerUnit || ''}
            onChange={(e) => handleFieldChange('pricePerUnit', e.target.value === '' ? 0 : parseFloat(e.target.value))}
            onFocus={(e) => e.target.select()}
            className="w-24 pl-5 pr-2 py-1.5 text-sm border border-gray-200 rounded bg-transparent focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
          />
        </div>
      </td>

      <td className="px-4 py-3">
        <select
          value={line.gstPercent}
          onChange={(e) => handleFieldChange('gstPercent', parseFloat(e.target.value))}
          className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded bg-transparent focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
        >
          <option value={0}>0%</option>
          <option value={5}>5%</option>
          <option value={12}>12%</option>
          <option value={18}>18%</option>
          <option value={28}>28%</option>
        </select>
      </td>

      <td className="px-4 py-3">
        <div className="relative">
          <input
            type="number"
            step="0.1"
            value={line.discountPercent || ''}
            onChange={(e) => handleFieldChange('discountPercent', e.target.value === '' ? 0 : parseFloat(e.target.value))}
            onFocus={(e) => e.target.select()}
            className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded bg-transparent focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
          />
          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(line.lineNet)}
        </div>
      </td>

      <td className="px-4 py-3">
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
          title="Remove item"
        >
          <MdDelete className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
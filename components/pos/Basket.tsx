'use client';

import { useState } from 'react';
import { FiMinus, FiPlus, FiX, FiTag, FiChevronDown, FiPercent } from 'react-icons/fi';

export default function Basket({ items, onUpdateItem, onRemoveItem, onClear }: any) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const subtotal = items.reduce((sum: number, item: any) => {
    const lineTotal = item.qty * item.mrp - (item.discount || 0);
    return sum + lineTotal;
  }, 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                <FiTag className="w-8 h-8 text-[#94a3b8]" />
              </div>
              <p className="text-[#64748b] text-sm">Basket is empty</p>
              <p className="text-[#94a3b8] text-xs mt-1">Scan or search products to add</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item: any, index: number) => (
              <div key={index} className="bg-white border border-[#e2e8f0] rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-[#0f172a]">{item.name}</div>
                    <div className="text-xs text-[#64748b] mt-0.5">
                      {item.strength} • Batch: {item.batchId} • GST: {item.gstRate}%
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-[#ef4444] hover:bg-[#fef2f2] p-1 rounded"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateItem(index, { qty: Math.max(1, item.qty - 1) })}
                      className="w-7 h-7 flex items-center justify-center border border-[#cbd5e1] rounded hover:bg-[#f8fafc]"
                    >
                      <FiMinus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => onUpdateItem(index, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-12 text-center border border-[#cbd5e1] rounded py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                    />
                    <button
                      onClick={() => onUpdateItem(index, { qty: item.qty + 1 })}
                      className="w-7 h-7 flex items-center justify-center border border-[#cbd5e1] rounded hover:bg-[#f8fafc]"
                    >
                      <FiPlus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-[#64748b]">₹{item.mrp} × {item.qty}</div>
                    <div className="font-semibold text-[#0f172a]">₹{(item.qty * item.mrp).toFixed(2)}</div>
                  </div>
                </div>

                {item.discount > 0 && (
                  <div className="mt-2 text-xs text-[#10b981]">
                    Discount: -₹{item.discount}
                  </div>
                )}

                <button
                  onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                  className="mt-2 text-xs text-[#0ea5a3] flex items-center gap-1 hover:underline"
                >
                  <FiChevronDown className={`w-3 h-3 transition-transform ${expandedItem === index ? 'rotate-180' : ''}`} />
                  {expandedItem === index ? 'Less' : 'More'}
                </button>

                {expandedItem === index && (
                  <div className="mt-3 pt-3 border-t border-[#e2e8f0] space-y-2">
                    <div className="flex items-center gap-2">
                      <FiPercent className="w-3 h-3 text-[#64748b]" />
                      <input
                        type="number"
                        placeholder="Discount"
                        value={item.discount || ''}
                        onChange={(e) => onUpdateItem(index, { discount: parseFloat(e.target.value) || 0 })}
                        className="flex-1 px-2 py-1 text-xs border border-[#cbd5e1] rounded focus:outline-none focus:ring-1 focus:ring-[#0ea5a3]"
                      />
                    </div>
                    <div className="text-xs text-[#64748b]">
                      Stock: {item.stock} • Expiry: Dec 2025
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="shrink-0 border-t border-[#e2e8f0] p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#64748b]">Subtotal ({items.length} items)</span>
            <span className="font-semibold text-lg text-[#0f172a]">₹{subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={onClear}
            className="w-full py-2 text-sm text-[#ef4444] border border-[#fecaca] rounded-lg hover:bg-[#fef2f2]"
          >
            Clear Basket
          </button>
        </div>
      )}
    </div>
  );
}

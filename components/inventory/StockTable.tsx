'use client';

import React, { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiAlertCircle, FiPackage } from 'react-icons/fi';
import { BsSnow } from 'react-icons/bs';

const MOCK_STOCK = [
  {
    id: '1',
    sku: 'PAR-500-10',
    name: 'Paracetamol',
    generic: 'Acetaminophen',
    pack: '10 x 10 tablets',
    hsn: '30049099',
    batchCount: 3,
    onHand: 250,
    available: 240,
    reorderPoint: 100,
    expiringCount: 1,
    avgUsage: 45,
    supplier: 'MedSupply Co',
    batches: [
      { id: 'B-2025-01', expiry: '2025-12-15', qty: 100, location: 'A1', cost: 35, mrp: 45, daysToExpiry: 180 },
      { id: 'B-2025-11', expiry: '2026-01-20', qty: 90, location: 'A2', cost: 35, mrp: 45, daysToExpiry: 215 },
      { id: 'B-2024-33', expiry: '2025-02-10', qty: 50, location: 'B1', cost: 35, mrp: 45, daysToExpiry: 25 },
    ],
  },
  {
    id: '2',
    sku: 'ATO-10-15',
    name: 'Atorvastatin',
    generic: 'Atorvastatin Calcium',
    pack: '15 tablets',
    hsn: '30039011',
    batchCount: 2,
    onHand: 120,
    available: 120,
    reorderPoint: 50,
    expiringCount: 0,
    avgUsage: 20,
    supplier: 'PharmaCorp',
    coldChain: true,
    batches: [
      { id: 'B-2025-22', expiry: '2026-03-10', qty: 70, location: 'C1', cost: 120, mrp: 150, daysToExpiry: 280 },
      { id: 'B-2025-15', expiry: '2026-02-05', qty: 50, location: 'C2', cost: 120, mrp: 150, daysToExpiry: 245 },
    ],
  },
  {
    id: '3',
    sku: 'AMX-500-10',
    name: 'Amoxicillin',
    generic: 'Amoxicillin Trihydrate',
    pack: '10 capsules',
    hsn: '30041099',
    batchCount: 1,
    onHand: 15,
    available: 15,
    reorderPoint: 50,
    expiringCount: 0,
    avgUsage: 30,
    supplier: 'MedSupply Co',
    lowStock: true,
    batches: [
      { id: 'B-2025-08', expiry: '2026-06-20', qty: 15, location: 'D3', cost: 65, mrp: 85, daysToExpiry: 365 },
    ],
  },
];

export default function StockTable({ searchQuery, onSelectItem, selectedItem }: any) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filtered = MOCK_STOCK.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.hsn.includes(searchQuery)
  );

  return (
    <div className="h-full overflow-y-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0] z-10">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase w-8"></th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">SKU / Item</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">HSN</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Batches</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">On-hand</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Available</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Reorder</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Expiring</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Supplier</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <React.Fragment key={item.id}>
              <tr
                onClick={() => onSelectItem(item)}
                className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer group ${
                  selectedItem?.id === item.id ? 'bg-[#f0fdfa]' : ''
                } ${item.lowStock ? 'border-l-4 border-l-[#f59e0b]' : ''} ${
                  item.expiringCount > 0 ? 'border-l-4 border-l-[#ef4444]' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(item.id);
                    }}
                    className="p-1 hover:bg-[#f1f5f9] rounded"
                  >
                    {expandedRows.has(item.id) ? (
                      <FiChevronDown className="w-4 h-4 text-[#64748b]" />
                    ) : (
                      <FiChevronRight className="w-4 h-4 text-[#64748b]" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium text-[#0f172a] flex items-center gap-2">
                        {item.name}
                        {item.coldChain && <BsSnow className="w-3 h-3 text-[#3b82f6]" title="Cold chain" />}
                      </div>
                      <div className="text-xs text-[#64748b]">{item.generic} • {item.pack}</div>
                      <div className="text-xs text-[#94a3b8]">SKU: {item.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#64748b]">{item.hsn}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 bg-[#f1f5f9] text-[#64748b] text-xs rounded">{item.batchCount}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">{item.onHand}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">{item.available}</td>
                <td className="px-4 py-3 text-right">
                  <span className={item.available < item.reorderPoint ? 'text-[#ef4444] font-semibold' : 'text-[#64748b]'}>
                    {item.reorderPoint}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {item.expiringCount > 0 ? (
                    <span className="px-2 py-1 bg-[#fee2e2] text-[#991b1b] text-xs rounded flex items-center gap-1 justify-center">
                      <FiAlertCircle className="w-3 h-3" />
                      {item.expiringCount}
                    </span>
                  ) : (
                    <span className="text-[#94a3b8]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[#64748b]">{item.supplier}</td>
              </tr>

              {/* Expanded Batch Rows */}
              {expandedRows.has(item.id) && item.batches.map((batch) => (
                <tr key={batch.id} className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2 pl-12" colSpan={2}>
                    <div className="flex items-center gap-2">
                      <FiPackage className="w-3 h-3 text-[#64748b]" />
                      <span className="text-sm font-medium text-[#0f172a]">{batch.id}</span>
                      <span className="text-xs text-[#64748b]">• Location: {batch.location}</span>
                      {batch.daysToExpiry < 30 && (
                        <span className="px-2 py-0.5 bg-[#fee2e2] text-[#991b1b] text-xs rounded">
                          Expires in {batch.daysToExpiry}d
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-[#64748b]">{batch.qty}</td>
                  <td className="px-4 py-2 text-right text-sm text-[#64748b]">₹{batch.cost}</td>
                  <td className="px-4 py-2 text-right text-sm text-[#64748b]">₹{batch.mrp}</td>
                  <td className="px-4 py-2 text-sm text-[#64748b]">{batch.expiry}</td>
                  <td className="px-4 py-2"></td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64">
          <FiPackage className="w-12 h-12 text-[#cbd5e1] mb-3" />
          <p className="text-[#64748b]">No stock items found</p>
        </div>
      )}
    </div>
  );
}

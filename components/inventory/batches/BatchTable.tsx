'use client';

import React from 'react';
import { FiAlertCircle, FiThermometer } from 'react-icons/fi';
import { BsSnow } from 'react-icons/bs';

const MOCK_BATCHES = [
  {
    id: 'B-2025-01',
    sku: 'PAR-500-10',
    itemName: 'Paracetamol 500mg',
    generic: 'Acetaminophen',
    expiry: '2025-02-15',
    daysToExpiry: 25,
    qtyOnHand: 100,
    qtyAvailable: 95,
    location: 'A1',
    status: 'Active',
    lastReceived: '2024-12-01',
    supplier: 'MedSupply Co',
    cost: 35,
    mrp: 45,
  },
  {
    id: 'B-2025-22',
    sku: 'ATO-10-15',
    itemName: 'Atorvastatin 10mg',
    generic: 'Atorvastatin Calcium',
    expiry: '2026-03-10',
    daysToExpiry: 280,
    qtyOnHand: 70,
    qtyAvailable: 70,
    location: 'C1',
    status: 'Active',
    lastReceived: '2025-01-05',
    supplier: 'PharmaCorp',
    cost: 120,
    mrp: 150,
    coldChain: true,
  },
  {
    id: 'B-2024-88',
    sku: 'AMX-500-10',
    itemName: 'Amoxicillin 500mg',
    generic: 'Amoxicillin Trihydrate',
    expiry: '2025-01-20',
    daysToExpiry: 5,
    qtyOnHand: 30,
    qtyAvailable: 0,
    location: 'D3',
    status: 'Quarantine',
    lastReceived: '2024-11-15',
    supplier: 'MedSupply Co',
    cost: 65,
    mrp: 85,
    tempBreach: true,
  },
];

export default function BatchTable({ searchQuery, onSelectBatch, selectedBatch }: any) {
  const filtered = MOCK_BATCHES.filter(batch =>
    batch.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getExpiryColor = (days: number) => {
    if (days < 7) return 'bg-[#fee2e2] text-[#991b1b]';
    if (days < 30) return 'bg-[#fed7aa] text-[#9a3412]';
    if (days < 90) return 'bg-[#fef3c7] text-[#92400e]';
    return 'bg-[#f1f5f9] text-[#64748b]';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Quarantine') return 'border-[#ef4444] text-[#ef4444] bg-[#fef2f2]';
    if (status === 'Recalled') return 'border-[#dc2626] text-[#dc2626] bg-[#fee2e2]';
    if (status === 'Reserved') return 'border-[#f59e0b] text-[#f59e0b] bg-[#fef3c7]';
    return 'border-[#10b981] text-[#10b981] bg-[#d1fae5]';
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0] z-10">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase w-8">
              <input type="checkbox" className="w-4 h-4 rounded" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Batch ID</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">SKU / Item</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Expiry</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">On-hand</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Available</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Location</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Supplier</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((batch) => (
            <tr
              key={batch.id}
              onClick={() => onSelectBatch(batch)}
              className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer group ${
                selectedBatch?.id === batch.id ? 'bg-[#f0fdfa]' : ''
              } ${batch.daysToExpiry < 7 ? 'border-l-4 border-l-[#ef4444]' : ''}`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded"
                />
              </td>
              <td className="px-4 py-3">
                <span className="font-semibold text-[#0f172a]">{batch.id}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium text-[#0f172a] flex items-center gap-2">
                      {batch.itemName}
                      {batch.coldChain && <BsSnow className="w-3 h-3 text-[#3b82f6]" title="Cold chain" />}
                      {batch.tempBreach && <FiThermometer className="w-3 h-3 text-[#ef4444]" title="Temp breach" />}
                    </div>
                    <div className="text-xs text-[#64748b]">{batch.generic} • {batch.sku}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="text-sm text-[#0f172a]">{batch.expiry}</div>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded mt-1 ${getExpiryColor(batch.daysToExpiry)}`}>
                    {batch.daysToExpiry}d
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">{batch.qtyOnHand}</td>
              <td className="px-4 py-3 text-right font-semibold text-[#0ea5a3]">{batch.qtyAvailable}</td>
              <td className="px-4 py-3 text-sm text-[#64748b]">{batch.location}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getStatusColor(batch.status)}`}>
                  {batch.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-[#64748b]">{batch.supplier}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64">
          <FiAlertCircle className="w-12 h-12 text-[#cbd5e1] mb-3" />
          <p className="text-[#64748b]">No batches found</p>
        </div>
      )}
    </div>
  );
}

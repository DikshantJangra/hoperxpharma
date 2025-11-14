'use client';

import React from 'react';
import { FiShoppingCart, FiEdit2, FiTrendingUp } from 'react-icons/fi';
import { BsLightningChargeFill } from 'react-icons/bs';

const MOCK_FORECAST = [
  {
    id: '1',
    sku: 'PAR-500-10',
    name: 'Paracetamol 500mg',
    currentStock: 250,
    inTransit: 0,
    reserved: 10,
    avgDailySales: 12,
    forecastDemand14: 192,
    forecastDemand30: 420,
    runOutDays: 18.5,
    reorderQty: 220,
    confidence: 88,
    trend: [8, 10, 12, 14, 12, 11, 13],
  },
  {
    id: '2',
    sku: 'ATO-10-15',
    name: 'Atorvastatin 10mg',
    currentStock: 120,
    inTransit: 50,
    reserved: 0,
    avgDailySales: 8,
    forecastDemand14: 128,
    forecastDemand30: 280,
    runOutDays: 15,
    reorderQty: 150,
    confidence: 92,
    trend: [7, 8, 9, 8, 7, 8, 9],
  },
  {
    id: '3',
    sku: 'ORS-SACHET',
    name: 'ORS Sachet',
    currentStock: 45,
    inTransit: 0,
    reserved: 5,
    avgDailySales: 18,
    forecastDemand14: 280,
    forecastDemand30: 650,
    runOutDays: 2.2,
    reorderQty: 500,
    confidence: 95,
    trend: [15, 16, 18, 20, 22, 19, 18],
    seasonal: true,
  },
];

export default function ForecastTable({ forecastWindow, onSelectSKU, selectedSKU }: any) {
  const getRunOutColor = (days: number) => {
    if (days < 7) return 'text-[#ef4444] font-bold';
    if (days < 14) return 'text-[#f59e0b] font-semibold';
    return 'text-[#10b981]';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-[#10b981]';
    if (confidence >= 75) return 'text-[#f59e0b]';
    return 'text-[#ef4444]';
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0] z-10">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">SKU / Item</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Current Stock</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Avg Daily</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">
              Forecast ({forecastWindow}d)
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Run-out In</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Reorder Qty</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Confidence</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_FORECAST.map((item) => (
            <tr
              key={item.id}
              onClick={() => onSelectSKU(item)}
              className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer group ${
                selectedSKU?.id === item.id ? 'bg-[#f0fdfa]' : ''
              } ${item.runOutDays < 7 ? 'border-l-4 border-l-[#ef4444]' : ''}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium text-[#0f172a] flex items-center gap-2">
                      {item.name}
                      {item.seasonal && (
                        <span className="px-1.5 py-0.5 bg-[#f3e8ff] text-[#8b5cf6] text-xs rounded">
                          Seasonal
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#64748b]">{item.sku}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="font-semibold text-[#0f172a]">{item.currentStock}</div>
                {item.inTransit > 0 && (
                  <div className="text-xs text-[#64748b]">+{item.inTransit} transit</div>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="font-semibold text-[#0f172a]">{item.avgDailySales}</div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {item.trend.map((val, idx) => (
                    <div
                      key={idx}
                      className="w-1 bg-[#0ea5a3] rounded-full"
                      style={{ height: `${(val / 25) * 20}px` }}
                    />
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="font-bold text-[#8b5cf6]">
                  {forecastWindow === '14' ? item.forecastDemand14 : item.forecastDemand30}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className={getRunOutColor(item.runOutDays)}>
                  {item.runOutDays.toFixed(1)}d
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <BsLightningChargeFill className="w-3 h-3 text-[#8b5cf6]" />
                  <span className="font-semibold text-[#0f172a]">{item.reorderQty}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="ml-1 p-1 hover:bg-[#f1f5f9] rounded"
                  >
                    <FiEdit2 className="w-3 h-3 text-[#64748b]" />
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`font-semibold ${getConfidenceColor(item.confidence)}`}>
                  {item.confidence}%
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="px-3 py-1.5 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-1 text-xs font-medium mx-auto"
                >
                  <FiShoppingCart className="w-3 h-3" />
                  Create PO
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

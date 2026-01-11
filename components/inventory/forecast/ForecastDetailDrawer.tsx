'use client';

import { useState } from 'react';
import { FiX, FiShoppingCart, FiTrendingUp, FiInfo } from 'react-icons/fi';
import { formatUnitName } from '@/lib/utils/stock-display';
import { BsLightningChargeFill } from 'react-icons/bs';

export default function ForecastDetailDrawer({ sku, forecastWindow, onClose }: any) {
  const [chartView, setChartView] = useState<'7' | '14' | '30' | '60'>('14');

  const mockChartData = Array.from({ length: parseInt(chartView) }, (_, i) => ({
    day: i + 1,
    historical: Math.floor(Math.random() * 5) + 8,
    predicted: Math.floor(Math.random() * 5) + 10,
    safety: 5,
  }));

  return (
    <div className="w-[45%] bg-white border-l border-[#e2e8f0] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#e2e8f0] flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-[#0f172a]">{sku.name}</h2>
          <p className="text-sm text-[#64748b]">SKU: {sku.sku}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-lg">
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary */}
        <div className="bg-[#f8fafc] rounded-lg p-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-[#64748b] mb-1">Current Stock</p>
              <p className="text-xl font-bold text-[#0f172a]">{sku.currentStock}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748b] mb-1">In Transit</p>
              <p className="text-xl font-bold text-[#0ea5a3]">{sku.inTransit}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748b] mb-1">Reserved</p>
              <p className="text-xl font-bold text-[#f59e0b]">{sku.reserved}</p>
            </div>
          </div>
        </div>

        {/* Forecast Graph */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#0f172a]">Demand Forecast</h3>
            <div className="flex gap-1">
              {['7', '14', '30', '60'].map((days) => (
                <button
                  key={days}
                  onClick={() => setChartView(days as any)}
                  className={`px-2 py-1 text-xs rounded ${chartView === days
                      ? 'bg-[#0ea5a3] text-white'
                      : 'bg-[#f1f5f9] text-[#64748b]'
                    }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Simple Chart */}
          <div className="h-48 flex items-end gap-1">
            {mockChartData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-[#8b5cf6] rounded-t"
                  style={{ height: `${(data.predicted / 15) * 100}%` }}
                />
                <div
                  className="w-full bg-[#0ea5a3] rounded-t"
                  style={{ height: `${(data.historical / 15) * 100}%` }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#0ea5a3] rounded" />
              <span className="text-[#64748b]">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#8b5cf6] rounded" />
              <span className="text-[#64748b]">Predicted</span>
            </div>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="bg-[#f3e8ff] border border-[#e9d5ff] rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <BsLightningChargeFill className="w-4 h-4 text-[#8b5cf6] mt-0.5 shrink-0" />
            <h3 className="text-sm font-semibold text-[#6b21a8]">AI Reasoning</h3>
          </div>
          <div className="space-y-2 text-xs text-[#6b21a8]">
            <div className="flex justify-between">
              <span>Avg daily sale:</span>
              <span className="font-semibold">{sku.avgDailySales} <span className="text-[10px] opacity-70 uppercase">{formatUnitName(sku.baseUnit || sku.unit || 'unit')}</span></span>
            </div>
            <div className="flex justify-between">
              <span>Seasonal adjustment:</span>
              <span className="font-semibold">+30%</span>
            </div>
            <div className="flex justify-between">
              <span>Lead time:</span>
              <span className="font-semibold">7 days</span>
            </div>
            <div className="flex justify-between">
              <span>Safety stock:</span>
              <span className="font-semibold">{sku.safetyStock || 84} <span className="text-[10px] opacity-70 uppercase">{formatUnitName(sku.baseUnit || sku.unit || 'unit')}</span></span>
            </div>
            <div className="flex justify-between">
              <span>Expiry adjustment:</span>
              <span className="font-semibold">-3%</span>
            </div>
            <div className="border-t border-[#e9d5ff] pt-2 mt-2 flex justify-between font-bold">
              <span>Final predicted demand:</span>
              <span>{sku.forecastDemand14} <span className="text-[10px] opacity-70 uppercase">{formatUnitName(sku.baseUnit || sku.unit || 'unit')}</span></span>
            </div>
          </div>
        </div>

        {/* Seasonality */}
        {sku.seasonal && (
          <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <FiTrendingUp className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
              <h3 className="text-sm font-semibold text-[#92400e]">Seasonal Pattern Detected</h3>
            </div>
            <p className="text-xs text-[#92400e]">
              Summer → ORS demand typically increases by 40-50% during hot months
            </p>
          </div>
        )}

        {/* Supplier Info */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[#64748b] mb-3">Supplier Prediction</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#64748b]">Supplier:</span>
              <span className="font-medium text-[#0f172a]">ABC Pharma</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Typical delay:</span>
              <span className="font-medium text-[#0f172a]">+2 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Reliability:</span>
              <span className="font-medium text-[#0f172a]">82%</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#e2e8f0]">
              <span className="text-[#64748b]">Recommended qty:</span>
              <span className="font-bold text-[#0ea5a3]">{sku.reorderQty} <span className="text-[10px] opacity-70 uppercase">{formatUnitName(sku.baseUnit || sku.unit || 'unit')}</span></span>
            </div>
          </div>
        </div>

        {/* Confidence Explanation */}
        <div className="bg-[#f8fafc] rounded-lg p-3 flex items-start gap-2">
          <FiInfo className="w-4 h-4 text-[#64748b] mt-0.5 shrink-0" />
          <div className="text-xs text-[#64748b]">
            <span className="font-semibold">Confidence: {sku.confidence}%</span>
            <p className="mt-1">Based on 12-month trend analysis, local consumption patterns, and seasonal adjustments</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-[#e2e8f0] p-4">
        <button className="w-full py-3 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center justify-center gap-2 font-medium">
          <FiShoppingCart className="w-4 h-4" />
          Create PO ({sku.reorderQty} {formatUnitName(sku.baseUnit || sku.unit || 'unit')}s)
        </button>
      </div>
    </div>
  );
}

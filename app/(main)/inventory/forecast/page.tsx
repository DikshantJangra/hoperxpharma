'use client';

import { useState } from 'react';
import { FiRefreshCw, FiDownload, FiSettings } from 'react-icons/fi';
import { BsLightningChargeFill } from 'react-icons/bs';
import ForecastKPIs from '@/components/inventory/forecast/ForecastKPIs';
import ForecastTable from '@/components/inventory/forecast/ForecastTable';
import ForecastDetailDrawer from '@/components/inventory/forecast/ForecastDetailDrawer';

export default function ForecastPage() {
  const [selectedSKU, setSelectedSKU] = useState<any>(null);
  const [forecastWindow, setForecastWindow] = useState<'7' | '14' | '30' | '60' | '90'>('14');

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Forecast</h1>
            <p className="text-sm text-[#64748b]">Inventory › Forecast</p>
            <p className="text-xs text-[#94a3b8] mt-1">
              Predictions powered by 12-month trends, POS velocity, expiry adjustments & seasonal patterns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm">
              <FiSettings className="w-4 h-4" />
              Settings
            </button>
            <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm">
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <button className="px-3 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm">
              <FiRefreshCw className="w-4 h-4" />
              Refresh Forecast
            </button>
          </div>
        </div>

        {/* Date Range Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#64748b]">Forecast Window:</span>
          {['7', '14', '30', '60', '90'].map((days) => (
            <button
              key={days}
              onClick={() => setForecastWindow(days as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                forecastWindow === days
                  ? 'bg-[#0ea5a3] text-white'
                  : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
              }`}
            >
              {days} days
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-[#64748b]">
            <BsLightningChargeFill className="w-3 h-3 text-[#8b5cf6]" />
            Model updated 2 hours ago
          </div>
        </div>
      </div>

      {/* KPIs */}
      <ForecastKPIs forecastWindow={forecastWindow} />

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`${selectedSKU ? 'w-[55%]' : 'flex-1'} transition-all`}>
          <ForecastTable
            forecastWindow={forecastWindow}
            onSelectSKU={setSelectedSKU}
            selectedSKU={selectedSKU}
          />
        </div>

        {selectedSKU && (
          <ForecastDetailDrawer
            sku={selectedSKU}
            forecastWindow={forecastWindow}
            onClose={() => setSelectedSKU(null)}
          />
        )}
      </div>
    </div>
  );
}

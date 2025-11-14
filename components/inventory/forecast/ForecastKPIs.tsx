'use client';

import { FiAlertTriangle, FiShoppingCart, FiTrendingUp, FiTarget } from 'react-icons/fi';
import { BsLightningChargeFill } from 'react-icons/bs';

export default function ForecastKPIs({ forecastWindow }: any) {
  const kpis = [
    {
      icon: FiAlertTriangle,
      label: `Stock-out Risk (Next ${forecastWindow}d)`,
      value: '27 SKUs',
      subtext: 'at risk',
      color: 'text-[#ef4444]',
      bg: 'bg-[#fee2e2]',
      cta: 'View risks',
    },
    {
      icon: FiShoppingCart,
      label: 'Reorder Needed This Week',
      value: '₹48,200',
      subtext: 'total order value',
      color: 'text-[#f59e0b]',
      bg: 'bg-[#fef3c7]',
      cta: 'Generate PO',
    },
    {
      icon: FiTrendingUp,
      label: 'Predicted High-Demand',
      value: '6 SKUs',
      subtext: 'ORS, Vitamin D, Amoxicillin',
      color: 'text-[#0ea5a3]',
      bg: 'bg-[#f0fdfa]',
      cta: 'View list',
    },
    {
      icon: BsLightningChargeFill,
      label: 'Seasonal Surge Detected',
      value: '+32%',
      subtext: 'Cough & Cold medicines',
      color: 'text-[#8b5cf6]',
      bg: 'bg-[#f3e8ff]',
      cta: 'See trends',
    },
    {
      icon: FiTarget,
      label: 'AI Forecast Accuracy',
      value: '92.4%',
      subtext: 'last 30 days',
      color: 'text-[#10b981]',
      bg: 'bg-[#d1fae5]',
      cta: null,
    },
  ];

  return (
    <div className="p-4 bg-white border-b border-[#e2e8f0]">
      <div className="grid grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <div className="mb-2">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-[#64748b] mt-1">{kpi.subtext}</div>
            </div>
            <div className="text-xs font-medium text-[#64748b] mb-2">{kpi.label}</div>
            {kpi.cta && (
              <button className="text-xs text-[#0ea5a3] hover:underline font-medium">
                {kpi.cta} →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

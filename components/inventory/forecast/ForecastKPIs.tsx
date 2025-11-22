'use client';

import { FiAlertTriangle, FiShoppingCart, FiTrendingUp, FiDollarSign, FiTarget } from 'react-icons/fi';
import { BsLightningChargeFill } from 'react-icons/bs';

export default function ForecastKPIs({ forecastWindow }: any) {
  const kpis = [
    {
      label: 'Forecasted Demand',
      value: '0 units',
      change: '+0%',
      trend: 'neutral',
      icon: FiTrendingUp,
      color: 'blue'
    },
    {
      label: 'Est. Revenue Impact',
      value: '₹0',
      change: '+0%',
      trend: 'neutral',
      icon: FiDollarSign,
      color: 'emerald'
    },
    {
      label: 'Stockout Risk',
      value: '0 items',
      change: 'Low',
      trend: 'neutral',
      icon: FiAlertTriangle,
      color: 'amber'
    },
    {
      label: 'Reorder Value',
      value: '₹0',
      change: 'Pending',
      trend: 'neutral',
      icon: FiShoppingCart,
      color: 'purple'
    }
  ];

  return (
    <div className="p-4 bg-white border-b border-[#e2e8f0]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-[#f1f5f9] bg-white hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${kpi.trend === 'up'
                    ? 'bg-emerald-50 text-emerald-700'
                    : kpi.trend === 'down'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
              >
                {kpi.change}
              </span>
            </div>
            <div>
              <div className="text-sm text-[#64748b] mb-1">{kpi.label}</div>
              <div className="text-2xl font-bold text-[#0f172a]">{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

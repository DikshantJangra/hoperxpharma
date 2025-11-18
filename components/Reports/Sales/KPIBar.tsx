'use client';

import React from 'react';
import { SalesKPIs } from '@/types/reports';
import { HiOutlineCurrencyRupee, HiOutlineShoppingCart, HiOutlineReceiptRefund, HiOutlineArrowTrendingUp } from 'react-icons/hi2';

interface KPIBarProps {
  kpis: SalesKPIs;
  onKPIClick: (kpi: string) => void;
}

export default function KPIBar({ kpis, onKPIClick }: KPIBarProps) {
  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;
  const formatDelta = (delta: number) => {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}%`;
  };

  const kpiCards = [
    {
      id: 'revenue',
      label: 'Revenue',
      value: formatCurrency(kpis.revenue),
      delta: kpis.delta.revenue,
      icon: HiOutlineCurrencyRupee,
      color: 'blue'
    },
    {
      id: 'orders',
      label: 'Orders',
      value: kpis.orders.toLocaleString(),
      delta: kpis.delta.orders,
      icon: HiOutlineShoppingCart,
      color: 'green'
    },
    {
      id: 'aov',
      label: 'AOV',
      value: formatCurrency(kpis.aov),
      delta: kpis.delta.aov,
      icon: HiOutlineArrowTrendingUp,
      color: 'purple'
    },
    {
      id: 'refunds',
      label: 'Refunds',
      value: formatCurrency(kpis.refunds),
      delta: kpis.delta.refunds,
      icon: HiOutlineReceiptRefund,
      color: 'red'
    }
  ];

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map(card => {
          const Icon = card.icon;
          const deltaColor = card.delta >= 0 ? 'text-green-600' : 'text-red-600';
          
          return (
            <button
              key={card.id}
              onClick={() => onKPIClick(card.id)}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{card.label}</span>
                <Icon className={`h-5 w-5 text-${card.color}-600`} />
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">{card.value}</div>
              <div className={`text-sm font-medium ${deltaColor}`}>
                {formatDelta(card.delta)} vs prev period
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

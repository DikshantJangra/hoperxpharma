'use client';

import React from 'react';
import { KPIMetrics } from '@/lib/api/salesAnalytics';
import {
    HiOutlineCurrencyRupee,
    HiOutlineShoppingCart,
    HiOutlineReceiptRefund,
    HiOutlineArrowTrendingUp,
    HiOutlineUsers
} from 'react-icons/hi2';

interface EnhancedKPIBarProps {
    kpis: KPIMetrics;
    onKPIClick?: (kpi: string) => void;
}

export default function EnhancedKPIBar({ kpis, onKPIClick }: EnhancedKPIBarProps) {
    const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    const formatNumber = (num: number) => num.toLocaleString('en-IN');

    const formatDelta = (delta: number) => {
        const sign = delta >= 0 ? '+' : '';
        const formatted = `${sign}${delta.toFixed(1)}%`;
        return { formatted, isPositive: delta >= 0 };
    };

    const kpiCards = [
        {
            id: 'revenue',
            label: 'Total Revenue',
            value: formatCurrency(kpis.revenue),
            subText: `Avg ₹${formatCurrency(kpis.avgOrdersPerDay)}/day`,
            delta: kpis.delta.revenue,
            icon: HiOutlineCurrencyRupee,
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            borderColor: 'border-blue-200'
        },
        {
            id: 'orders',
            label: 'Orders',
            value: formatNumber(kpis.orders),
            subText: `${kpis.avgOrdersPerHour.toFixed(1)} orders/hour`,
            delta: kpis.delta.orders,
            icon: HiOutlineShoppingCart,
            color: 'green',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
            borderColor: 'border-green-200'
        },
        {
            id: 'aov',
            label: 'Average Order Value',
            value: formatCurrency(kpis.aov),
            subText: kpis.delta.aov < 0 ? 'Discounts impacted AOV' : 'Healthy avg',
            delta: kpis.delta.aov,
            icon: HiOutlineArrowTrendingUp,
            color: 'purple',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
            borderColor: 'border-purple-200'
        },
        {
            id: 'customers',
            label: 'Customers',
            value: formatNumber(kpis.customers),
            subText: `New: ${kpis.newCustomers} | Returning: ${kpis.returningCustomers}`,
            delta: 0, // Customer delta not calculated yet
            icon: HiOutlineUsers,
            color: 'indigo',
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            borderColor: 'border-indigo-200',
            hideDelta: true
        },
        {
            id: 'refunds',
            label: 'Refunds / Returns',
            value: kpis.refunds === 0 && kpis.orders > 10 ? '₹0' : formatCurrency(kpis.refunds),
            subText: kpis.refunds === 0 && kpis.orders > 10 ? '🟢 Healthy' : `${kpis.returnRate.toFixed(1)}% return rate`,
            delta: 0,
            icon: HiOutlineReceiptRefund,
            color: kpis.returnRate > 5 ? 'red' : 'gray',
            bgColor: kpis.returnRate > 5 ? 'bg-red-50' : 'bg-gray-50',
            iconColor: kpis.returnRate > 5 ? 'text-red-600' : 'text-gray-600',
            borderColor: kpis.returnRate > 5 ? 'border-red-200' : 'border-gray-200',
            hideDelta: true
        }
    ];

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-5">
            <div className="grid grid-cols-5 gap-4">
                {kpiCards.map(card => {
                    const Icon = card.icon;
                    const delta = formatDelta(card.delta);
                    const deltaColor = delta.isPositive ? 'text-green-600' : 'text-red-600';
                    const deltaIcon = delta.isPositive ? '▲' : '▼';

                    return (
                        <button
                            key={card.id}
                            onClick={() => onKPIClick?.(card.id)}
                            className={`${card.bgColor} border ${card.borderColor} p-4 rounded-lg hover:shadow-md transition-all duration-200 text-left transform hover:-translate-y-0.5`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs uppercase tracking-wider text-gray-600 font-semibold">
                                    {card.label}
                                </span>
                                <div className={`p-2 rounded-lg ${card.bgColor} ${card.borderColor} border`}>
                                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                                </div>
                            </div>

                            {/* Value */}
                            <div className="text-2xl font-bold text-gray-900 mb-1 tabular-nums">
                                {card.value}
                            </div>

                            {/* Delta or Sub-text */}
                            {!card.hideDelta && card.delta !== 0 ? (
                                <div className={`text-sm font-semibold ${deltaColor} flex items-center gap-1`}>
                                    <span>{deltaIcon}</span>
                                    <span>{delta.formatted}</span>
                                    <span className="text-gray-500 font-normal">vs previous</span>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-600">
                                    {card.subText}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

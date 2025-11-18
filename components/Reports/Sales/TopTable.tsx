'use client';

import React, { useState } from 'react';
import { BreakdownItem } from '@/types/reports';
import { HiOutlineArrowUp, HiOutlineArrowDown } from 'react-icons/hi2';

interface TopTableProps {
  items: BreakdownItem[];
  title: string;
  onRowClick?: (item: BreakdownItem) => void;
}

export default function TopTable({ items, title, onRowClick }: TopTableProps) {
  const [sortBy, setSortBy] = useState<'revenue' | 'orders'>('revenue');
  
  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;
  
  const sorted = [...items].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, 10);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('revenue')}
            className={`text-xs px-2 py-1 rounded ${sortBy === 'revenue' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
          >
            Revenue
          </button>
          <button
            onClick={() => setSortBy('orders')}
            className={`text-xs px-2 py-1 rounded ${sortBy === 'orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
          >
            Orders
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trend</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sorted.map((item, idx) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(item.revenue)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{item.orders}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className={`inline-flex items-center gap-1 ${item.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.delta >= 0 ? <HiOutlineArrowUp className="h-3 w-3" /> : <HiOutlineArrowDown className="h-3 w-3" />}
                    {Math.abs(item.delta).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <svg width="60" height="20" className="inline-block">
                    <polyline
                      fill="none"
                      stroke={item.delta >= 0 ? '#10b981' : '#ef4444'}
                      strokeWidth="1.5"
                      points={item.trend.map((val, i) => `${i * 12},${20 - val * 15}`).join(' ')}
                    />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

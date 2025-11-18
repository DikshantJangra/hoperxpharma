'use client';

import React from 'react';
import { SeriesDataPoint } from '@/types/reports';

interface TrendChartProps {
  series: SeriesDataPoint[];
  onPointClick?: (point: SeriesDataPoint) => void;
}

export default function TrendChart({ series, onPointClick }: TrendChartProps) {
  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  
  if (series.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...series.map(s => s.revenue));
  const minRevenue = Math.min(...series.map(s => s.revenue));
  const range = maxRevenue - minRevenue;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Revenue Trend</h3>
      
      <div className="relative h-64">
        <svg className="w-full h-full">
          {/* Y-axis labels */}
          <text x="10" y="20" className="text-xs fill-gray-500">{formatCurrency(maxRevenue)}</text>
          <text x="10" y="250" className="text-xs fill-gray-500">{formatCurrency(minRevenue)}</text>
          
          {/* Line chart */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={series.map((point, i) => {
              const x = 60 + (i * (100 / series.length) * 8);
              const y = 240 - ((point.revenue - minRevenue) / range) * 220;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {series.map((point, i) => {
            const x = 60 + (i * (100 / series.length) * 8);
            const y = 240 - ((point.revenue - minRevenue) / range) * 220;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3b82f6"
                  className="cursor-pointer hover:r-6"
                  onClick={() => onPointClick?.(point)}
                >
                  <title>{`${point.date}: ${formatCurrency(point.revenue)}`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { HiOutlineLightBulb, HiOutlineExclamationTriangle, HiOutlineArrowDownTray } from 'react-icons/hi2';

interface InsightPanelProps {
  onDrillClick: () => void;
  onExportClick: () => void;
}

export default function InsightPanel({ onDrillClick, onExportClick }: InsightPanelProps) {
  const insights = [
    {
      type: 'positive',
      title: 'Strong Growth',
      message: 'Revenue up 15% vs last period driven by Store 1 performance',
      icon: HiOutlineLightBulb,
      color: 'green'
    },
    {
      type: 'warning',
      title: 'Anomaly Detected',
      message: 'Unusually high returns on Nov 12 - investigate return codes',
      icon: HiOutlineExclamationTriangle,
      color: 'yellow'
    }
  ];

  return (
    <div className="bg-white border-l border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Insights</h3>
        <div className="space-y-3">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  insight.color === 'green' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`h-5 w-5 mt-0.5 ${
                    insight.color === 'green' ? 'text-green-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <div className={`text-sm font-medium ${
                      insight.color === 'green' ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      {insight.title}
                    </div>
                    <div className={`text-xs mt-1 ${
                      insight.color === 'green' ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {insight.message}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={onDrillClick}
            className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            View Transactions
          </button>
          <button
            onClick={onExportClick}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <HiOutlineArrowDownTray className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Period Comparison</h3>
        <div className="text-xs text-gray-600">
          <div className="flex justify-between mb-1">
            <span>Current Period</span>
            <span className="font-medium text-gray-900">₹2.45L</span>
          </div>
          <div className="flex justify-between">
            <span>Previous Period</span>
            <span className="font-medium text-gray-900">₹2.13L</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { FiFileText, FiUser, FiActivity, FiRefreshCw } from 'react-icons/fi';

interface HistoryStatsProps {
  stats: {
    totalEvents: number;
    prescriptions: number;
    visits: number;
    labResults: number;
    refills: number;
  };
}

export default function HistoryStats({ stats }: HistoryStatsProps) {
  const statItems = [
    {
      label: 'Total Events',
      value: stats.totalEvents,
      icon: FiActivity,
      color: 'text-gray-600'
    },
    {
      label: 'Prescriptions',
      value: stats.prescriptions,
      icon: FiFileText,
      color: 'text-blue-600'
    },
    {
      label: 'Visits',
      value: stats.visits,
      icon: FiUser,
      color: 'text-green-600'
    },
    {
      label: 'Refills',
      value: stats.refills,
      icon: FiRefreshCw,
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-4">History Overview</h3>
      <div className="grid grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="text-center">
            <div className={`w-8 h-8 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="text-lg font-semibold text-gray-900">{item.value}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
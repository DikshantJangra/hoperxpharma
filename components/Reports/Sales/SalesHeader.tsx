'use client';

import React from 'react';
import { DatePreset } from '@/types/reports';
import { HiOutlineCalendar, HiOutlineArrowDownTray, HiOutlineClock, HiOutlineShare } from 'react-icons/hi2';

interface SalesHeaderProps {
  dateRange: { from: string; to: string };
  onDateChange: (from: string, to: string) => void;
  onPresetClick: (preset: DatePreset) => void;
  onExportClick: () => void;
  onScheduleClick: () => void;
}

export default function SalesHeader({ dateRange, onDateChange, onPresetClick, onExportClick, onScheduleClick }: SalesHeaderProps) {
  const presets: { id: DatePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7d' },
    { id: '30d', label: '30d' },
    { id: 'mtd', label: 'MTD' },
    { id: 'lastMonth', label: 'Last Month' }
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Sales Report</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => onPresetClick(preset.id)}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <HiOutlineCalendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => onDateChange(e.target.value, dateRange.to)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => onDateChange(dateRange.from, e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onScheduleClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <HiOutlineClock className="h-4 w-4" />
              Schedule
            </button>
            <button
              onClick={onExportClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <HiOutlineArrowDownTray className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

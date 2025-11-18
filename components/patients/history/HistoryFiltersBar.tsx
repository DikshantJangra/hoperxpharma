'use client';

import React from 'react';
import { FiFilter, FiCalendar, FiSearch, FiX } from 'react-icons/fi';
import { HistoryFilters } from '@/hooks/usePatientHistory';

interface HistoryFiltersBarProps {
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
}

const EVENT_TYPES = [
  { value: 'prescription', label: 'Prescriptions' },
  { value: 'visit', label: 'Visits' },
  { value: 'lab', label: 'Lab Results' },
  { value: 'allergy', label: 'Allergies' },
  { value: 'note', label: 'Notes' },
  { value: 'refill', label: 'Refills' }
];

export default function HistoryFiltersBar({ filters, onChange }: HistoryFiltersBarProps) {
  const hasActiveFilters = filters.types.length > 0 || filters.search || filters.dateRange;

  const clearFilters = () => {
    onChange({
      dateRange: null,
      types: [],
      providers: [],
      search: ""
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search history..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-400 w-4 h-4" />
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>All Time</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last Year</option>
          </select>
        </div>

        {/* Event Types */}
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400 w-4 h-4" />
          <select 
            multiple
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.types}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              onChange({ ...filters, types: values });
            }}
          >
            {EVENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <FiX className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {filters.types.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">Showing:</span>
          {filters.types.map(type => (
            <span
              key={type}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {EVENT_TYPES.find(t => t.value === type)?.label}
              <button
                onClick={() => onChange({ 
                  ...filters, 
                  types: filters.types.filter(t => t !== type) 
                })}
                className="hover:text-blue-900"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
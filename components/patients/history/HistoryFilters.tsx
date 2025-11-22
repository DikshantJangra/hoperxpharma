'use client';

import React from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import type { HistoryFilters } from '@/hooks/usePatientHistory';

interface HistoryFiltersProps {
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
}

const EVENT_TYPES = [
  { value: 'PRESCRIPTION_CREATED', label: 'Prescriptions' },
  { value: 'DISPENSE', label: 'Dispenses' },
  { value: 'INVOICE', label: 'Invoices' },
  { value: 'VISIT', label: 'Visits' },
  { value: 'LAB_RESULT', label: 'Lab Results' },
  { value: 'MESSAGE', label: 'Messages' },
  { value: 'NOTE', label: 'Notes' },
  { value: 'CONSENT', label: 'Consents' }
];

const TAGS = [
  { value: 'critical', label: 'Critical' },
  { value: 'sensitive', label: 'Sensitive' },
  { value: 'requires-action', label: 'Requires Action' }
];

export default function HistoryFilters({ filters, onChange }: HistoryFiltersProps) {
  const hasActiveFilters = filters.types.length > 0 || filters.tags.length > 0 || filters.actor;

  const clearFilters = () => {
    onChange({
      types: [],
      search: filters.search,
      tags: [],
      actor: undefined
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <FiX className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Event Types */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Type</label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {EVENT_TYPES.map(type => (
              <label key={type.value} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.types.includes(type.value)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...filters.types, type.value]
                      : filters.types.filter(t => t !== type.value);
                    onChange({ ...filters, types: newTypes });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Date Range</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.from || ''}
              onChange={(e) => onChange({ ...filters, from: e.target.value })}
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.to || ''}
              onChange={(e) => onChange({ ...filters, to: e.target.value })}
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
          <div className="space-y-1">
            {TAGS.map(tag => (
              <label key={tag.value} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.tags.includes(tag.value)}
                  onChange={(e) => {
                    const newTags = e.target.checked
                      ? [...filters.tags, tag.value]
                      : filters.tags.filter(t => t !== tag.value);
                    onChange({ ...filters, tags: newTags });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                {tag.label}
              </label>
            ))}
          </div>
        </div>

        {/* Actor Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Actor</label>
          <select
            value={filters.actor || ''}
            onChange={(e) => onChange({ ...filters, actor: e.target.value || undefined })}
            className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All users</option>
            <option value="u_aman">Aman (Pharmacist)</option>
            <option value="u_reception1">Reception1</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>
    </div>
  );
}
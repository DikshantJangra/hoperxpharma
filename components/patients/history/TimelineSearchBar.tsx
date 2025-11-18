'use client';

import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

interface TimelineSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TimelineSearchBar({ value, onChange }: TimelineSearchBarProps) {
  const [focused, setFocused] = useState(false);

  const handleSearch = (searchValue: string) => {
    if (searchValue.length <= 256) {
      onChange(searchValue);
      // Telemetry
      if (searchValue.length > 0) {
        console.log('patient.history.search', { queryLength: searchValue.length });
      }
    }
  };

  const clearSearch = () => {
    onChange('');
  };

  return (
    <div className="relative">
      <div className={`relative flex items-center border rounded-lg transition-colors ${
        focused ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'
      }`}>
        <FiSearch className="absolute left-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search notes, messages, prescriptions…"
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={256}
          className="w-full pl-10 pr-10 py-2 text-sm bg-transparent focus:outline-none"
        />
        {value && (
          <button
            onClick={clearSearch}
            className="absolute right-3 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {value.length > 240 && (
        <div className="mt-1 text-xs text-orange-600">
          {256 - value.length} characters remaining
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface JumpToDateCalendarProps {
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

export default function JumpToDateCalendar({ onDateSelect, onClose }: JumpToDateCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date.toISOString().split('T')[0]);
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Jump to Date</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close calendar"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-gray-900">{monthYear}</span>
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-xs text-gray-500 text-center py-1 font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <button
            key={index}
            onClick={() => date && handleDateClick(date)}
            disabled={!date}
            className={`text-xs py-1 text-center rounded hover:bg-gray-100 ${
              date ? 'text-gray-900' : 'text-transparent'
            } ${
              date && date.toDateString() === new Date().toDateString()
                ? 'bg-blue-100 text-blue-700 font-medium'
                : ''
            }`}
          >
            {date ? date.getDate() : ''}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onDateSelect(new Date().toISOString().split('T')[0])}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          >
            Today
          </button>
          <button
            onClick={() => {
              const lastWeek = new Date();
              lastWeek.setDate(lastWeek.getDate() - 7);
              onDateSelect(lastWeek.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
          >
            Last Week
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, includeRaw: boolean) => void;
}

export default function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [includeRaw, setIncludeRaw] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(format, includeRaw);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Export current view</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <HiOutlineXMark className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Format</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as 'csv')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">CSV</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="xlsx"
                  checked={format === 'xlsx'}
                  onChange={(e) => setFormat(e.target.value as 'xlsx')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Excel (XLSX)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeRaw}
                onChange={(e) => setIncludeRaw(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Include raw transactions?</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Includes aggregated CSV. Raw transactions will add detailed invoice data.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { FiDownload, FiCalendar, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import { HistoryFilters } from '@/hooks/usePatientHistory';

interface HistoryHeaderProps {
  patientId: string;
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
  onExport: () => void;
  onJumpToDate: () => void;
}

export default function HistoryHeader({ patientId, filters, onChange, onExport, onJumpToDate }: HistoryHeaderProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Patient Mini Card */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FiUser className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="font-medium text-gray-900">-</h2>
            <p className="text-sm text-gray-500">-</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FiPhone className="w-4 h-4" />
            <span>-</span>
          </div>
          <div className="flex items-center gap-2">
            <FiMail className="w-4 h-4" />
            <span>-</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <button
          onClick={onExport}
          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <FiDownload className="w-4 h-4" />
          Export History
        </button>
        
        <button
          onClick={onJumpToDate}
          className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <FiCalendar className="w-4 h-4" />
          Jump to Date
        </button>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="font-semibold text-blue-900">12</div>
            <div className="text-blue-700">Prescriptions</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-semibold text-green-900">8</div>
            <div className="text-green-700">Visits</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded">
            <div className="font-semibold text-purple-900">5</div>
            <div className="text-purple-700">Lab Results</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded">
            <div className="font-semibold text-orange-900">15</div>
            <div className="text-orange-700">Invoices</div>
          </div>
        </div>
      </div>
    </div>
  );
}

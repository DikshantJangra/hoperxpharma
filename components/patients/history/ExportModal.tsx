'use client';

import React, { useState } from 'react';
import { FiX, FiDownload, FiCalendar, FiFileText, FiMail, FiPackage } from 'react-icons/fi';
import { HistoryFilters } from '@/hooks/usePatientHistory';

interface ExportModalProps {
  patientId: string;
  filters: HistoryFilters;
  onClose: () => void;
}

export default function ExportModal({ patientId, filters, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'zip'>('pdf');
  const [includeDocuments, setIncludeDocuments] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    
    // Telemetry
    console.log('patient.history.export.requested', {
      patientId,
      format,
      includeDocuments,
      filters
    });
    
    // Mock export job creation
    setTimeout(() => {
      const mockJobId = `job_${Date.now()}`;
      setJobId(mockJobId);
      setIsExporting(false);
      
      // Mock job completion
      setTimeout(() => {
        console.log('patient.history.export.completed', { jobId: mockJobId });
        // Show success toast: "Export ready — download available for 1 hour."
        onClose();
      }, 3000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Export patient activity</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isExporting}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setFormat('pdf')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  format === 'pdf' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FiFileText className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">PDF</div>
                <div className="text-xs text-gray-500">Report</div>
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  format === 'csv' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FiFileText className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">CSV</div>
                <div className="text-xs text-gray-500">Data</div>
              </button>
              <button
                onClick={() => setFormat('zip')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  format === 'zip' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FiPackage className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">ZIP</div>
                <div className="text-xs text-gray-500">Package</div>
              </button>
            </div>
          </div>

          {/* Current Filters Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Applied Filters</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Date Range: {filters.from && filters.to ? `${filters.from} to ${filters.to}` : 'All time'}</div>
              <div>Types: {filters.types.length > 0 ? filters.types.join(', ') : 'All types'}</div>
              {filters.search && <div>Search: "{filters.search}"</div>}
              {filters.actor && <div>Actor: {filters.actor}</div>}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={includeDocuments}
                onChange={(e) => setIncludeDocuments(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                disabled={isExporting}
              />
              <div className="ml-3">
                <span className="text-sm text-gray-700 font-medium">Include documents</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Attach referenced documents (requires export_documents permission)
                </p>
              </div>
            </label>
          </div>

          {/* Export Preview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FiCalendar className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Export Summary</p>
                <div className="space-y-0.5 text-xs">
                  <p>Patient: {patientId}</p>
                  <p>Format: {format.toUpperCase()}</p>
                  <p>Documents: {includeDocuments ? 'Included' : 'Excluded'}</p>
                  <p>Estimated size: ~2.5 MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Job Status */}
          {jobId && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Export job created: {jobId}</span>
              </div>
              <p className="text-xs text-green-700 mt-1">Processing... You'll be notified when ready.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            disabled={isExporting}
          >
            {jobId ? 'Close' : 'Cancel'}
          </button>
          {!jobId && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Export...
                </>
              ) : (
                <>
                  <FiDownload className="w-4 h-4" />
                  Create Export Job
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
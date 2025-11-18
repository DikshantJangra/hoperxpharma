'use client';

import React from 'react';
import { FiX, FiDownload, FiUser, FiClock, FiFileText, FiActivity, FiAlertTriangle, FiEdit, FiRefreshCw } from 'react-icons/fi';
import { HistoryEvent } from '@/hooks/usePatientHistory';

interface TimelineDetailPaneProps {
  event: HistoryEvent | null;
  onClose: () => void;
}

const EVENT_ICONS = {
  prescription: FiFileText,
  visit: FiUser,
  lab: FiActivity,
  allergy: FiAlertTriangle,
  note: FiEdit,
  refill: FiRefreshCw
};

const EVENT_COLORS = {
  prescription: 'bg-blue-100 text-blue-600',
  visit: 'bg-green-100 text-green-600',
  lab: 'bg-purple-100 text-purple-600',
  allergy: 'bg-red-100 text-red-600',
  note: 'bg-yellow-100 text-yellow-600',
  refill: 'bg-indigo-100 text-indigo-600'
};

export default function TimelineDetailPane({ event, onClose }: TimelineDetailPaneProps) {
  if (!event) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
        <div className="text-center text-gray-500">
          <FiFileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Select an event to view details</p>
        </div>
      </div>
    );
  }

  const Icon = EVENT_ICONS[event.type];
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-fit sticky top-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${EVENT_COLORS[event.type]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-medium text-gray-900">Event Details</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title & Description */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">{event.title}</h4>
          <p className="text-sm text-gray-600">{event.description}</p>
        </div>

        {/* Metadata */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <FiClock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(event.date)}</span>
          </div>

          {event.provider && (
            <div className="flex items-center gap-2 text-sm">
              <FiUser className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{event.provider}</span>
            </div>
          )}

          {event.status && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                event.status === 'active' ? 'bg-green-100 text-green-800' :
                event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {event.status}
              </span>
            </div>
          )}
        </div>

        {/* Medications */}
        {event.medications && event.medications.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">Medications</h5>
            <div className="space-y-2">
              {event.medications.map((med, i) => (
                <div key={i} className="p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-900">{med}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {event.attachments && event.attachments.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">Attachments</h5>
            <div className="space-y-2">
              {event.attachments.map((attachment, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{attachment.name}</span>
                  <button className="text-blue-600 hover:text-blue-800">
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Details based on type */}
        {event.type === 'prescription' && (
          <div className="pt-4 border-t border-gray-100">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Prescription Details</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Dosage: As prescribed</p>
              <p>Duration: 30 days</p>
              <p>Refills: 2 remaining</p>
            </div>
          </div>
        )}

        {event.type === 'lab' && (
          <div className="pt-4 border-t border-gray-100">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Lab Results</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Test Type: HbA1c</p>
              <p>Result: 7.2%</p>
              <p>Reference Range: 4.0-5.6%</p>
              <p className="text-green-600">Status: Normal for diabetic patient</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            View Full Record
          </button>
          <button className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
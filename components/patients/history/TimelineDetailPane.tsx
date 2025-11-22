'use client';

import React from 'react';
import { FiX, FiDownload, FiUser, FiClock, FiFileText, FiActivity, FiAlertTriangle, FiEdit, FiRefreshCw } from 'react-icons/fi';
import { HistoryEvent } from '@/hooks/usePatientHistory';

interface TimelineDetailPaneProps {
  event: HistoryEvent | null;
  onClose: () => void;
}

const EVENT_ICONS: Record<string, any> = {
  PRESCRIPTION_CREATED: FiFileText,
  PRESCRIPTION_VERIFIED: FiFileText,
  DISPENSE: FiRefreshCw,
  INVOICE: FiFileText,
  VISIT: FiUser,
  LAB_RESULT: FiActivity,
  DOCUMENT_UPLOAD: FiFileText,
  CONSENT: FiFileText,
  MESSAGE: FiEdit,
  NOTE: FiEdit,
  CLINICAL_FLAG: FiAlertTriangle
};

const EVENT_COLORS: Record<string, string> = {
  PRESCRIPTION_CREATED: 'bg-blue-100 text-blue-600',
  PRESCRIPTION_VERIFIED: 'bg-green-100 text-green-600',
  DISPENSE: 'bg-purple-100 text-purple-600',
  INVOICE: 'bg-indigo-100 text-indigo-600',
  VISIT: 'bg-green-100 text-green-600',
  LAB_RESULT: 'bg-purple-100 text-purple-600',
  DOCUMENT_UPLOAD: 'bg-gray-100 text-gray-600',
  CONSENT: 'bg-blue-100 text-blue-600',
  MESSAGE: 'bg-yellow-100 text-yellow-600',
  NOTE: 'bg-yellow-100 text-yellow-600',
  CLINICAL_FLAG: 'bg-red-100 text-red-600'
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

  const Icon = EVENT_ICONS[event.type] || FiFileText;
  const colorClass = EVENT_COLORS[event.type] || 'bg-gray-100 text-gray-600';

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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
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
          <p className="text-sm text-gray-600">{event.summary}</p>
        </div>

        {/* Metadata */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <FiClock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{formatDate(event.timestamp)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <FiUser className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{event.actor.name} ({event.actor.role})</span>
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Related Items */}
        {event.related && event.related.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">Related</h5>
            <div className="space-y-2">
              {event.related.map((item, i) => (
                <div key={i} className="p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-900">{item.type}: {item.id}</span>
                </div>
              ))}
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
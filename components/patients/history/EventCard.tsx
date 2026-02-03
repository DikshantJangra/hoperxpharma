'use client';

import React from 'react';
import { FiFileText, FiUser, FiActivity, FiAlertCircle, FiEdit, FiRefreshCw, FiDollarSign, FiMail, FiFlag, FiMoreHorizontal, FiExternalLink } from 'react-icons/fi';
import { HistoryEvent } from '@/hooks/usePatientHistory';

interface EventCardProps {
  event: HistoryEvent;
  isSelected: boolean;
  onClick: () => void;
}

const EVENT_ICONS = {
  PRESCRIPTION_CREATED: FiFileText,
  PRESCRIPTION_VERIFIED: FiFileText,
  DISPENSE: FiRefreshCw,
  INVOICE: FiDollarSign,
  VISIT: FiUser,
  LAB_RESULT: FiActivity,
  DOCUMENT_UPLOAD: FiFileText,
  CONSENT: FiFlag,
  MESSAGE: FiMail,
  NOTE: FiEdit,
  CLINICAL_FLAG: FiAlertCircle
};

const EVENT_COLORS = {
  PRESCRIPTION_CREATED: 'bg-blue-100 text-blue-600',
  PRESCRIPTION_VERIFIED: 'bg-blue-100 text-blue-600',
  DISPENSE: 'bg-green-100 text-green-600',
  INVOICE: 'bg-orange-100 text-orange-600',
  VISIT: 'bg-green-100 text-green-600',
  LAB_RESULT: 'bg-purple-100 text-purple-600',
  DOCUMENT_UPLOAD: 'bg-gray-100 text-gray-600',
  CONSENT: 'bg-yellow-100 text-yellow-600',
  MESSAGE: 'bg-indigo-100 text-indigo-600',
  NOTE: 'bg-yellow-100 text-yellow-600',
  CLINICAL_FLAG: 'bg-red-100 text-red-600'
};

export default function EventCard({ event, isSelected, onClick }: EventCardProps) {
  const Icon = EVENT_ICONS[event.type] || FiFileText;
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handlePrefetch = () => {
    // Telemetry for prefetch
    console.log('patient.history.event_prefetch', { eventId: event.eventId });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={handlePrefetch}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`p-3 hover:bg-gray-50 flex items-start justify-between cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      aria-labelledby={`event-${event.eventId}-title`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${EVENT_COLORS[event.type]}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 id={`event-${event.eventId}-title`} className="text-sm font-medium text-gray-900 truncate">
              {event.title}
            </h4>
            {event.sensitive && (
              <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                Sensitive
              </span>
            )}
            {event.tags.includes('critical') && (
              <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                Critical
              </span>
            )}
            {event.tags.includes('requires-action') && (
              <span className="text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full font-medium">
                Action Required
              </span>
            )}
          </div>
          
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {event.summary.length > 140 ? `${event.summary.substring(0, 140)}...` : event.summary}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatTime(event.timestamp)}</span>
            <span>by {event.actor.name}</span>
            {event.auditEventId && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('View audit:', event.auditEventId);
                }}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                title="View audit trail"
              >
                <FiExternalLink className="w-3 h-3" />
                Audit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-2">
        {event.related.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Open related:', event.related[0]);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="View related object"
          >
            <FiExternalLink className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('Event actions menu');
          }}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title="More actions"
        >
          <FiMoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
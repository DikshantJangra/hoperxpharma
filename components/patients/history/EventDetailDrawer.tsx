'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiExternalLink, FiDownload, FiEdit, FiFlag, FiCopy, FiMessageSquare } from 'react-icons/fi';
import { HistoryEvent } from '@/hooks/usePatientHistory';
import RelatedObjectPreview from './RelatedObjectPreview';
import AnnotationEditor from './AnnotationEditor';
import SensitiveReveal from './SensitiveReveal';

interface EventDetailDrawerProps {
  eventId: string;
  onClose: () => void;
}

export default function EventDetailDrawer({ eventId, onClose }: EventDetailDrawerProps) {
  const [event, setEvent] = useState<HistoryEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'json' | 'related' | 'actions'>('summary');
  const [showAnnotation, setShowAnnotation] = useState(false);

  useEffect(() => {
    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      // Mock detailed event data
      const mockEvent: HistoryEvent = {
        eventId,
        patientId: 'p_001',
        type: 'PRESCRIPTION_CREATED',
        title: 'Prescription created — Dr. Kumar',
        summary: 'Paracetamol 500mg x 15; Amoxicillin 250mg x 10',
        timestamp: '2025-01-15T10:12:00Z',
        actor: { id: 'u_reception1', name: 'Reception1', role: 'reception' },
        payload: {
          prescriptionId: 'rx_001',
          items: [
            { drug: 'Paracetamol', strength: '500mg', quantity: 15 },
            { drug: 'Amoxicillin', strength: '250mg', quantity: 10 }
          ],
          prescriber: { name: 'Dr. Kumar', license: 'MH12345' }
        },
        sensitive: true,
        tags: ['prescription', 'initial'],
        related: [
          { type: 'PRESCRIPTION', id: 'rx_001', path: '/prescriptions/rx_001' },
          { type: 'DOCUMENT', id: 'doc_001', path: '/documents/doc_001' }
        ],
        auditEventId: 'audit_001',
        meta: { deviceId: 'dev_kiosk1', ip: '192.168.1.10', userAgent: 'POS/1.3' }
      };
      setEvent(mockEvent);
      setLoading(false);
    }, 300);
  };

  const copyAuditId = () => {
    if (event?.auditEventId) {
      navigator.clipboard.writeText(event.auditEventId);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 h-fit sticky top-6">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-fit sticky top-6" role="dialog" aria-labelledby="event-detail-title">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 id="event-detail-title" className="font-medium text-gray-900">Event Detail</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close detail drawer"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { key: 'summary', label: 'Summary' },
            { key: 'json', label: 'Full JSON' },
            { key: 'related', label: 'Related' },
            { key: 'actions', label: 'Actions' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{event.title}</h4>
              <p className="text-sm text-gray-600">{event.summary}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Timestamp:</span>
                <span className="text-gray-900">{formatTimestamp(event.timestamp)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Actor:</span>
                <span className="text-gray-900">{event.actor.name} ({event.actor.role})</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Audit ID:</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{event.auditEventId}</code>
                  <button
                    onClick={copyAuditId}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy audit ID"
                  >
                    <FiCopy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {event.tags.length > 0 && (
                <div>
                  <span className="text-gray-500 block mb-1">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {event.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {event.sensitive && (
              <SensitiveReveal 
                onReveal={() => console.log('Sensitive data revealed')}
                data={event.payload}
              />
            )}
          </div>
        )}

        {activeTab === 'json' && (
          <div>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'related' && (
          <div className="space-y-3">
            {event.related.length === 0 ? (
              <p className="text-sm text-gray-500">No related objects</p>
            ) : (
              event.related.map(related => (
                <RelatedObjectPreview key={related.id} related={related} />
              ))
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
            <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-2">
              <FiExternalLink className="w-4 h-4" />
              Open Prescription
            </button>
            <button className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 flex items-center gap-2">
              <FiEdit className="w-4 h-4" />
              Reopen Prescription
            </button>
            <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100 flex items-center gap-2">
              <FiMessageSquare className="w-4 h-4" />
              Message Prescriber
            </button>
            <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 flex items-center gap-2">
              <FiDownload className="w-4 h-4" />
              Export Event
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <button
          onClick={() => setShowAnnotation(true)}
          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <FiEdit className="w-4 h-4" />
          Annotate
        </button>
        <button className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2">
          <FiFlag className="w-4 h-4" />
          Pin
        </button>
      </div>

      {/* Annotation Modal */}
      {showAnnotation && (
        <AnnotationEditor
          eventId={event.eventId}
          onClose={() => setShowAnnotation(false)}
          onSave={(annotation) => {
            console.log('Annotation saved:', annotation);
            setShowAnnotation(false);
          }}
        />
      )}
    </div>
  );
}
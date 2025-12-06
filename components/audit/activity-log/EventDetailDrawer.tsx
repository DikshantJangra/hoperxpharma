"use client";
import { useState, useEffect } from "react";
import {
  FiX,
  FiCopy,
  FiDownload,
  FiMessageSquare,
  FiAlertTriangle,
  FiExternalLink,
  FiMapPin,
  FiShield,
  FiUser,
  FiClock,
} from "react-icons/fi";
import { MdHistory } from "react-icons/md";
import { auditApi, type AuditLog } from "@/lib/api/audit";
import { toast } from "react-hot-toast";

interface EventDetailDrawerProps {
  eventId: string;
  onClose: () => void;
  onAnnotate: () => void;
  onRevert: () => void;
}

const DrawerSkeleton = () => (
  <div className="w-[600px] bg-white border-l border-gray-200 flex flex-col animate-pulse">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-100 rounded w-1/4"></div>
    </div>
    <div className="p-6 space-y-4">
      <div className="h-10 bg-gray-100 rounded-lg"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      <div className="h-12 bg-gray-100 rounded-lg"></div>
      <div className="h-24 bg-gray-100 rounded-lg"></div>
    </div>
  </div>
)

export default function EventDetailDrawer({
  eventId,
  onClose,
  onAnnotate,
  onRevert,
}: EventDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"details" | "payload" | "network" | "history">(
    "details"
  );
  const [event, setEvent] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [historyEvents, setHistoryEvents] = useState<AuditLog[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await auditApi.getActivityById(eventId);
        setEvent(response.data);
      } catch (error: any) {
        console.error('Failed to fetch event details:', error);
        toast.error('Failed to load event details');
        setEvent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  // Fetch history when tab is activated
  useEffect(() => {
    const fetchHistory = async () => {
      if (activeTab === 'history' && event && historyEvents.length === 0) {
        try {
          setIsHistoryLoading(true);
          const response = await auditApi.getActivityByEntity(event.resource.type, event.resource.id);
          // Filter out current event and sort by timestamp desc
          const history = response.data
            .filter((e: AuditLog) => e.id !== event.id)
            .sort((a: AuditLog, b: AuditLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setHistoryEvents(history);
        } catch (error) {
          console.error('Failed to fetch history:', error);
          toast.error('Failed to load history');
        } finally {
          setIsHistoryLoading(false);
        }
      }
    };

    fetchHistory();
  }, [activeTab, event]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return <DrawerSkeleton />
  }

  if (!event) {
    return (
      <div className="w-[600px] bg-white border-l border-gray-200 flex flex-col items-center justify-center text-gray-500">
        <FiUser size={32} className="mx-auto mb-2" />
        <p>Select an event to see details</p>
      </div>
    )
  }

  return (
    <div className="w-[600px] bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded border border-orange-200">
                {event.severity}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-mono">{event.id}</span>
              <button
                onClick={() => copyToClipboard(event.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiCopy size={12} />
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAnnotate}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
          >
            <FiMessageSquare size={14} />
            Annotate
          </button>
          <button
            onClick={onRevert}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm"
          >
            <FiAlertTriangle size={14} />
            Request Revert
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
            <FiDownload size={14} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
        {[
          { id: "details", label: "Details" },
          { id: "payload", label: "Payload" },
          { id: "network", label: "Network" },
          { id: "history", label: "History" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${activeTab === tab.id
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Actor Info */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Actor</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-medium text-gray-900">{event.actor.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900">{event.actor.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{event.actor.role}</span>
                </div>
              </div>
            </div>

            {/* Action Info */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Action</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="text-sm font-mono font-medium text-gray-900">{event.action}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Timestamp</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(event.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Severity</span>
                  <span className={`text-sm font-medium capitalize ${event.severity === 'critical' ? 'text-red-600' :
                    event.severity === 'high' ? 'text-orange-600' :
                      event.severity === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                    }`}>{event.severity}</span>
                </div>
              </div>
            </div>

            {/* Resource Info */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Resource</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="text-sm font-medium text-gray-900">{event.resource.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium text-teal-600">{event.resource.id}</span>
                    <button
                      onClick={() => copyToClipboard(event.resource.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiCopy size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Info */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Network</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">IP Address</span>
                  <span className="text-sm font-mono font-medium text-gray-900">{event.ip}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Location</span>
                  <span className="text-sm font-medium text-gray-900">{event.location}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Summary</h4>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{event.summary}</p>
            </div>
          </div>
        )}

        {activeTab === "payload" && event.changes && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Changes</h4>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto">
              {JSON.stringify(event.changes, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === "network" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Connection Details</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <FiMapPin className="text-teal-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">IP Address</p>
                    <p className="text-sm text-gray-500 font-mono">{event.ip}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <FiShield className="text-teal-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Security Context</p>
                    <p className="text-sm text-gray-500">Authenticated Session</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex gap-2">
                <FiShield className="text-blue-600 mt-0.5" size={16} />
                <div>
                  <h5 className="text-sm font-medium text-blue-900">Security Note</h5>
                  <p className="text-xs text-blue-700 mt-1">
                    This action was performed over a secure HTTPS connection. The IP address has been logged for security auditing purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">
              Related Activity for {event.resource.type}
            </h4>

            {isHistoryLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-50 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : historyEvents.length > 0 ? (
              <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                {historyEvents.map((histEvent) => (
                  <div key={histEvent.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-gray-900">{histEvent.action}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(histEvent.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{histEvent.summary}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${histEvent.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          histEvent.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            histEvent.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                          }`}>
                          {histEvent.severity}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          by {histEvent.actor.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <MdHistory className="mx-auto text-gray-400 mb-2" size={24} />
                <p className="text-sm text-gray-500">No other history found for this item</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

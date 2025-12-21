"use client";
import { useState, useEffect } from "react";
import {
  FiX,
  FiUser,
  FiMonitor,
  FiMapPin,
  FiShield,
  FiAlertTriangle,
  FiClock,
  FiExternalLink,
} from "react-icons/fi";
import { MdBlock, MdLock, MdSecurity, MdHistory } from "react-icons/md";
import { auditApi } from "@/lib/api/audit";
import toast from "react-hot-toast";

interface AccessDetailDrawerProps {
  eventId: string;
  onClose: () => void;
  isLoading: boolean;
}

const DetailSkeleton = () => (
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

export default function AccessDetailDrawer({ eventId, onClose, isLoading }: AccessDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"details" | "device" | "network" | "session">("details");
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;

      setLoading(true);
      try {
        const response = await auditApi.getAccessById(eventId);
        const eventData = response.data || response;
        console.log('Event details:', eventData);
        setEvent(eventData);
      } catch (error) {
        console.error('Failed to fetch event details:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId])

  if (loading || isLoading) {
    return <DetailSkeleton />;
  }

  if (!event) {
    return (
      <div className="w-[600px] bg-white border-l border-gray-200 flex flex-col items-center justify-center p-12">
        <div className="text-center text-gray-500">
          <FiUser size={32} className="mx-auto mb-2" />
          <p>Select an event to see details</p>
        </div>
      </div>
    )
  }

  const userName = event.user ? `${event.user.firstName || ''} ${event.user.lastName || ''}`.trim() || event.user.email : 'Unknown User';
  const eventTypeLabel = event.eventType === 'login_success' ? 'Successful Login' :
    event.eventType === 'login_failure' ? 'Failed Login' :
      event.eventType === 'logout' ? 'Logout' : event.eventType;
  const severity = event.eventType === 'login_failure' ? 'high' : 'low';
  const severityColor = severity === 'high' ? 'bg-red-600' : 'bg-green-600';

  return (
    <div className="w-[600px] h-full bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{eventTypeLabel}</h3>
              <span className={`px-2 py-1 ${severityColor} text-white text-xs font-medium rounded`}>
                {severity}
              </span>
            </div>
            <div className="text-sm text-gray-500 font-mono">{event.id}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <FiX size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <FiUser size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-blue-900">{userName}</div>
              <div className="text-xs text-blue-700 mt-1">{event.user?.email}</div>
              <div className="text-xs text-blue-600 mt-1">Role: {event.user?.role || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <FiClock className="inline mr-1" size={12} />
          {new Date(event.createdAt).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'medium'
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
        {[
          { id: "details", label: "Details" },
          { id: "device", label: "Device" },
          { id: "network", label: "Network" },
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
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Event Type</h4>
              <p className="text-sm text-gray-900">{event.eventType}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">IP Address</h4>
              <p className="text-sm text-gray-900 font-mono">{event.ipAddress}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">User Agent</h4>
              <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded break-all">{event.userAgent || 'Not available'}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Device Info</h4>
              <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">{event.deviceInfo || 'Not available'}</p>
            </div>
          </div>
        )}

        {activeTab === 'device' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">User Agent String</h4>
              <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded break-all font-mono">
                {event.userAgent || 'Not available'}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Device Information</h4>
              <p className="text-sm text-gray-700">{event.deviceInfo || 'Not available'}</p>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">IP Address</h4>
              <p className="text-sm text-gray-900 font-mono">{event.ipAddress}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Location</h4>
              <p className="text-sm text-gray-700">Location data not available yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (eventId && !isLoading) {
        // In a real app, you'd fetch the event details by eventId
        setEvent(null);
    }
  }, [eventId, isLoading])

  if (isLoading) {
    return <DetailSkeleton />;
  }
  
  if (!event) {
    return (
        <div className="w-[600px] bg-white border-l border-gray-200 flex flex-col items-center justify-center">
            <div className="text-center text-gray-500">
                <FiUser size={32} className="mx-auto mb-2"/>
                <p>Select an event to see details</p>
            </div>
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
              <h3 className="text-lg font-semibold text-gray-900">Access Event</h3>
              <span className="px-2 py-1 bg-red-900 text-white text-xs font-medium rounded">
                {event.severity}
              </span>
            </div>
            <div className="text-sm text-gray-500 font-mono">{event.id}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <FiX size={20} />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <FiAlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <div className="font-medium">Failed login attempt from suspicious IP</div>
              <div className="text-xs mt-1">
                {event.payload.attemptNumber} consecutive failures • New location ({event.network.geo.country}) • High-risk ASN
              </div>
            </div>
          </div>
        </div>

        {/* Security Actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
            <MdBlock size={14} />
            Block IP
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm">
            <MdLock size={14} />
            Lock User
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
            <MdSecurity size={14} />
            Investigate
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
        {[
          { id: "details", label: "Details" },
          { id: "device", label: "Device" },
          { id: "network", label: "Network" },
          { id: "session", label: "Session" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === tab.id
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
        {/* Render tab content based on event data */}
      </div>
    </div>
  );
}

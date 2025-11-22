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
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (eventId) {
        // Fetch event details
        setTimeout(() => {
            setEvent(null);
            setIsLoading(false)
        }, 1500)
    } else {
        setIsLoading(false);
    }
  }, [eventId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  if (isLoading) {
    return <DrawerSkeleton/>
  }

  if (!event) {
    return (
        <div className="w-[600px] bg-white border-l border-gray-200 flex flex-col items-center justify-center text-gray-500">
            <FiUser size={32} className="mx-auto mb-2"/>
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

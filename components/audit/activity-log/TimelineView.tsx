"use client";
import { FiClock, FiUser, FiAlertCircle } from "react-icons/fi";

interface TimelineViewProps {
  searchQuery: string;
  isLive: boolean;
  onEventClick: (eventId: string) => void;
}

const mockTimelineEvents = [
  {
    time: "10:12 AM",
    events: [
      {
        id: "evt_20251113_0001",
        severity: "high",
        actor: "Aman Verma",
        action: "inventory.adjust",
        summary: "Changed batch B2025-01 qty 120 → 115 (reason: broken_vial)",
      },
    ],
  },
  {
    time: "10:08 AM",
    events: [
      {
        id: "evt_20251113_0002",
        severity: "critical",
        actor: "Priya Singh",
        action: "prescription.override",
        summary: "Overrode allergy warning for Amoxicillin",
      },
    ],
  },
  {
    time: "09:45 AM",
    events: [
      {
        id: "evt_20251113_0003",
        severity: "high",
        actor: "Vikram Rao",
        action: "invoice.void",
        summary: "Voided invoice INV-5678 (₹2,450)",
      },
    ],
  },
  {
    time: "09:30 AM",
    events: [
      {
        id: "evt_20251113_0004",
        severity: "warning",
        actor: "System",
        action: "batch.quarantine",
        summary: "Batch quarantined due to temperature breach",
      },
      {
        id: "evt_20251113_0005",
        severity: "warning",
        actor: "Unknown",
        action: "user.login.failed",
        summary: "Failed login attempt - 3rd attempt",
      },
    ],
  },
];

export default function TimelineView({ searchQuery, isLive, onEventClick }: TimelineViewProps) {
  const severityColors = {
    critical: "border-red-500 bg-red-50",
    high: "border-orange-500 bg-orange-50",
    warning: "border-yellow-500 bg-yellow-50",
    info: "border-gray-300 bg-white",
  };

  return (
    <div className="p-6 space-y-6">
      {mockTimelineEvents.map((timeGroup, idx) => (
        <div key={idx} className="flex gap-4">
          {/* Time marker */}
          <div className="flex-shrink-0 w-24 pt-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <FiClock size={14} />
              {timeGroup.time}
            </div>
          </div>

          {/* Timeline line */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-teal-500 border-2 border-white shadow"></div>
            {idx < mockTimelineEvents.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 min-h-[40px]"></div>
            )}
          </div>

          {/* Events */}
          <div className="flex-1 space-y-3 pb-6">
            {timeGroup.events.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick(event.id)}
                className={`border-l-4 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  severityColors[event.severity as keyof typeof severityColors]
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FiUser size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{event.actor}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs font-mono text-gray-600">{event.action}</span>
                  </div>
                  {(event.severity === "critical" || event.severity === "high") && (
                    <FiAlertCircle
                      size={16}
                      className={
                        event.severity === "critical" ? "text-red-500" : "text-orange-500"
                      }
                    />
                  )}
                </div>
                <p className="text-sm text-gray-700">{event.summary}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

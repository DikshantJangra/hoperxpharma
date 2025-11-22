"use client";
import { useState, useEffect } from "react";
import { FiClock, FiUser, FiAlertCircle } from "react-icons/fi";

interface TimelineViewProps {
  searchQuery: string;
  isLive: boolean;
  onEventClick: (eventId: string) => void;
  isLoading: boolean;
}

const TimelineSkeleton = () => (
    <div className="flex gap-4 animate-pulse">
        <div className="flex-shrink-0 w-24 pt-1"><div className="h-4 bg-gray-200 rounded w-full"></div></div>
        <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-0.5 flex-1 bg-gray-200 min-h-[40px]"></div>
        </div>
        <div className="flex-1 space-y-3 pb-6">
            <div className="border-l-4 rounded-lg p-4 bg-gray-50 border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
            </div>
        </div>
    </div>
)

export default function TimelineView({ searchQuery, isLive, onEventClick, isLoading }: TimelineViewProps) {
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  useEffect(() => {
    if(!isLoading) {
        setTimelineEvents([]);
    }
  }, [isLoading, searchQuery, isLive]);

  const severityColors = {
    critical: "border-red-500 bg-red-50",
    high: "border-orange-500 bg-orange-50",
    warning: "border-yellow-500 bg-yellow-50",
    info: "border-gray-300 bg-white",
  };

  if (isLoading) {
    return (
        <div className="p-6 space-y-6">
            <TimelineSkeleton/>
            <TimelineSkeleton/>
            <TimelineSkeleton/>
        </div>
    )
  }

  if (timelineEvents.length === 0) {
    return <div className="p-6 text-center text-gray-500">No events to display in timeline view.</div>
  }

  return (
    <div className="p-6 space-y-6">
      {timelineEvents.map((timeGroup, idx) => (
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
            {idx < timelineEvents.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 min-h-[40px]"></div>
            )}
          </div>

          {/* Events */}
          <div className="flex-1 space-y-3 pb-6">
            {timeGroup.events.map((event: any) => (
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

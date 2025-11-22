"use client";
import { useState, useEffect } from "react";
import { FiCopy, FiExternalLink, FiMessageSquare, FiAlertCircle, FiDownload } from "react-icons/fi";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";

interface ActivityTableProps {
  searchQuery: string;
  isLive: boolean;
  onEventClick: (eventId: string) => void;
  selectedEvents: string[];
  onSelectionChange: (eventIds: string[]) => void;
  isLoading: boolean;
}

const ActivityRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-4 py-3"><div className="h-4 w-4 bg-gray-200 rounded"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-8"></div></td>
    </tr>
)

export default function ActivityTable({
  searchQuery,
  isLive,
  onEventClick,
  selectedEvents,
  onSelectionChange,
  isLoading
}: ActivityTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
        setEvents([]);
    }
  }, [isLoading, searchQuery, isLive]);

  const resultColors = {
    success: "bg-green-100 text-green-700 border-green-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    blocked: "bg-gray-900 text-white border-gray-800",
    challenged: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  const riskColors = {
    low: "bg-green-100 text-green-700",
    medium: "bg-orange-100 text-orange-700",
    high: "bg-red-100 text-red-700",
    critical: "bg-red-900 text-white",
  };

  const roleColors = {
    admin: "bg-purple-100 text-purple-700",
    pharmacist: "bg-teal-100 text-teal-700",
    cashier: "bg-blue-100 text-blue-700",
    system: "bg-gray-100 text-gray-700",
    guest: "bg-red-100 text-red-700",
  };

  const toggleSelection = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      onSelectionChange(selectedEvents.filter((id) => id !== eventId));
    } else {
      onSelectionChange([...selectedEvents, eventId]);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
              <MdCheckBoxOutlineBlank size={18} className="text-gray-400" />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Severity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actor
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Action
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Resource
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Summary
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              IP / Location
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Tags
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
                <>
                    <ActivityRowSkeleton/>
                    <ActivityRowSkeleton/>
                    <ActivityRowSkeleton/>
                    <ActivityRowSkeleton/>
                </>
            ) : events.length > 0 ? (
                events.map((event) => (
                    <tr
                    key={event.id}
                    onMouseEnter={() => setHoveredRow(event.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`hover:bg-gray-50 cursor-pointer ${
                        event.severity === "critical" ? "bg-red-50" : ""
                    } ${isLive && event.id === events[0].id ? "animate-pulse bg-teal-50" : ""}`}
                    onClick={() => onEventClick(event.id)}
                    >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleSelection(event.id)}>
                        {selectedEvents.includes(event.id) ? (
                            <MdCheckBox size={18} className="text-teal-600" />
                        ) : (
                            <MdCheckBoxOutlineBlank size={18} className="text-gray-400" />
                        )}
                        </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                        {formatTimestamp(event.timestamp)}
                        {hoveredRow === event.id && (
                            <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(event.timestamp);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                            >
                            <FiCopy size={12} />
                            </button>
                        )}
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                            severityColors[event.severity as keyof typeof severityColors]
                        }`}
                        >
                        {event.severity === "critical" || event.severity === "high" ? (
                            <FiAlertCircle size={12} />
                        ) : null}
                        {event.severity}
                        </span>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{event.actor.name}</span>
                        <span
                            className={`inline-flex w-fit mt-1 px-2 py-0.5 rounded text-xs ${
                            roleColors[event.actor.role as keyof typeof roleColors]
                            }`}
                        >
                            {event.actor.role}
                        </span>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">{event.action}</td>
                    <td className="px-4 py-3">
                        <div className="flex flex-col">
                        <span className="text-xs text-gray-500">{event.resource.type}</span>
                        <span className="text-sm font-medium text-teal-600">{event.resource.id}</span>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-md">{event.summary}</td>
                    <td className="px-4 py-3">
                        <div className="flex flex-col text-xs">
                        <span className="text-gray-900 font-mono">{event.ip}</span>
                        <span className="text-gray-500 mt-1">{event.location}</span>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                        {event.tags.map((tag:string, idx: number) => (
                            <span
                            key={idx}
                            className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                            {tag}
                            </span>
                        ))}
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        {hoveredRow === event.id && (
                        <div className="flex items-center gap-1">
                            <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEventClick(event.id);
                            }}
                            className="p-1 text-gray-400 hover:text-teal-600"
                            title="View Detail"
                            >
                            <FiExternalLink size={14} />
                            </button>
                            <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-gray-400 hover:text-teal-600"
                            title="Annotate"
                            >
                            <FiMessageSquare size={14} />
                            </button>
                            <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-gray-400 hover:text-teal-600"
                            title="Export JSON"
                            >
                            <FiDownload size={14} />
                            </button>
                        </div>
                        )}
                    </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={10} className="text-center py-10 text-gray-500">No events found.</td>
                </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}

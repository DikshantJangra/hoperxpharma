"use client";
import { useState, useEffect } from "react";
import { FiCopy, FiExternalLink, FiMessageSquare, FiAlertCircle, FiDownload, FiActivity } from "react-icons/fi";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import { auditApi, type AuditLog, type AuditFilters } from "@/lib/api/audit";
import { toast } from "react-hot-toast";

interface ActivityTableProps {
  searchQuery: string;
  filters?: AuditFilters;
  isLive: boolean;
  onEventClick: (eventId: string) => void;
  selectedEvents: string[];
  onSelectionChange: (eventIds: string[]) => void;
  isLoading: boolean;
}

const ActivityRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-3 py-3"><div className="h-4 w-4 bg-gray-200 rounded"></div></td>
    <td className="px-3 py-3"><div className="h-8 bg-gray-200 rounded w-24"></div></td>
    <td className="px-3 py-3"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
    <td className="px-3 py-3"><div className="h-10 bg-gray-200 rounded w-32"></div></td>
    <td className="px-3 py-3"><div className="h-10 bg-gray-200 rounded w-full"></div></td>
    <td className="px-3 py-3"><div className="h-6 bg-gray-200 rounded w-8"></div></td>
  </tr>
)

export default function ActivityTable({
  searchQuery,
  filters = {},
  isLive,
  onEventClick,
  selectedEvents,
  onSelectionChange,
  isLoading
}: ActivityTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [events, setEvents] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from API
  useEffect(() => {
    fetchEvents();
  }, [searchQuery, filters]);

  // Live polling
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        fetchEvents();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isLive, searchQuery, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await auditApi.getActivityLogs({
        ...filters,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setEvents(response.data.logs || []);
    } catch (error: any) {
      console.error('Failed to fetch activity logs:', error);
      toast.error(error.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    low: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    critical: "bg-red-100 text-red-700 border-red-200",
  };

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
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8">
              <MdCheckBoxOutlineBlank size={16} className="text-gray-400" />
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-36">
              Timestamp
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
              Severity
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">
              Actor
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Action & Resource
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">
              <FiExternalLink size={14} className="text-gray-400" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            <>
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
            </>
          ) : events.length > 0 ? (
            events.map((event) => (
              <tr
                key={event.id}
                onMouseEnter={() => setHoveredRow(event.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${event.severity === "critical" ? "bg-red-50" : ""
                  } ${isLive && event.id === events[0].id ? "animate-pulse bg-teal-50" : ""}`}
                onClick={() => onEventClick(event.id)}
              >
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toggleSelection(event.id)}>
                    {selectedEvents.includes(event.id) ? (
                      <MdCheckBox size={16} className="text-teal-600" />
                    ) : (
                      <MdCheckBoxOutlineBlank size={16} className="text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-medium">{new Date(event.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${severityColors[event.severity as keyof typeof severityColors]
                      }`}
                  >
                    {event.severity === "critical" || event.severity === "high" ? (
                      <FiAlertCircle size={10} />
                    ) : null}
                    {event.severity}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 truncate">{event.actor.name}</span>
                    <span
                      className={`inline-flex w-fit mt-0.5 px-1.5 py-0.5 rounded text-xs ${roleColors[event.actor.role as keyof typeof roleColors]
                        }`}
                    >
                      {event.actor.role}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-mono text-gray-900">{event.action}</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-500">{event.resource.type}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-teal-600 font-medium truncate max-w-xs">{event.resource.id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {hoveredRow === event.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                      title="View Details"
                    >
                      <FiExternalLink size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <FiActivity size={32} className="text-gray-300" />
                  <p className="text-sm font-medium">No activity logs found</p>
                  <p className="text-xs text-gray-400">Activity will appear here as actions are performed</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

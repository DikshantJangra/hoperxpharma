"use client";
import { useState, useEffect } from "react";
import { FiMonitor, FiSmartphone, FiAlertTriangle, FiShield, FiExternalLink } from "react-icons/fi";
import { MdBlock, MdLock, MdCheckCircle, MdWarning } from "react-icons/md";

interface AccessTableProps {
  searchQuery: string;
  isLive: boolean;
  activeFilter: string | null;
  onEventClick: (eventId: string) => void;
  isLoading: boolean;
}

const AccessRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-3 bg-gray-100 rounded w-32 mt-1"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
        <td className="px-4 py-3"><div className="h-8 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-8"></div></td>
    </tr>
)

export default function AccessTable({ searchQuery, isLive, activeFilter, onEventClick, isLoading }: AccessTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
        setEvents([]);
    }
  }, [isLoading, searchQuery, activeFilter, isLive]);

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
    manager: "bg-indigo-100 text-indigo-700",
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
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP & Location</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {isLoading ? (
            <>
                <AccessRowSkeleton/>
                <AccessRowSkeleton/>
                <AccessRowSkeleton/>
                <AccessRowSkeleton/>
            </>
          ) : events.length > 0 ? (
            events.map((event) => (
                <tr
                key={event.id}
                onMouseEnter={() => setHoveredRow(event.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`hover:bg-gray-50 cursor-pointer ${
                    event.risk === "critical" ? "bg-red-50" : ""
                } ${isLive && event.id === events[0].id ? "animate-pulse bg-teal-50" : ""}`}
                onClick={() => onEventClick(event.id)}
                >
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {formatTimestamp(event.timestamp)}
                </td>
                <td className="px-4 py-3">
                    <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{event.user.name}</span>
                        {event.user.status === "disabled" && (
                        <MdBlock size={14} className="text-red-500" title="Disabled user" />
                        )}
                    </div>
                    <span className="text-xs text-gray-500">{event.user.email}</span>
                    {event.user.role && (
                        <span
                        className={`inline-flex w-fit mt-1 px-2 py-0.5 rounded text-xs ${
                            roleColors[event.user.role as keyof typeof roleColors]
                        }`}
                        >
                        {event.user.role}
                        </span>
                    )}
                    </div>
                </td>
                <td className="px-4 py-3">
                    <span className="text-sm font-mono text-gray-900">{event.event}</span>
                </td>
                <td className="px-4 py-3">
                    <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                        resultColors[event.result as keyof typeof resultColors]
                    }`}
                    >
                    {event.result === "success" && <MdCheckCircle size={12} />}
                    {event.result === "failed" && <MdWarning size={12} />}
                    {event.result === "blocked" && <MdBlock size={12} />}
                    {event.result}
                    </span>
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                    {event.device.type === "desktop" ? (
                        <FiMonitor size={16} className="text-gray-400 mt-0.5" />
                    ) : (
                        <FiSmartphone size={16} className="text-gray-400 mt-0.5" />
                    )}
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{event.device.browser}</span>
                        <span className="text-xs text-gray-500">{event.device.os}</span>
                        <span className="text-xs text-gray-400 font-mono">{event.device.fingerprint}</span>
                    </div>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <div className="flex flex-col">
                    <span className="text-sm font-mono text-gray-900">{event.ip}</span>
                    <span className="text-xs text-gray-600">
                        {event.location.city}, {event.location.country}
                    </span>
                    <span className="text-xs text-gray-500">{event.location.isp}</span>
                    {event.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                        {event.flags.map((flag: string, idx: number) => (
                            <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                            >
                            <FiAlertTriangle size={10} />
                            {flag.replace("_", " ")}
                            </span>
                        ))}
                        </div>
                    )}
                    </div>
                </td>
                <td className="px-4 py-3">
                    {event.sessionId ? (
                    <button className="text-sm font-mono text-teal-600 hover:text-teal-700 flex items-center gap-1">
                        {event.sessionId}
                        <FiExternalLink size={12} />
                    </button>
                    ) : (
                    <span className="text-sm text-gray-400">—</span>
                    )}
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                    {event.method.includes("mfa") && <FiShield size={14} className="text-purple-600" />}
                    <span className="text-sm text-gray-700">{event.method}</span>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        riskColors[event.risk as keyof typeof riskColors]
                    }`}
                    >
                    {(event.risk === "high" || event.risk === "critical") && (
                        <FiAlertTriangle size={12} />
                    )}
                    {event.risk}
                    </span>
                </td>
                <td className="px-4 py-3">
                    {hoveredRow === event.id && (
                    <div className="flex items-center gap-1">
                        {event.sessionId && (
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Terminate Session"
                        >
                            <MdBlock size={14} />
                        </button>
                        )}
                        {event.result === "failed" && (
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-gray-400 hover:text-orange-600"
                            title="Lock User"
                        >
                            <MdLock size={14} />
                        </button>
                        )}
                    </div>
                    )}
                </td>
                </tr>
            ))
          ) : (
            <tr>
                <td colSpan={10} className="text-center py-10 text-gray-500">No access events found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

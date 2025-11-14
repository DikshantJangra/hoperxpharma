"use client";
import { useState } from "react";
import { FiMonitor, FiSmartphone, FiAlertTriangle, FiShield, FiExternalLink } from "react-icons/fi";
import { MdBlock, MdLock, MdCheckCircle, MdWarning } from "react-icons/md";

interface AccessTableProps {
  searchQuery: string;
  isLive: boolean;
  activeFilter: string | null;
  onEventClick: (eventId: string) => void;
}

const mockEvents = [
  {
    id: "acc_20251113_0001",
    timestamp: "2025-11-13T10:45:22Z",
    user: { name: "Aman Verma", email: "aman@hope.com", role: "pharmacist", status: "active" },
    event: "login.success",
    result: "success",
    device: { type: "desktop", browser: "Chrome 142", os: "macOS 14", fingerprint: "FH88DJSK29" },
    ip: "122.165.33.11",
    location: { city: "Pahalgam", country: "IN", isp: "BSNL" },
    sessionId: "sess_abc123",
    method: "password + mfa",
    risk: "low",
    flags: [],
  },
  {
    id: "acc_20251113_0002",
    timestamp: "2025-11-13T10:42:15Z",
    user: { name: "Unknown", email: "hacker@test.com", role: null, status: "unknown" },
    event: "login.failed",
    result: "failed",
    device: { type: "desktop", browser: "Firefox 120", os: "Windows 11", fingerprint: "XY99KL12" },
    ip: "203.45.67.89",
    location: { city: "Unknown", country: "CN", isp: "Unknown ISP" },
    sessionId: null,
    method: "password",
    risk: "critical",
    flags: ["new_location", "suspicious_ip", "multiple_attempts"],
  },
  {
    id: "acc_20251113_0003",
    timestamp: "2025-11-13T10:38:45Z",
    user: { name: "Priya Singh", email: "priya@hope.com", role: "admin", status: "active" },
    event: "mfa.success",
    result: "success",
    device: { type: "mobile", browser: "Safari 16", os: "iOS 17", fingerprint: "AP77MN34" },
    ip: "122.165.33.12",
    location: { city: "Pahalgam", country: "IN", isp: "Jio" },
    sessionId: "sess_def456",
    method: "mfa_app",
    risk: "low",
    flags: [],
  },
  {
    id: "acc_20251113_0004",
    timestamp: "2025-11-13T10:30:11Z",
    user: { name: "Vikram Rao", email: "vikram@hope.com", role: "cashier", status: "active" },
    event: "device.new",
    result: "success",
    device: { type: "desktop", browser: "Chrome 142", os: "Windows 11", fingerprint: "NEW_DEV_01" },
    ip: "122.165.33.13",
    location: { city: "Pahalgam", country: "IN", isp: "BSNL" },
    sessionId: "sess_ghi789",
    method: "password + otp",
    risk: "medium",
    flags: ["new_device"],
  },
  {
    id: "acc_20251113_0005",
    timestamp: "2025-11-13T10:15:33Z",
    user: { name: "Disabled User", email: "old@hope.com", role: "pharmacist", status: "disabled" },
    event: "login.locked",
    result: "blocked",
    device: { type: "desktop", browser: "Chrome 140", os: "macOS 13", fingerprint: "OLD_FP_99" },
    ip: "122.165.33.14",
    location: { city: "Pahalgam", country: "IN", isp: "BSNL" },
    sessionId: null,
    method: "password",
    risk: "high",
    flags: ["disabled_user", "account_locked"],
  },
  {
    id: "acc_20251113_0006",
    timestamp: "2025-11-13T09:58:20Z",
    user: { name: "Neha Sharma", email: "neha@hope.com", role: "pharmacist", status: "active" },
    event: "otp.failed",
    result: "failed",
    device: { type: "mobile", browser: "Chrome Mobile", os: "Android 14", fingerprint: "AND_88_KK" },
    ip: "122.165.33.15",
    location: { city: "Pahalgam", country: "IN", isp: "Airtel" },
    sessionId: null,
    method: "otp",
    risk: "medium",
    flags: ["expired_otp"],
  },
];

export default function AccessTable({ searchQuery, isLive, activeFilter, onEventClick }: AccessTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

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
          {mockEvents.map((event) => (
            <tr
              key={event.id}
              onMouseEnter={() => setHoveredRow(event.id)}
              onMouseLeave={() => setHoveredRow(null)}
              className={`hover:bg-gray-50 cursor-pointer ${
                event.risk === "critical" ? "bg-red-50" : ""
              } ${isLive && event.id === mockEvents[0].id ? "animate-pulse bg-teal-50" : ""}`}
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
                      {event.flags.map((flag, idx) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

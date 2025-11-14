"use client";
import { useState } from "react";
import { FiCopy, FiExternalLink, FiMessageSquare, FiAlertCircle, FiDownload } from "react-icons/fi";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";

interface ActivityTableProps {
  searchQuery: string;
  isLive: boolean;
  onEventClick: (eventId: string) => void;
  selectedEvents: string[];
  onSelectionChange: (eventIds: string[]) => void;
}

const mockEvents = [
  {
    id: "evt_20251113_0001",
    timestamp: "2025-11-13T10:12:34Z",
    severity: "high",
    actor: { name: "Aman Verma", role: "pharmacist" },
    action: "inventory.adjust",
    resource: { type: "batch", id: "B2025-01", label: "Paracetamol 500mg" },
    summary: "Changed batch B2025-01 qty 120 → 115 (reason: broken_vial)",
    ip: "122.165.33.11",
    location: "Pahalgam-01",
    tags: ["controlled", "manual"],
  },
  {
    id: "evt_20251113_0002",
    timestamp: "2025-11-13T10:08:15Z",
    severity: "critical",
    actor: { name: "Priya Singh", role: "admin" },
    action: "prescription.override",
    resource: { type: "prescription", id: "RX-5678", label: "Prescription #5678" },
    summary: "Overrode allergy warning for Amoxicillin (patient: Rajesh Kumar)",
    ip: "122.165.33.12",
    location: "Pahalgam-01",
    tags: ["override", "allergy"],
  },
  {
    id: "evt_20251113_0003",
    timestamp: "2025-11-13T09:45:22Z",
    severity: "high",
    actor: { name: "Vikram Rao", role: "cashier" },
    action: "invoice.void",
    resource: { type: "invoice", id: "INV-5678", label: "Invoice #5678" },
    summary: "Voided invoice INV-5678 (₹2,450) - reason: customer_request",
    ip: "122.165.33.13",
    location: "Pahalgam-01",
    tags: ["void", "refund"],
  },
  {
    id: "evt_20251113_0004",
    timestamp: "2025-11-13T09:30:11Z",
    severity: "warning",
    actor: { name: "System", role: "system" },
    action: "batch.quarantine",
    resource: { type: "batch", id: "B2025-11", label: "Insulin Glargine" },
    summary: "Batch quarantined due to temperature breach (28.5°C detected)",
    ip: "10.0.0.1",
    location: "Pahalgam-01",
    tags: ["iot", "temp-breach"],
  },
  {
    id: "evt_20251113_0005",
    timestamp: "2025-11-13T09:15:45Z",
    severity: "warning",
    actor: { name: "Unknown", role: "guest" },
    action: "user.login.failed",
    resource: { type: "user", id: "u_aman", label: "Aman Verma" },
    summary: "Failed login attempt (invalid_password) - 3rd attempt",
    ip: "203.45.67.89",
    location: "Unknown",
    tags: ["security", "failed-auth"],
  },
  {
    id: "evt_20251113_0006",
    timestamp: "2025-11-13T08:50:33Z",
    severity: "info",
    actor: { name: "Neha Sharma", role: "pharmacist" },
    action: "sale.finalize",
    resource: { type: "invoice", id: "INV-5677", label: "Invoice #5677" },
    summary: "Completed sale INV-5677 (₹850) - 3 items, cash payment",
    ip: "122.165.33.14",
    location: "Pahalgam-01",
    tags: ["sale", "cash"],
  },
];

export default function ActivityTable({
  searchQuery,
  isLive,
  onEventClick,
  selectedEvents,
  onSelectionChange,
}: ActivityTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const severityColors = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
    notice: "bg-blue-100 text-blue-700 border-blue-200",
    info: "bg-gray-100 text-gray-700 border-gray-200",
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
          {mockEvents.map((event) => (
            <tr
              key={event.id}
              onMouseEnter={() => setHoveredRow(event.id)}
              onMouseLeave={() => setHoveredRow(null)}
              className={`hover:bg-gray-50 cursor-pointer ${
                isLive && event.id === mockEvents[0].id ? "animate-pulse bg-teal-50" : ""
              }`}
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
                  {event.tags.map((tag, idx) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

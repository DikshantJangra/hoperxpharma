import React from "react";
import { FiClock, FiEye } from "react-icons/fi";
import Link from "next/link";

interface AuditListProps {
  storeId: string;
}

export default function AuditList({ storeId }: AuditListProps) {
  const events = [
    { id: "EVT-3401", action: "Published hours", user: "Aman Verma", time: "2 hours ago" },
    { id: "EVT-3400", action: "Added holiday exception", user: "Aman Verma", time: "1 day ago" },
    { id: "EVT-3399", action: "Updated Monday hours", user: "Priya Sharma", time: "3 days ago" }
  ];

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiClock className="text-gray-400" size={18} />
          <h3 className="text-sm font-semibold text-gray-900">Recent Changes</h3>
        </div>
        <Link
          href="/audit/activity-log"
          className="text-xs text-teal-600 hover:text-teal-700"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
          >
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
              <FiClock size={14} className="text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{event.action}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{event.user}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{event.time}</span>
              </div>
            </div>
            <button className="text-gray-400 hover:text-teal-600">
              <FiEye size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

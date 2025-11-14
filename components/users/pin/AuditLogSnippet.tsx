"use client";
import { FiExternalLink } from "react-icons/fi";

export default function AuditLogSnippet() {
  const events = [
    { event: "PIN created", actor: "Aman", time: "Today 3:12 PM" },
    { event: "PIN verified (refund)", actor: "Aman", time: "Today 12:44 PM" },
    { event: "PIN failed attempt", actor: "Aman", time: "Today 10:22 AM" },
    { event: "PIN changed", actor: "Aman", time: "2 days ago" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent PIN Activity</h3>
        <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
          View Full Log
          <FiExternalLink size={14} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{event.event}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{event.actor}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{event.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

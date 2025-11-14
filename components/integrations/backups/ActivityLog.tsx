'use client';

import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

const MOCK_LOGS = [
  { id: '1', event: 'Backup completed', status: 'success', time: 'Today 3:12 AM', user: 'System' },
  { id: '2', event: 'Snapshot created', status: 'success', time: 'Today 3:15 AM', user: 'System' },
  { id: '3', event: 'Restore initiated', status: 'success', time: 'Yesterday 10:30 AM', user: 'Admin' },
  { id: '4', event: 'Backup failed', status: 'failed', time: '2 days ago 3:12 AM', user: 'System' },
];

export default function ActivityLog() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-[#0f172a] mb-6">Activity & Audit Logs</h2>
      
      <div className="bg-white rounded-lg border border-[#e2e8f0]">
        <table className="w-full">
          <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748b] uppercase">Event</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748b] uppercase">User</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748b] uppercase">Time</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LOGS.map(log => (
              <tr key={log.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                <td className="px-6 py-4 text-sm text-[#0f172a]">{log.event}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    log.status === 'success' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'
                  }`}>
                    {log.status === 'success' ? <FiCheckCircle className="w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[#64748b]">{log.user}</td>
                <td className="px-6 py-4 text-sm text-[#94a3b8] text-right">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

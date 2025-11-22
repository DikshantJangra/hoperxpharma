'use client';

import { useState, useEffect } from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

const LogRowSkeleton = () => (
    <tr className="border-b border-[#f1f5f9] animate-pulse">
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
        <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-12 ml-auto"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    </tr>
)

export default function Logs({ isLoading: parentLoading }: { isLoading: boolean }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setLogs([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0f172a]">Delivery Logs</h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm" disabled={isLoading || parentLoading}>
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm" disabled={isLoading || parentLoading}>
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Message ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">To</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">From</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Cost</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading || parentLoading ? (
                <>
                    <LogRowSkeleton/>
                    <LogRowSkeleton/>
                    <LogRowSkeleton/>
                    <LogRowSkeleton/>
                </>
            ) : logs.length > 0 ? (
                logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                        <td className="px-4 py-3 text-sm font-medium text-[#0f172a]">{log.id}</td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">{log.to}</td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">{log.from}</td>
                        <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                            log.status === 'Delivered' ? 'bg-[#d1fae5] text-[#065f46]' :
                            log.status === 'Sent' ? 'bg-[#dbeafe] text-[#1e40af]' :
                            log.status === 'Failed' ? 'bg-[#fee2e2] text-[#991b1b]' :
                            'bg-[#f1f5f9] text-[#64748b]'
                        }`}>
                            {log.status}
                        </span>
                        {log.reason && (
                            <p className="text-xs text-[#ef4444] mt-1">{log.reason}</p>
                        )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-[#0f172a]">₹{log.cost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">{log.time}</td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">No logs found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

const LogRowSkeleton = () => (
    <tr className="border-b border-[#f1f5f9] animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
        <td className="px-6 py-4 text-center"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
        <td className="px-6 py-4 text-center"><div className="h-4 w-4 bg-gray-200 rounded-full mx-auto"></div></td>
        <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
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
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-[#e2e8f0]">
        <h2 className="text-lg font-semibold text-[#0f172a]">Message Logs</h2>
        <p className="text-sm text-[#64748b]">Delivery tracking and audit trail</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0]">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748b] uppercase">To</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748b] uppercase">Subject</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-[#64748b] uppercase">Opened</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748b] uppercase">Time</th>
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
                logs.map(log => (
                    <tr key={log.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                        <td className="px-6 py-4 text-sm text-[#0f172a]">{log.to}</td>
                        <td className="px-6 py-4 text-sm text-[#64748b]">{log.subject}</td>
                        <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === 'delivered' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'
                        }`}>
                            {log.status === 'delivered' ? <FiCheckCircle className="w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                            {log.status}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                        {log.opened ? (
                            <FiCheckCircle className="w-4 h-4 text-[#10b981] mx-auto" />
                        ) : (
                            <span className="text-[#cbd5e1]">—</span>
                        )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#94a3b8] text-right">{log.time}</td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">No logs found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

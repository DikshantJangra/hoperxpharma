'use client';

import { useState, useEffect } from 'react';
import { FiDownload, FiEye } from 'react-icons/fi';

const AdjustmentRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3 text-center"><div className="h-6 w-12 bg-gray-200 rounded"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-10 ml-auto"></div></td>
        <td className="px-4 py-3 text-center"><div className="h-6 w-20 bg-gray-200 rounded"></div></td>
        <td className="px-4 py-3 text-center"><div className="h-6 w-10 bg-gray-200 rounded"></div></td>
    </tr>
)

export default function PastAdjustments() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setHistory([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0]">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">ID</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Date & Time</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Items</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">User</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Reason</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Total Delta</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <>
                <AdjustmentRowSkeleton/>
                <AdjustmentRowSkeleton/>
                <AdjustmentRowSkeleton/>
            </>
          ) : history.length > 0 ? (
            history.map((adj) => (
                <tr key={adj.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                    <td className="px-4 py-3">
                    <span className="font-semibold text-[#0f172a]">{adj.id}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{adj.date}</td>
                    <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-[#f1f5f9] text-[#64748b] text-xs rounded">{adj.items}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#0f172a]">{adj.user}</td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{adj.reason}</td>
                    <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${
                        adj.delta > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                    }`}>
                        {adj.delta > 0 ? '+' : ''}{adj.delta}
                    </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-[#d1fae5] text-[#065f46] text-xs rounded">
                        {adj.status}
                    </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 hover:bg-[#f1f5f9] rounded" title="View Details" disabled={isLoading}>
                        <FiEye className="w-4 h-4 text-[#64748b]" />
                        </button>
                        <button className="p-1.5 hover:bg-[#f1f5f9] rounded" title="Download Report" disabled={isLoading}>
                        <FiDownload className="w-4 h-4 text-[#64748b]" />
                        </button>
                    </div>
                    </td>
                </tr>
            ))
          ) : (
            <tr><td colSpan={8} className="text-center py-10 text-gray-500">No past adjustments found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

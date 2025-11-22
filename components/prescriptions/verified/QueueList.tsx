'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiAlertTriangle } from 'react-icons/fi';

interface QueueItem {
  id: string;
  patient: string;
  age: number;
  clinician: string;
  uploadedAt: string;
  priority: 'normal' | 'urgent';
  flags: string[];
  medCount: number;
}

interface QueueListProps {
  filter: string;
  searchQuery: string;
  onSelectRx: (rx: QueueItem | null) => void;
  selectedRx: QueueItem | null;
  isLoading: boolean;
}

const QueueItemSkeleton = () => (
    <div className="p-4 border-b border-[#f1f5f9] animate-pulse">
        <div className="flex items-start justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
        <div className="flex items-center justify-between mt-2">
            <div className="h-3 bg-gray-100 rounded w-1/4"></div>
            <div className="h-3 bg-gray-100 rounded w-1/4"></div>
        </div>
    </div>
)

export default function QueueList({ filter, searchQuery, onSelectRx, selectedRx, isLoading }: QueueListProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    // Simulate fetching queue data
    if (!isLoading) {
        setQueue([]); // Clear previous data
    }
  }, [isLoading, filter, searchQuery]); // Re-fetch when loading state or filters change

  const allCount = queue.length;
  const urgentCount = queue.filter(item => item.priority === 'urgent').length;

  return (
    <div className="w-80 bg-white border-r border-[#e2e8f0] flex flex-col">
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => {}} className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#0ea5a3] text-white" disabled={isLoading}>
            All ({isLoading ? '...' : allCount})
          </button>
          <button onClick={() => {}} className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#f1f5f9] text-[#64748b]" disabled={isLoading}>
            Urgent ({isLoading ? '...' : urgentCount})
          </button>
        </div>
        <p className="text-xs text-[#64748b]">Use J/K to navigate</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
            <>
                <QueueItemSkeleton/>
                <QueueItemSkeleton/>
                <QueueItemSkeleton/>
            </>
        ) : queue.length > 0 ? (
            queue.map(rx => (
            <div key={rx.id} onClick={() => onSelectRx(rx)} className={`p-4 border-b border-[#f1f5f9] cursor-pointer hover:bg-[#f8fafc] ${
                selectedRx?.id === rx.id ? 'bg-[#f0fdfa] border-l-4 border-l-[#0ea5a3]' : ''
                }`}>
                <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-[#0f172a]">{rx.patient}</h3>
                    {rx.priority === 'urgent' && (
                        <span className="px-2 py-0.5 bg-[#fee2e2] text-[#991b1b] rounded text-xs font-medium">
                        Urgent
                        </span>
                    )}
                    </div>
                    <p className="text-xs text-[#64748b]">{rx.age}y • {rx.medCount} meds</p>
                </div>
                {rx.flags.length > 0 && (
                    <FiAlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                )}
                </div>
                <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span>{rx.clinician}</span>
                <span className="flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    {rx.uploadedAt}
                </span>
                </div>
            </div>
            ))
        ) : (
            <div className="text-center p-4 text-gray-500 text-sm">No prescriptions found.</div>
        )}
      </div>
    </div>
  );
}

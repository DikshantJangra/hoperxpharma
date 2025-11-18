'use client';

import React from 'react';
import { ReconcileSummary } from '@/types/reconcile';
import { HiOutlineCloudArrowUp, HiOutlineClock } from 'react-icons/hi2';

interface FeedListPanelProps {
  summary: ReconcileSummary;
  onUploadClick: () => void;
  onQueueClick: (queue: string) => void;
}

export default function FeedListPanel({ summary, onUploadClick, onQueueClick }: FeedListPanelProps) {
  const queues = [
    { id: 'unmatched', label: 'Unmatched', count: summary.unmatched, color: 'text-orange-600' },
    { id: 'suggested', label: 'Suggested', count: summary.suggested, color: 'text-blue-600' },
    { id: 'suspicious', label: 'Suspicious', count: summary.suspicious, color: 'text-red-600' },
    { id: 'recent', label: 'Recently Reconciled', count: 0, color: 'text-green-600' }
  ];

  return (
    <div className="bg-white border-r border-gray-200 p-4 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Bank Feeds</h3>
        <button
          onClick={onUploadClick}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <HiOutlineCloudArrowUp className="h-4 w-4" />
          Upload Feed
        </button>
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
          <HiOutlineClock className="h-3 w-3" />
          Last sync: {summary.lastSync}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Queues</h3>
        <div className="space-y-1">
          {queues.map(queue => (
            <button
              key={queue.id}
              onClick={() => onQueueClick(queue.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
            >
              <span className="text-gray-700">{queue.label}</span>
              <span className={`font-medium ${queue.color}`}>{queue.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Accounts</h3>
        <div className="space-y-2">
          <div className="text-xs text-gray-600">Main Account</div>
          <div className="text-xs text-gray-500">HDFC ***1234</div>
        </div>
      </div>
    </div>
  );
}

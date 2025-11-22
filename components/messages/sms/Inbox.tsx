'use client';

import { useState, useEffect } from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

const ReplyCardSkeleton = () => (
    <div className="bg-white border rounded-lg p-4 animate-pulse">
        <div className="flex items-start justify-between mb-2">
            <div>
                <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-4 bg-gray-100 rounded w-32"></div>
            </div>
            <div className="h-4 bg-gray-100 rounded w-16"></div>
        </div>
        <div className="h-10 bg-gray-100 rounded"></div>
    </div>
)

export default function Inbox({ isLoading: parentLoading }: { isLoading: boolean }) {
  const [replies, setReplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setReplies([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  const isLoadingCombined = isLoading || parentLoading;

  return (
    <div className="h-full p-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-[#0f172a] mb-6">Inbox</h2>

      <div className="grid gap-3">
        {isLoadingCombined ? (
            <>
                <ReplyCardSkeleton/>
                <ReplyCardSkeleton/>
            </>
        ) : replies.length > 0 ? (
            replies.map((reply) => (
                <div key={reply.id} className={`bg-white border rounded-lg p-4 cursor-pointer hover:shadow-sm transition-shadow ${
                    reply.status === 'unread' ? 'border-[#0ea5a3]' : 'border-[#e2e8f0]'
                }`}>
                    <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="font-semibold text-[#0f172a]">{reply.name}</h3>
                        <p className="text-xs text-[#64748b]">{reply.from}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-[#64748b]">{reply.time}</span>
                        {reply.status === 'unread' && (
                        <div className="mt-1">
                            <span className="px-2 py-0.5 bg-[#0ea5a3] text-white text-xs rounded-full">New</span>
                        </div>
                        )}
                    </div>
                    </div>
                    <p className="text-sm text-[#0f172a] bg-[#f8fafc] p-2 rounded">{reply.message}</p>
                    {reply.message === 'STOP' && (
                    <div className="mt-2 p-2 bg-[#fee2e2] border border-[#fecaca] rounded text-xs text-[#991b1b]">
                        Auto-unsubscribed from marketing messages
                    </div>
                    )}
                    {reply.message === 'REFILL' && (
                    <div className="mt-2 flex gap-2">
                        <button className="px-3 py-1.5 bg-[#0ea5a3] text-white text-xs rounded hover:bg-[#0d9391]" disabled={isLoadingCombined}>
                        Create Refill Order
                        </button>
                    </div>
                    )}
                </div>
            ))
        ) : (
            <div className="text-center py-10 text-gray-500">
                No replies in your inbox.
            </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { FiMail, FiCornerUpLeft, FiPaperclip } from 'react-icons/fi';

const ThreadSkeleton = () => (
    <div className="p-4 border-b border-[#f1f5f9] animate-pulse">
        <div className="flex items-start justify-between mb-1">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-gray-100 rounded w-full"></div>
    </div>
)

export default function Inbox({ isLoading: parentLoading }: { isLoading: boolean } = { isLoading: false }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<any>(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setThreads([]);
        setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const unreadCount = threads.filter(thread => thread.unread).length;

  return (
    <div className="h-full flex bg-white">
      <div className="w-96 border-r border-[#e2e8f0]">
        <div className="p-4 border-b border-[#e2e8f0]">
          <h2 className="text-lg font-semibold text-[#0f172a]">Inbox</h2>
          {isLoading ? (
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-1 animate-pulse"></div>
          ) : (
            <p className="text-sm text-[#64748b]">{unreadCount} unread</p>
          )}
        </div>
        <div className="overflow-y-auto">
          {isLoading ? (
            <>
                <ThreadSkeleton/>
                <ThreadSkeleton/>
                <ThreadSkeleton/>
            </>
          ) : threads.length > 0 ? (
            threads.map(thread => (
              <div key={thread.id} 
                   onClick={() => setSelectedThread(thread)}
                   className={`p-4 border-b border-[#f1f5f9] cursor-pointer hover:bg-[#f8fafc] ${thread.unread ? 'bg-[#f0fdfa]' : ''} ${selectedThread?.id === thread.id ? 'bg-[#e0f2f7]' : ''}`}>
                <div className="flex items-start justify-between mb-1">
                  <div className="font-medium text-sm text-[#0f172a]">{thread.from}</div>
                  <div className="text-xs text-[#94a3b8]">{thread.time}</div>
                </div>
                <div className="text-sm font-medium text-[#0f172a] mb-1">{thread.subject}</div>
                <div className="text-xs text-[#64748b] truncate">{thread.preview}</div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-gray-500 text-sm">No messages in inbox.</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedThread ? (
            <>
                <div className="p-4 border-b border-[#e2e8f0]">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-[#0f172a]">{selectedThread.subject}</div>
                            <div className="text-sm text-[#64748b]">from {selectedThread.from}</div>
                        </div>
                        <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm">
                            <FiCornerUpLeft className="w-4 h-4" />
                            Reply
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl">
                        <div className="bg-[#f8fafc] rounded-lg p-4 mb-4">
                            <div className="text-sm text-[#0f172a]">
                                {selectedThread.preview}
                            </div>
                            <div className="text-xs text-[#94a3b8] mt-2">{selectedThread.time}</div>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <FiMail className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-medium">Select a message to read</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

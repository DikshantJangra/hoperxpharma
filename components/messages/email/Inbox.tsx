'use client';

import { FiMail, FiCornerUpLeft, FiPaperclip } from 'react-icons/fi';

const MOCK_THREADS = [
  { id: '1', from: 'rajesh@example.com', subject: 'Re: Invoice #12345', preview: 'Thank you for the invoice...', time: '10m ago', unread: true },
  { id: '2', from: 'priya@example.com', subject: 'Question about prescription', preview: 'Can I take this with food?', time: '1h ago', unread: true },
  { id: '3', from: 'amit@example.com', subject: 'Re: Refill reminder', preview: 'I will come tomorrow', time: '3h ago', unread: false },
];

export default function Inbox() {
  return (
    <div className="h-full flex bg-white">
      <div className="w-96 border-r border-[#e2e8f0]">
        <div className="p-4 border-b border-[#e2e8f0]">
          <h2 className="text-lg font-semibold text-[#0f172a]">Inbox</h2>
          <p className="text-sm text-[#64748b]">2 unread</p>
        </div>
        <div className="overflow-y-auto">
          {MOCK_THREADS.map(thread => (
            <div key={thread.id} className={`p-4 border-b border-[#f1f5f9] cursor-pointer hover:bg-[#f8fafc] ${thread.unread ? 'bg-[#f0fdfa]' : ''}`}>
              <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-sm text-[#0f172a]">{thread.from}</div>
                <div className="text-xs text-[#94a3b8]">{thread.time}</div>
              </div>
              <div className="text-sm font-medium text-[#0f172a] mb-1">{thread.subject}</div>
              <div className="text-xs text-[#64748b] truncate">{thread.preview}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-[#e2e8f0]">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#0f172a]">Re: Invoice #12345</div>
              <div className="text-sm text-[#64748b]">from rajesh@example.com</div>
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
                Thank you for the invoice. I have received it and will make the payment today.
              </div>
              <div className="text-xs text-[#94a3b8] mt-2">10 minutes ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

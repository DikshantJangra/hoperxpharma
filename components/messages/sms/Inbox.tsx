'use client';

const MOCK_REPLIES = [
  { id: '1', from: '+91 98765 43210', name: 'Rajesh Kumar', message: 'REFILL', time: '10 mins ago', status: 'unread' },
  { id: '2', from: '+91 98765 43211', name: 'Priya Sharma', message: 'STOP', time: '1 hour ago', status: 'read' },
  { id: '3', from: '+91 98765 43212', name: 'Amit Patel', message: 'Thanks!', time: '2 hours ago', status: 'read' },
];

export default function Inbox() {
  return (
    <div className="h-full p-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-[#0f172a] mb-6">Inbox</h2>

      <div className="grid gap-3">
        {MOCK_REPLIES.map((reply) => (
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
                <button className="px-3 py-1.5 bg-[#0ea5a3] text-white text-xs rounded hover:bg-[#0d9391]">
                  Create Refill Order
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

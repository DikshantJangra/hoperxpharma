'use client';

import { useState } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';

const MOCK_CONVERSATIONS = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    lastMessage: 'Can I get a refill of telmisartan?',
    timestamp: '2m ago',
    unread: 2,
    priority: true,
    avatar: 'RK',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    phone: '+91 98765 43211',
    lastMessage: 'Sent prescription image',
    timestamp: '15m ago',
    unread: 0,
    avatar: 'PS',
  },
  {
    id: '3',
    name: 'Amit Patel',
    phone: '+91 98765 43212',
    lastMessage: 'What is the price for Vitamin D?',
    timestamp: '1h ago',
    unread: 1,
    avatar: 'AP',
  },
];

export default function ConversationList({ onSelectConversation, selectedConversation }: any) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'assigned' | 'priority' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_CONVERSATIONS.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.phone.includes(searchQuery)
  );

  return (
    <div className="w-80 bg-white border-r border-[#e2e8f0] flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-[#e2e8f0]">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25d366]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e2e8f0] overflow-x-auto">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: 'Unread' },
          { id: 'assigned', label: 'Assigned' },
          { id: 'priority', label: 'Priority' },
          { id: 'closed', label: 'Closed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#25d366] text-[#25d366]'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`p-3 border-b border-[#f1f5f9] cursor-pointer hover:bg-[#f8fafc] ${
              selectedConversation?.id === conv.id ? 'bg-[#f0fdf4]' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#25d366] rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0f172a] text-sm">{conv.name}</span>
                    {conv.priority && (
                      <span className="w-2 h-2 bg-[#ef4444] rounded-full" title="High Priority" />
                    )}
                  </div>
                  <span className="text-xs text-[#64748b]">{conv.timestamp}</span>
                </div>
                <p className="text-xs text-[#64748b] truncate">{conv.lastMessage}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#94a3b8]">{conv.phone}</span>
                  {conv.unread > 0 && (
                    <span className="px-1.5 py-0.5 bg-[#25d366] text-white text-xs rounded-full">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

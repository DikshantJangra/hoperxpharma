'use client';

import { FiEdit3, FiFileText, FiSend, FiInbox, FiList, FiCheckCircle } from 'react-icons/fi';

const NAV_ITEMS = [
  { id: 'composer', label: 'Composer', icon: FiEdit3 },
  { id: 'templates', label: 'Templates', icon: FiFileText },
  { id: 'campaigns', label: 'Campaigns', icon: FiSend },
  { id: 'inbox', label: 'Inbox', icon: FiInbox },
  { id: 'logs', label: 'Logs', icon: FiList },
  { id: 'optins', label: 'Opt-ins', icon: FiCheckCircle },
];

export default function SMSNav({ activeTab, onTabChange }: any) {
  return (
    <div className="w-56 bg-white border-r border-[#e2e8f0] p-3">
      <div className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === item.id
                ? 'bg-[#f0fdfa] text-[#0ea5a3] font-medium'
                : 'text-[#64748b] hover:bg-[#f8fafc]'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

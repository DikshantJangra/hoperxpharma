'use client';

import { FiEdit, FiFileText, FiSend, FiInbox, FiList, FiSettings } from 'react-icons/fi';

export default function LeftNav({ activeView, onViewChange }: any) {
  const navItems = [
    { id: 'composer', label: 'Composer', icon: FiEdit },
    { id: 'templates', label: 'Templates', icon: FiFileText },
    { id: 'campaigns', label: 'Campaigns', icon: FiSend },
    { id: 'inbox', label: 'Inbox', icon: FiInbox },
    { id: 'logs', label: 'Logs', icon: FiList },
  ];

  return (
    <div className="w-64 bg-white border-r border-[#e2e8f0] p-4">
      <div className="space-y-1">
        {navItems.map(item => (
          <button key={item.id} onClick={() => onViewChange(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeView === item.id ? 'bg-[#0ea5a3] text-white' : 'text-[#64748b] hover:bg-[#f8fafc]'
            }`}>
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

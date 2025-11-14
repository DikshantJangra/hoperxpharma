'use client';

import { useState } from 'react';
import ConversationList from '@/components/messages/whatsapp/ConversationList';
import ChatWindow from '@/components/messages/whatsapp/ChatWindow';
import ContextPanel from '@/components/messages/whatsapp/ContextPanel';

export default function WhatsAppPage() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">WhatsApp</h1>
            <p className="text-sm text-[#64748b]">Messages › WhatsApp</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#d1fae5] rounded-lg">
              <div className="w-2 h-2 bg-[#10b981] rounded-full" />
              <span className="text-sm font-medium text-[#065f46]">Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Conversations */}
        <ConversationList
          onSelectConversation={setSelectedConversation}
          selectedConversation={selectedConversation}
        />

        {/* Center: Chat */}
        <ChatWindow conversation={selectedConversation} />

        {/* Right: Context */}
        {selectedConversation && (
          <ContextPanel conversation={selectedConversation} />
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { FiPaperclip, FiSend, FiFileText, FiImage, FiShoppingCart, FiMoreVertical } from 'react-icons/fi';
import { BsReceipt } from 'react-icons/bs';
import { RiCapsuleLine } from 'react-icons/ri';

const MessageSkeleton = ({ outgoing }: { outgoing?: boolean }) => (
    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-md px-4 py-2 rounded-lg animate-pulse ${outgoing ? 'bg-gray-200' : 'bg-gray-100'}`}>
            <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-32"></div>
        </div>
    </div>
)

export default function ChatWindow({ conversation, isLoading: parentLoading }: any) {
  const [message, setMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (conversation) {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setMessages([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }
  }, [conversation]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#d1fae5] rounded-full flex items-center justify-center mx-auto mb-3">
            <BsReceipt className="w-8 h-8 text-[#25d366]" />
          </div>
          <p className="text-[#64748b]">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* Chat Header */}
      <div className="bg-white border-b border-[#e2e8f0] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#25d366] rounded-full flex items-center justify-center text-white font-semibold">
            {conversation.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-[#0f172a]">{conversation.name}</h3>
            <p className="text-xs text-[#64748b]">{conversation.phone}</p>
          </div>
          <span className="px-2 py-1 bg-[#d1fae5] text-[#065f46] text-xs rounded">Opted-in</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm" disabled={isLoading || parentLoading}>
            <BsReceipt className="w-4 h-4" />
            Invoice
          </button>
          <button className="px-3 py-1.5 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm" disabled={isLoading || parentLoading}>
            <RiCapsuleLine className="w-4 h-4" />
            Rx
          </button>
          <button className="px-3 py-1.5 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm" disabled={isLoading || parentLoading}>
            <FiShoppingCart className="w-4 h-4" />
            Order
          </button>
          <button className="p-2 hover:bg-[#f8fafc] rounded-lg" disabled={isLoading || parentLoading}>
            <FiMoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center">
          <span className="px-3 py-1 bg-white text-[#64748b] text-xs rounded-full shadow-sm">Today</span>
        </div>

        {isLoading || parentLoading ? (
            <>
                <MessageSkeleton/>
                <MessageSkeleton outgoing/>
                <MessageSkeleton/>
            </>
        ) : messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-md px-4 py-2 rounded-lg ${
                msg.type === 'outgoing'
                  ? 'bg-[#d1fae5] text-[#0f172a]'
                  : 'bg-white text-[#0f172a] shadow-sm'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-xs text-[#64748b]">{msg.time}</span>
                {msg.type === 'outgoing' && (
                  <span className="text-xs text-[#25d366]">✓✓</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="bg-white border-t border-[#e2e8f0] p-4">
        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="p-2 hover:bg-[#f8fafc] rounded-lg"
              disabled={isLoading || parentLoading}
            >
              <FiPaperclip className="w-5 h-5 text-[#64748b]" />
            </button>

            {showTemplates && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg p-2 w-48">
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-[#f8fafc] rounded flex items-center gap-2">
                  <FiImage className="w-4 h-4" />
                  Image
                </button>
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-[#f8fafc] rounded flex items-center gap-2">
                  <FiFileText className="w-4 h-4" />
                  File
                </button>
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-[#f8fafc] rounded flex items-center gap-2">
                  <BsReceipt className="w-4 h-4" />
                  Invoice
                </button>
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-[#f8fafc] rounded flex items-center gap-2">
                  <RiCapsuleLine className="w-4 h-4" />
                  Prescription
                </button>
              </div>
            )}
          </div>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25d366]"
            disabled={isLoading || parentLoading}
          />

          <button className="p-2 bg-[#25d366] text-white rounded-lg hover:bg-[#20ba5a]" disabled={isLoading || parentLoading}>
            <FiSend className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#94a3b8] mt-2">
          Press Enter to send • Shift+Enter for new line • /invoice for quick invoice
        </p>
      </div>
    </div>
  );
}

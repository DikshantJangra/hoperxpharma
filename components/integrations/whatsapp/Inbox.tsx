'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSend, FiPaperclip, FiMoreVertical, FiCheckCircle, FiCheck } from 'react-icons/fi';

const ConversationSkeleton = () => (
    <div className="p-3 border-b border-[#f1f5f9] animate-pulse">
        <div className="flex items-start justify-between mb-1">
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
            <div className="h-3 bg-gray-100 rounded w-10"></div>
        </div>
        <div className="h-3 bg-gray-100 rounded w-full"></div>
    </div>
);

const MessageSkeleton = ({ sent }: { sent?: boolean }) => (
    <div className={`flex ${sent ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] px-3 py-2 rounded-lg animate-pulse ${sent ? 'bg-gray-200' : 'bg-gray-100'}`}>
            <div className="h-4 bg-gray-300 rounded w-48"></div>
        </div>
    </div>
);

export default function Inbox({ onClose }: { onClose: () => void }) {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [activeView, setActiveView] = useState<'inbox' | 'logs'>('inbox');
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setConversations([]);
        setMessages([]);
        if (conversations.length > 0) {
            setSelectedConversation(conversations[0]);
        }
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-[450px] bg-white border-l border-[#e2e8f0] flex flex-col">
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#0f172a]">Inbox & Logs</h3>
            {!isLoading && conversations.filter(c=>c.unread > 0).length > 0 && <span className="px-2 py-1 bg-[#fee2e2] text-[#991b1b] rounded-full text-xs font-semibold">{conversations.filter(c=>c.unread > 0).length}</span>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#f1f5f9] rounded">
            <FiX className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveView('inbox')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'inbox' ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
            }`} disabled={isLoading}>
            Conversations
          </button>
          <button onClick={() => setActiveView('logs')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'logs' ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
            }`} disabled={isLoading}>
            Message Logs
          </button>
        </div>
      </div>

      {activeView === 'inbox' ? (
        <>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-48 overflow-y-auto border-b border-[#e2e8f0]">
              {isLoading ? (
                <><ConversationSkeleton/><ConversationSkeleton/></>
              ) : conversations.length > 0 ? (
                conversations.map(conv => (
                    <div key={conv.id} onClick={() => setSelectedConversation(conv)} className={`p-3 border-b border-[#f1f5f9] cursor-pointer hover:bg-[#f8fafc] ${
                        selectedConversation?.id === conv.id ? 'bg-[#f0fdfa]' : ''
                    }`}>
                    <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                        <div className="font-medium text-sm text-[#0f172a]">{conv.patientName}</div>
                        <div className="text-xs text-[#64748b]">{conv.phone}</div>
                        </div>
                        <div className="text-xs text-[#94a3b8]">{conv.time}</div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-[#64748b] truncate flex-1">{conv.lastMessage}</div>
                        {conv.unread > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-[#0ea5a3] text-white rounded-full text-xs font-semibold">{conv.unread}</span>
                        )}
                    </div>
                    </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm">No conversations.</div>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                    <div className="p-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
                        <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-sm text-[#0f172a]">{selectedConversation.patientName}</div>
                            <div className="text-xs text-[#64748b]">{selectedConversation.phone}</div>
                        </div>
                        <button className="p-1 hover:bg-[#f1f5f9] rounded">
                            <FiMoreVertical className="w-4 h-4 text-[#64748b]" />
                        </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {isLoading ? (
                            <><MessageSkeleton/><MessageSkeleton sent/></>
                        ) : messages.length > 0 ? (
                            messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] ${msg.type === 'sent' ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#0f172a]'} rounded-lg px-3 py-2`}>
                                <div className="text-sm">{msg.text}</div>
                                <div className={`flex items-center gap-1 justify-end mt-1 text-xs ${msg.type === 'sent' ? 'text-white/70' : 'text-[#94a3b8]'}`}>
                                    <span>{msg.time}</span>
                                    {msg.type === 'sent' && (
                                    msg.status === 'read' ? <FiCheckCircle className="w-3 h-3" /> : <FiCheck className="w-3 h-3" />
                                    )}
                                </div>
                                </div>
                            </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-400 text-sm">No messages in this conversation.</div>
                        )}
                    </div>

                    <div className="p-3 border-t border-[#e2e8f0]">
                        <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-[#f1f5f9] rounded-lg">
                            <FiPaperclip className="w-4 h-4 text-[#64748b]" />
                        </button>
                        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
                        <button className="p-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391]">
                            <FiSend className="w-4 h-4" />
                        </button>
                        </div>
                    </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-gray-400 text-sm">Select a conversation</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {isLoading ? (
                <><ConversationSkeleton/><ConversationSkeleton/></>
            ) : (
                <div className="text-center py-10 text-gray-400 text-sm">No logs to display.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

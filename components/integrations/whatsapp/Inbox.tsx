'use client';

import { useState } from 'react';
import { FiX, FiSend, FiPaperclip, FiMoreVertical, FiCheckCircle, FiCheck } from 'react-icons/fi';

const MOCK_CONVERSATIONS = [
  { id: '1', patientName: 'Rajesh Kumar', phone: '+91 98765 43210', lastMessage: 'Thank you!', time: '2m ago', unread: 0, status: 'read' },
  { id: '2', patientName: 'Priya Sharma', phone: '+91 98765 43211', lastMessage: 'When can I pick up?', time: '15m ago', unread: 2, status: 'delivered' },
  { id: '3', patientName: 'Amit Patel', phone: '+91 98765 43212', lastMessage: 'Is this available?', time: '1h ago', unread: 1, status: 'delivered' },
];

const MOCK_MESSAGES = [
  { id: '1', type: 'sent', text: 'Hi Rajesh, your prescription #RX-2024-001 is ready for pickup at Main Store. Pickup by 6 PM today.', time: '10:30 AM', status: 'read' },
  { id: '2', type: 'received', text: 'Thank you! I will come by 5 PM.', time: '10:32 AM', status: 'delivered' },
  { id: '3', type: 'sent', text: 'Perfect! See you then.', time: '10:33 AM', status: 'read' },
  { id: '4', type: 'received', text: 'Thank you!', time: '10:35 AM', status: 'delivered' },
];

export default function Inbox({ onClose }: { onClose: () => void }) {
  const [selectedConversation, setSelectedConversation] = useState(MOCK_CONVERSATIONS[0]);
  const [message, setMessage] = useState('');
  const [activeView, setActiveView] = useState<'inbox' | 'logs'>('inbox');

  return (
    <div className="w-[450px] bg-white border-l border-[#e2e8f0] flex flex-col">
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#0f172a]">Inbox & Logs</h3>
            <span className="px-2 py-1 bg-[#fee2e2] text-[#991b1b] rounded-full text-xs font-semibold">3</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#f1f5f9] rounded">
            <FiX className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveView('inbox')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'inbox' ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
            }`}>
            Conversations
          </button>
          <button onClick={() => setActiveView('logs')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'logs' ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
            }`}>
            Message Logs
          </button>
        </div>
      </div>

      {activeView === 'inbox' ? (
        <>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-48 overflow-y-auto border-b border-[#e2e8f0]">
              {MOCK_CONVERSATIONS.map(conv => (
                <div key={conv.id} onClick={() => setSelectedConversation(conv)} className={`p-3 border-b border-[#f1f5f9] cursor-pointer hover:bg-[#f8fafc] ${
                    selectedConversation.id === conv.id ? 'bg-[#f0fdfa]' : ''
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
              ))}
            </div>

            <div className="flex-1 flex flex-col">
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
                {MOCK_MESSAGES.map(msg => (
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
                ))}
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
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {[
              { id: '1', to: '+91 98765 43210', template: 'Pickup Ready', status: 'delivered', time: '2m ago', cost: '₹0.50' },
              { id: '2', to: '+91 98765 43211', template: 'Invoice', status: 'delivered', time: '15m ago', cost: '₹0.50' },
              { id: '3', to: '+91 98765 43212', template: 'Refill Reminder', status: 'failed', time: '1h ago', cost: '₹0.00' },
            ].map(log => (
              <div key={log.id} className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-[#0f172a]">{log.to}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.status === 'delivered' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'
                  }`}>
                    {log.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#64748b]">
                  <span>{log.template}</span>
                  <span>{log.time}</span>
                  <span className="font-semibold">{log.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

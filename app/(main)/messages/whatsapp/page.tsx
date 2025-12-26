'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FaWhatsapp, FaSearch, FaPaperPlane, FaCheck, FaCheckDouble,
  FaEllipsisV, FaPlus, FaFilter, FaBolt, FaPaperclip, FaSmile, FaPlug
} from 'react-icons/fa';
import { whatsappApi, Conversation, Message } from '@/lib/api/whatsapp';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import TemplateSelector from '@/components/integrations/whatsapp/TemplateSelector';
import SessionExpiryTimer from '@/components/messages/whatsapp/SessionExpiryTimer';

export default function WhatsAppMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { storeId, loading: storeLoading } = useCurrentStore();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check WhatsApp connection status
  useEffect(() => {
    const checkConnection = async () => {
      if (!storeId) return;

      try {
        const status = await whatsappApi.getStatus(storeId);
        if (status.status === 'ACTIVE') {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('Failed to check WhatsApp status:', error);
        setConnectionStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      checkConnection();
    }
  }, [storeId]);

  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    loadConversations();
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadConversations();
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [connectionStatus, selectedConversation]);

  const handleTemplateSend = async (template: any) => {
    if (!selectedConversation || !storeId) return;

    try {
      setShowTemplateSelector(false);

      // Optimistic update
      const tempMessage: Message = {
        id: 'temp-' + Date.now(),
        conversationId: selectedConversation.id,
        direction: 'outbound',
        type: 'template',
        body: `[Template: ${template.name}]`,
        createdAt: new Date().toISOString(),
        status: 'sent',
      };
      setMessages(prev => [...prev, tempMessage]);

      await whatsappApi.sendTemplate({
        conversationId: selectedConversation.id,
        templateName: template.name,
        language: template.language,
        components: [] // TODO: Handle variables if needed
      });

      await loadMessages(selectedConversation.id);
      // Refresh conversation list to update status
      await loadConversations();
    } catch (error: any) {
      alert(`Failed to send template: ${error.message}`);
    }
  };

  useEffect(() => {
    loadConversations();
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadConversations();
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Filter conversations locally
    let result = conversations;

    // 1. Search filter (already handled by API but good for local updates)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.displayName?.toLowerCase().includes(q)) ||
        (c.phoneNumber.includes(q))
      );
    }

    // 2. Status filter
    if (filter === 'unread') {
      result = result.filter(c => c.unreadCount > 0);
    }

    setFilteredConversations(result);
  }, [conversations, filter, searchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!storeId) return;

    try {
      const response = await whatsappApi.getConversations(storeId, { search: searchQuery });
      setConversations(response.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await whatsappApi.getMessages(conversationId);
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConversation || sending) return;

    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      conversationId: selectedConversation.id,
      direction: 'outbound',
      type: 'text',
      body: messageInput,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessageInput('');
    setSending(true);

    try {
      await whatsappApi.sendMessage({
        conversationId: selectedConversation.id,
        body: messageInput.trim(),
      });

      // Reload messages to get the actual message with provider ID
      await loadMessages(selectedConversation.id);
    } catch (error: any) {
      alert(`Failed to send: ${error.message}`);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusIcon = (message: Message) => {
    if (message.direction !== 'outbound') return null;

    switch (message.status) {
      case 'sent':
        return <FaCheck className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <FaCheckDouble className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <FaCheckDouble className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <span className="text-xs text-red-500">Failed</span>;
      default:
        return null;
    }
  };

  if (loading || storeLoading || !storeId || connectionStatus === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Show "Not Connected" state
  if (connectionStatus === 'disconnected') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
        <div className="max-w-md text-center p-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaWhatsapp className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] mb-3">
            WhatsApp Not Connected
          </h1>
          <p className="text-gray-600 mb-6">
            You need to connect your WhatsApp Business Account before you can send or receive messages.
          </p>
          <a
            href="/integrations/whatsapp"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
          >
            <FaPlug className="w-4 h-4" />
            Connect WhatsApp
          </a>
          <p className="text-xs text-gray-500 mt-4">
            Go to Integrations → WhatsApp to set up your connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 bg-gray-50/50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Chats
              {filter === 'unread' && <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Unread Only</span>}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                className={`p-2 rounded-full transition-colors ${filter === 'unread' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                title="Filter Unread"
              >
                <FaFilter className="w-4 h-4" />
              </button>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
                title="New Chat"
              >
                <FaPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start new chat"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-lg focus:ring-2 focus:ring-green-500/50 text-sm text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <FaSearch className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                No conversations found
              </p>
              {filter === 'unread' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-2 text-green-600 hover:underline text-sm"
                >
                  Show all chats
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-left group border-b border-gray-50 dark:border-gray-800/50 ${selectedConversation?.id === conv.id ? 'bg-green-50/50 dark:bg-green-900/10 border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-300 font-semibold text-lg shadow-sm">
                      {conv.displayName?.[0] || conv.phoneNumber[0]}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-white dark:ring-gray-900">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-medium truncate ${conv.unreadCount > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
                        {conv.displayName || conv.phoneNumber}
                      </p>
                      {conv.lastMessageAt && (
                        <span className={`text-xs ${conv.unreadCount > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>

                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                      {conv.lastMessageBody || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] relative">
          {/* Chat Background Pattern */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

          {/* Thread Header */}
          <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                  {selectedConversation.displayName?.[0] || selectedConversation.phoneNumber[0]}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:underline decoration-gray-400">
                  {selectedConversation.displayName || selectedConversation.phoneNumber}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedConversation.phoneNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {selectedConversation.sessionActive ? (
                (() => {
                  // Calculate time remaining in 24-hour window
                  const lastCustomerMessage = selectedConversation.lastCustomerMessageAt
                    ? new Date(selectedConversation.lastCustomerMessageAt)
                    : null;

                  if (lastCustomerMessage) {
                    const expiryTime = new Date(lastCustomerMessage.getTime() + 24 * 60 * 60 * 1000);
                    const now = new Date();
                    const msRemaining = expiryTime.getTime() - now.getTime();
                    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
                    const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

                    if (msRemaining > 0) {
                      return (
                        <div className="flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Session: {hoursRemaining}h {minutesRemaining}m left
                        </div>
                      );
                    }
                  }
                  return null;
                })()
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                  <FaBolt className="w-3 h-3" />
                  Session Expired
                </div>
              )}
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <FaSearch className="w-5 h-5" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <FaEllipsisV className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10 custom-scrollbar">
            {messages.map((message, index) => {
              const isOutbound = message.direction === 'outbound';
              const showTail = index === messages.length - 1 || messages[index + 1]?.direction !== message.direction;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} group`}
                >
                  <div
                    className={`relative max-w-[65%] px-4 py-2 rounded-lg shadow-sm text-sm ${isOutbound
                      ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none'
                      }`}
                  >
                    {/* Message Tail */}
                    {showTail && (
                      <span className={`absolute top-0 w-3 h-3 ${isOutbound
                        ? '-right-2 bg-[#d9fdd3] dark:bg-[#005c4b] [clip-path:polygon(0_0,0%_100%,100%_0)]'
                        : '-left-2 bg-white dark:bg-gray-800 [clip-path:polygon(0_0,100%_0,100%_100%)]'
                        }`} />
                    )}

                    <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
                    <div className={`flex items-center gap-1 justify-end mt-1 select-none ${isOutbound ? 'text-gray-500 dark:text-green-100/70' : 'text-gray-400'}`}>
                      <span className="text-[10px]">
                        {formatTime(message.createdAt)}
                      </span>
                      {getStatusIcon(message)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Area */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
            {selectedConversation.sessionActive ? (
              <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <div className="flex gap-2 mb-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <FaSmile className="w-6 h-6" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <FaPaperclip className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-green-500/50 focus-within:border-green-500 transition-all shadow-sm">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message"
                    className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sending}
                  className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-md mb-0.5"
                >
                  <FaPaperPlane className="w-5 h-5 pl-0.5" />
                </button>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                    <FaBolt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-900 dark:text-amber-200">Session Expired</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      More than 24 hours have passed. Use a template to restart the chat.
                    </p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
                  onClick={() => setShowTemplateSelector(true)}
                >
                  <FaBolt className="w-3 h-3" />
                  Start Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 border-b-8 border-green-500">
          <div className="text-center max-w-md p-8">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaWhatsapp className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-light text-gray-800 dark:text-gray-200 mb-4">
              WhatsApp for HopeRx
            </h1>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Send and receive messages without keeping your phone online.
              <br />
              Use HopeRx on up to 4 linked devices and 1 phone.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
              <FaCheckDouble className="w-4 h-4" />
              <span>End-to-end encrypted</span>
            </div>
          </div>
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && storeId && (
        <TemplateSelector
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onSelect={handleTemplateSend}
        />
      )}
    </div>
  );
}

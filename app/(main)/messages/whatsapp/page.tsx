'use client';

import { useState, useEffect, useRef } from 'react';
import { FaWhatsapp, FaSearch, FaPaperPlane, FaCheckCircle, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { whatsappApi, Conversation, Message } from '@/lib/api/whatsapp';
import { useCurrentStore } from '@/hooks/useCurrentStore';

export default function WhatsAppMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { storeId, loading: storeLoading } = useCurrentStore();

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

  if (loading || storeLoading || !storeId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Conversations Sidebar */}
      <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <FaWhatsapp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">WhatsApp</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadConversations()}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No conversations yet. Incoming messages will appear here.
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${selectedConversation?.id === conv.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                      {conv.displayName?.[0] || conv.phoneNumber[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {conv.displayName || conv.phoneNumber}
                      </p>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {conv.lastMessageBody || 'No messages yet'}
                    </p>

                    {conv.unreadCount > 0 && (
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                          {conv.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          {/* Thread Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                  {selectedConversation.displayName?.[0] || selectedConversation.phoneNumber[0]}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {selectedConversation.displayName || selectedConversation.phoneNumber}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedConversation.phoneNumber}
                </p>
              </div>
            </div>

            {!selectedConversation.sessionActive && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                Session expired - Use template
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-2 rounded-2xl ${message.direction === 'outbound'
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <span className="text-xs opacity-70">
                      {formatTime(message.createdAt)}
                    </span>
                    {getStatusIcon(message)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={
                  selectedConversation.sessionActive
                    ? 'Type a message...'
                    : 'Session expired. Use a template to restart the conversation.'
                }
                disabled={!selectedConversation.sessionActive || sending}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!messageInput.trim() || !selectedConversation.sessionActive || sending}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <FaPaperPlane className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
          <div className="text-center">
            <FaWhatsapp className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a conversation
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

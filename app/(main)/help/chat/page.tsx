"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { FiSend, FiPaperclip, FiUser, FiCpu, FiCheckCircle } from "react-icons/fi";
import { useChat } from "@/hooks/useChat";

type MessageType = "ai" | "human" | "user";

interface ChatMessage {
    id: string;
    type: MessageType;
    content: string;
    timestamp: Date;
    suggestedActions?: string[];
}

const QUICK_CARDS = [
    { id: "1", title: "I can't print invoices", context: "pos" },
    { id: "2", title: "Stock levels not updating", context: "inventory" },
    { id: "3", title: "Unable to verify prescription", context: "prescriptions" },
    { id: "4", title: "WhatsApp integration not working", context: "integrations" }
];

export default function ChatPage() {
    const pathname = usePathname();
    const { messages: apiMessages, sendMessage, isLoading } = useChat();
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const ticketId = `TKT-${Date.now().toString().slice(-6)}`;

    // Convert API messages to UI format
    const uiMessages: ChatMessage[] = apiMessages.map((msg, index) => ({
        id: `api-${index}`,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.text,
        timestamp: new Date(msg.timestamp),
        suggestedActions: undefined
    }));

    // Combine with initial static message
    const allMessages: ChatMessage[] = [
        {
            id: "1",
            type: "ai",
            content: "Hi! I'm your HopeRx AI Assistant. How can I help you today?",
            timestamp: new Date(),
            suggestedActions: ["Check stock levels", "View recent sales", "GST filing help"]
        },
        ...uiMessages
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [allMessages.length, isLoading]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const text = inputValue;
        setInputValue(""); // Clear input immediately

        await sendMessage(text);
    };

    const handleQuickCard = (title: string) => {
        setInputValue(title);
        // Optional: Auto-send when clicking a quick card
        // sendMessage(title);
    };

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a]">Support Chat</h1>
                            <p className="text-sm text-[#64748b]">Help › Chat</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                                <FiCheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">Online</span>
                            </div>
                            <div className="px-3 py-1.5 bg-[#f1f5f9] rounded-lg">
                                <span className="text-xs text-[#94a3b8]">Ticket:</span>{" "}
                                <span className="text-sm font-mono font-semibold text-[#0f172a]">{ticketId}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-[#94a3b8]">Avg response time: ~2 minutes</div>
                </div>
            </div>

            {/* Quick Troubleshooting Cards */}
            <div className="bg-white border-b border-[#e2e8f0] p-4">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-sm font-semibold text-[#64748b] uppercase mb-3">Quick Help</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {QUICK_CARDS.map((card) => (
                            <button
                                key={card.id}
                                onClick={() => handleQuickCard(card.title)}
                                className="p-3 border-2 border-[#e2e8f0] rounded-lg hover:border-[#0ea5a3] hover:bg-[#f0fdfa] transition-all text-left"
                            >
                                <div className="text-sm font-medium text-[#0f172a]">{card.title}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {allMessages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`flex gap-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                                {/* Avatar */}
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.type === "ai"
                                        ? "bg-blue-100"
                                        : message.type === "human"
                                            ? "bg-green-100"
                                            : "bg-gray-200"
                                        }`}
                                >
                                    {message.type === "ai" ? (
                                        <FiCpu className="w-4 h-4 text-blue-600" />
                                    ) : (
                                        <FiUser className="w-4 h-4 text-gray-600" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div>
                                    <div
                                        className={`px-4 py-3 rounded-2xl ${message.type === "ai"
                                            ? "bg-[#dbeafe] text-[#1e3a8a]"
                                            : message.type === "human"
                                                ? "bg-[#d1fae5] text-[#065f46]"
                                                : "bg-[#f1f5f9] text-[#0f172a]"
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    </div>

                                    {/* Suggested Actions */}
                                    {message.suggestedActions && (
                                        <div className="flex gap-2 mt-2">
                                            {message.suggestedActions.map((action, idx) => (
                                                <button
                                                    key={idx}
                                                    className="px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
                                                >
                                                    {action}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="text-xs text-[#94a3b8] mt-1">
                                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <FiCpu className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="px-4 py-3 bg-[#dbeafe] rounded-2xl">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Bar */}
            <div className="bg-white border-t border-[#e2e8f0] p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-end gap-3">
                        <button className="p-3 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] transition-colors">
                            <FiPaperclip className="w-5 h-5 text-[#64748b]" />
                        </button>
                        <div className="flex-1">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Type your message... (Shift+Enter for new line)"
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] resize-none"
                                rows={1}
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim()}
                            className="p-3 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiSend className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Hand-off to Human */}
                    <div className="mt-3 text-center">
                        <button className="text-sm text-[#0ea5a3] font-medium hover:underline">
                            Talk to a Support Agent →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

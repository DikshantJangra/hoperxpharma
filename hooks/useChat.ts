import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    isOpen: boolean;
    sessionId: string;
}

export const useChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');

    // Initialize session ID on mount
    useEffect(() => {
        const storedSessionId = localStorage.getItem('gemini_session_id');
        if (storedSessionId) {
            setSessionId(storedSessionId);
        } else {
            const newSessionId = uuidv4();
            localStorage.setItem('gemini_session_id', newSessionId);
            setSessionId(newSessionId);
        }
    }, []);

    const toggleChat = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        // Add user message immediately
        const userMessage: Message = {
            role: 'user',
            text,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Get current context
            const context = {
                currentPage: window.location.pathname,
                // Add more context here if needed (user role, store ID, etc.)
                // These will be handled by the backend extracting from the JWT token
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/gemini/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add Authorization header if you have the token stored
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    message: text,
                    sessionId,
                    context,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Failed to send message');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || data.response || 'Failed to send message');
            }

            // Add bot response
            const botMessage: Message = {
                role: 'model',
                text: data.message || data.response,
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            // Add error message
            let errorText = error instanceof Error ? error.message : 'I apologize, but I encountered an error. Please try again later.';

            // Format Gemini Quota errors
            if (errorText.includes('Quota exceeded') || errorText.includes('429')) {
                const retryMatch = errorText.match(/Please retry in ([0-9.]+)s/);
                const waitTime = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 'a few';
                errorText = `⚠️ **Service Busy**: The AI assistant is currently experiencing high traffic.\n\nPlease try again in ${waitTime} seconds.`;
            } else if (errorText.includes('Gemini API error')) {
                // Hide "Gemini API error" prefix
                errorText = errorText.replace('Gemini API error:', '').trim();
            }

            const errorMessage: Message = {
                role: 'model',
                text: errorText,
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    const clearHistory = useCallback(async () => {
        setMessages([]);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/gemini/session/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }, [sessionId]);

    return {
        isOpen,
        toggleChat,
        messages,
        sendMessage,
        isLoading,
        clearHistory
    };
};

'use client';

import { useState } from 'react';
import { FiMail, FiX, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientEmail?: string;
    recipientName?: string;
    subject?: string;
    defaultMessage?: string;
    contextType?: 'PO' | 'INVOICE' | 'VENDOR' | 'PATIENT';
    contextId?: string;
}

export default function SendEmailModal({
    isOpen,
    onClose,
    recipientEmail = '',
    recipientName = '',
    subject = '',
    defaultMessage = '',
    contextType,
    contextId,
}: SendEmailModalProps) {
    const [to, setTo] = useState(recipientEmail);
    const [emailSubject, setEmailSubject] = useState(subject);
    const [body, setBody] = useState(defaultMessage);
    const [isSending, setIsSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSending(true);

        try {
            const response = await fetch('/api/v1/email/send', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    to,
                    subject: emailSubject,
                    bodyHtml: `<html><body style="font-family: Arial, sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</body></html>`,
                    context: contextType && contextId ? { type: contextType, id: contextId } : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send email');
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setError(null);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to send email');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-lg flex items-center justify-center">
                                <FiMail className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[#0f172a]">Send Email</h3>
                                {recipientName && (
                                    <p className="text-sm text-[#64748b]">to {recipientName}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSend} className="p-6 space-y-4">
                        {/* To */}
                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                To
                            </label>
                            <input
                                type="email"
                                required
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                placeholder="recipient@example.com"
                                className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                Subject
                            </label>
                            <input
                                type="text"
                                required
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                placeholder="Email subject"
                                className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                Message
                            </label>
                            <textarea
                                required
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={8}
                                placeholder="Write your message here..."
                                className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Success/Error Messages */}
                        {success && (
                            <div className="p-4 bg-[#d1fae5] border border-[#10b981] rounded-lg flex items-center gap-3">
                                <FiCheckCircle className="w-5 h-5 text-[#10b981]" />
                                <p className="text-sm text-[#065f46] font-medium">Email sent successfully!</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-[#fee2e2] border border-[#ef4444] rounded-lg flex items-start gap-3">
                                <FiAlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-[#dc2626]">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 border border-[#e2e8f0] text-[#64748b] font-medium rounded-lg hover:bg-[#f8fafc] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSending || success}
                                className="flex-1 px-6 py-2.5 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Sending...</span>
                                    </>
                                ) : success ? (
                                    <>
                                        <FiCheckCircle className="w-4 h-4" />
                                        <span>Sent!</span>
                                    </>
                                ) : (
                                    <>
                                        <FiSend className="w-4 h-4" />
                                        <span>Send Email</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

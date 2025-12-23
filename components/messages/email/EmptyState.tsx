'use client';

import { FiMail, FiZap } from 'react-icons/fi';

interface EmptyStateProps {
    onConfigure: () => void;
    isLoading?: boolean;
}

export default function EmptyState({ onConfigure, isLoading = false }: EmptyStateProps) {
    return (
        <div className="flex items-center justify-center h-full bg-[#f8fafc]">
            <div className="max-w-md text-center px-6 py-12">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-2xl flex items-center justify-center shadow-lg">
                            <FiMail className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#f59e0b] rounded-full flex items-center justify-center shadow-md">
                            <FiZap className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-bold text-[#0f172a] mb-3">
                    Email not set up yet
                </h2>

                {/* Description */}
                <p className="text-[#64748b] mb-8 leading-relaxed">
                    Connect your email once to start sending emails directly from HopeRx —
                    invoices, purchase orders, reminders & more.
                </p>

                {/* Benefits List */}
                <div className="mb-8 space-y-3 text-left">
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5 mt-0.5 bg-[#d1fae5] rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>
                        </div>
                        <p className="text-sm text-[#475569]">
                            Send emails from <strong>your email address</strong>
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5 mt-0.5 bg-[#d1fae5] rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>
                        </div>
                        <p className="text-sm text-[#475569]">
                            Send emails without leaving the platform
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5 mt-0.5 bg-[#d1fae5] rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>
                        </div>
                        <p className="text-sm text-[#475569]">
                            Works with Gmail, Zoho, Outlook & more
                        </p>
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={onConfigure}
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-[#059669] hover:to-[#047857] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Connecting...</span>
                        </>
                    ) : (
                        <>
                            <FiMail className="w-5 h-5" />
                            <span>Connect your Email</span>
                        </>
                    )}
                </button>

                {/* Security Note */}
                <p className="text-xs text-[#94a3b8] mt-6 flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Your credentials are encrypted and secure
                </p>
            </div>
        </div>
    );
}

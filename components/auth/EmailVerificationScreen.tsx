"use client";

import React, { useState, useEffect } from 'react';
import { HiMail, HiRefresh } from 'react-icons/hi';

interface EmailVerificationScreenProps {
    email: string;
    onResend: () => Promise<void>;
    resendCooldown?: number; // in seconds, default 60
}

export function EmailVerificationScreen({
    email,
    onResend,
    resendCooldown = 60
}: EmailVerificationScreenProps) {
    const [countdown, setCountdown] = useState(resendCooldown);
    const [isResending, setIsResending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleResend = async () => {
        if (countdown > 0 || isResending) return;

        setIsResending(true);
        try {
            await onResend();
            setShowSuccess(true);
            setCountdown(resendCooldown); // Reset countdown

            // Hide success message after 2 seconds
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error('Resend failed:', error);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center mb-2">
                <div className="relative">
                    {/* Outer pulse circle */}
                    <div className="absolute inset-0 bg-[#12B981]/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />

                    {/* Icon container */}
                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#12B981] to-[#10A37F] rounded-full flex items-center justify-center shadow-lg shadow-[#12B981]/30">
                        <HiMail className="text-white text-4xl" />
                    </div>

                    {/* Checkmark badge */}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-[#12B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Headline */}
            <div className="text-center space-y-3">
                <h2 className="text-[26px] font-black text-black/70 leading-tight">
                    Check your email
                </h2>
            </div>

            {/* Email Display */}
            <div className="text-center space-y-4">
                <p className="text-[16px] text-black/60 leading-relaxed">
                    We sent a secure sign-in link to:
                </p>

                <div className="inline-block px-4 py-2 bg-[#F0FDF4] rounded-lg">
                    <p className="text-[17px] font-semibold text-[#12B981]">
                        {email}
                    </p>
                </div>

                <p className="text-[15px] text-black/50">
                    Click the link in your email to continue
                </p>
            </div>

            {/* Resend Section */}
            <div className="text-center pt-4">
                {showSuccess ? (
                    <div className="inline-flex items-center gap-2 text-[#12B981] text-sm font-medium animate-in fade-in zoom-in duration-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Link sent!
                    </div>
                ) : countdown > 0 ? (
                    <p className="text-sm text-black/40">
                        Resend link in {countdown}s
                    </p>
                ) : (
                    <button
                        onClick={handleResend}
                        disabled={isResending}
                        className="inline-flex items-center gap-2 text-[#12B981] hover:text-[#10A37F] font-medium text-sm transition-all duration-200 hover:gap-3 disabled:opacity-50"
                    >
                        <HiRefresh className={`text-lg ${isResending ? 'animate-spin' : ''}`} />
                        {isResending ? 'Sending...' : 'Resend link'}
                    </button>
                )}
            </div>

            {/* Help Box */}
            <div className="mt-8 p-5 bg-[#F9FAFB] rounded-xl border border-[#F3F4F6]">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                        <svg className="w-full h-full text-[#12B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-black/70">
                            Didn't receive the email?
                        </p>
                        <ul className="text-[13px] text-black/50 space-y-1 leading-relaxed">
                            <li className="flex items-start gap-2">
                                <span className="text-[#12B981] mt-0.5">•</span>
                                <span>Check your spam folder</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#12B981] mt-0.5">•</span>
                                <span>Make sure you entered the correct email</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#12B981] mt-0.5">•</span>
                                <span>Wait a moment, emails can take up to 2 minutes</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Support Link */}
            <p className="text-center text-[13px] text-black/50 pt-2">
                Need help?{' '}
                <a
                    href="mailto:support@hoperxpharma.com"
                    className="text-[#12B981] hover:text-[#10A37F] font-medium transition-colors"
                >
                    Contact support
                </a>
            </p>
        </div>
    );
}

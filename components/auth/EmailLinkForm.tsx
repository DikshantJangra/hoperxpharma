"use client";

import React, { useState } from 'react';
import { MdOutlineMailLock } from 'react-icons/md';
import { apiClient } from '@/lib/api/client';

interface EmailLinkFormProps {
    mode: 'login' | 'signup';
    onBack: () => void;
}

export function EmailLinkForm({ mode, onBack }: EmailLinkFormProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    // Smart Email Persistence
    React.useEffect(() => {
        const savedEmail = localStorage.getItem('user_email');
        if (savedEmail) {
            setEmail(savedEmail);
        }
    }, []);

    const clearEmail = () => {
        setEmail('');
        localStorage.removeItem('user_email');
    };

    // Email validation - must have @ and . after @
    const isEmailValid = (email: string) => {
        if (!email) return false;
        const atIndex = email.indexOf('@');
        if (atIndex === -1) return false;
        const afterAt = email.slice(atIndex + 1);
        return afterAt.includes('.');
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await apiClient.post('/auth/send-magic-link', {
                email,
                mode
            });

            // Success!
            setSent(true);

            // Save email for next time
            localStorage.setItem('user_email', email);
        } catch (error: any) {
            console.error('Error sending magic link:', error);
            const { default: toast } = await import('react-hot-toast');

            // Check for specific error message about existing account
            if (error.message?.includes('already exists')) {
                toast.error(error.message, {
                    duration: 5000,
                    icon: '⚠️',
                });
            } else if (error.message?.includes('No account found')) {
                toast.error('No account found with this email. Please sign up first!', {
                    duration: 5000,
                    icon: '❌',
                });
            } else {
                toast.error(error.message || 'Failed to send email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="relative text-center py-6 overflow-hidden">
                {/* White Background Expansion - Radiates from center */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-full bg-white rounded-full animate-[expand-white_0.8s_ease-out_forwards] scale-0"
                        style={{ transformOrigin: 'center center' }}></div>
                </div>

                {/* Content - Shows after background expands */}
                <div className="relative z-10 animate-in fade-in zoom-in duration-300 delay-500">
                    {/* Success Icon */}
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Check your email!</h3>
                    <p className="text-gray-600 mb-4">
                        We sent a secure link to:
                    </p>
                    <p className="font-semibold text-emerald-600 mb-6 text-lg">
                        {email}
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Click the link in your email to {mode === 'login' ? 'sign in' : 'verify & create account'}.
                        The link expires in 15 minutes.
                    </p>

                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                        Back to sign in options
                    </button>
                </div>

                {/* CSS Animation */}
                <style jsx>{`
                    @keyframes expand-white {
                        0% {
                            transform: scale(0);
                            opacity: 1;
                        }
                        100% {
                            transform: scale(3);
                            opacity: 1;
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2 mb-6">
                <h2 className="text-[24px] font-black text-black/70">
                    {mode === 'signup' ? 'Create account with link' : 'Sign in with link'}
                </h2>
                <p className="text-black/50 text-sm">
                    {mode === 'signup'
                        ? 'Enter your email to verify and create your account'
                        : 'Enter your email to receive a secure sign-in link'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email address
                    </label>
                    <div className="relative">
                        <MdOutlineMailLock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 pl-12 pr-10 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                            placeholder="pharmacy@example.com"
                            required
                            autoFocus
                        />
                        {email && (
                            <button
                                type="button"
                                onClick={clearEmail}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Clear saved email"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Trust Indicator */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs text-emerald-800 flex items-start gap-2">
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>
                            Secure links expire in 15 minutes and can only be used once.
                            We'll never share your email.
                        </span>
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !isEmailValid(email)}
                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sending...
                        </span>
                    ) : (
                        mode === 'signup' ? 'Send verification link' : 'Send sign-in link'
                    )}
                </button>
            </form>

            {/* Back Button - At Bottom */}
            <div className="text-center mt-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors w-full justify-center"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-xs font-medium">Back</span>
                </button>
            </div>
        </div>
    );
}

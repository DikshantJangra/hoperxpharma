"use client";

import React, { useState } from 'react';
import { HiX } from 'react-icons/hi';
import { MdOutlineMailLock } from 'react-icons/md';

interface MagicLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'login' | 'signup';
}

export function MagicLinkModal({ isOpen, onClose, mode }: MagicLinkModalProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // TODO: Call magic link API
        await new Promise(resolve => setTimeout(resolve, 1000));

        setLoading(false);
        setSent(true);
    };

    const handleClose = () => {
        setSent(false);
        setEmail('');
        onClose();
    };

    const title = mode === 'login' ? 'Sign in with link' : 'Sign up with link';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in duration-200">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                    <HiX size={24} />
                </button>

                {sent ? (
                    /* Success/Confirmation State */
                    <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
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
                            Click the link in your email to {mode === 'login' ? 'sign in' : 'create your account'}.
                            The link expires in 15 minutes.
                        </p>

                        {/* Resend */}
                        <button
                            onClick={handleClose}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                            Didn't receive it? Try again
                        </button>
                    </div>
                ) : (
                    /* Email Input State */
                    <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                        <p className="text-gray-600 mb-6 text-sm">
                            Enter your email and we'll send you a secure sign-{mode === 'login' ? 'in' : 'up'} link.
                        </p>

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
                                        className="w-full h-12 pl-12 pr-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                                        placeholder="pharmacy@example.com"
                                        required
                                        autoFocus
                                    />
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
                                disabled={loading || !email}
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
                                    'Send sign-in link'
                                )}
                            </button>
                        </form>

                        {/* Cancel */}
                        <button
                            onClick={handleClose}
                            className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

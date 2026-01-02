"use client";

import React, { useState, useEffect } from 'react';
import { MdOutlineMailLock } from 'react-icons/md';
import { HiCheckCircle } from 'react-icons/hi';

interface EmailEntryFormProps {
    onSubmit: (email: string) => Promise<void>;
    loading?: boolean;
}

export function EmailEntryForm({ onSubmit, loading = false }: EmailEntryFormProps) {
    const [email, setEmail] = useState('');
    const [isValidEmail, setIsValidEmail] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Real-time email validation
    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsValidEmail(emailRegex.test(email));
    }, [email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidEmail || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(email);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Headline */}
            <div className="text-center space-y-3">
                <h2 className="text-[26px] font-black text-black/70 leading-tight">
                    Create your account
                </h2>
                <p className="text-black/50 text-sm leading-tight">
                    Welcome to the future of pharmacy management.<br />
                    Enter your email to get started.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                    <label className="block text-black/70 text-sm font-medium mb-2 text-left">
                        Email address
                    </label>
                    <div className="relative">
                        {/* Icon */}
                        <MdOutlineMailLock
                            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused ? 'text-[#12B981]' : 'text-gray-400'
                                }`}
                            size={20}
                        />

                        {/* Divider */}
                        <span className="absolute left-11 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-300" />

                        {/* Input Field */}
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className={`
                w-full h-[56px] pl-14 pr-12 
                rounded-xl text-[15px] text-gray-700
                placeholder:text-gray-400
                bg-white
                transition-all duration-200
                outline-none
                ${isFocused
                                    ? 'border-2 border-[#12B981] ring-2 ring-[#12B981]/10'
                                    : 'border-2 border-[#E5E7EB] hover:border-[#6EE7B7]'
                                }
              `}
                            placeholder="pharmacy@example.com"
                            required
                            disabled={isSubmitting}
                        />

                        {/* Validation Checkmark */}
                        {isValidEmail && email && (
                            <HiCheckCircle
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#12B981] animate-in fade-in zoom-in duration-200"
                                size={22}
                            />
                        )}
                    </div>
                </div>

                {/* Privacy Reassurance */}
                <div className="text-center">
                    <p className="text-[13px] text-black/50 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-[#12B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        We'll send you a secure sign-in link. No password needed.
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!isValidEmail || isSubmitting}
                    className={`
            w-full h-[56px] rounded-xl
            font-semibold text-[16px] tracking-wide
            transition-all duration-200
            ${isValidEmail && !isSubmitting
                            ? 'bg-[#12B981] hover:bg-[#10A37F] text-white shadow-[0_4px_12px_rgba(18,185,129,0.3)] hover:shadow-[0_6px_16px_rgba(18,185,129,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }
          `}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sending link...
                        </span>
                    ) : (
                        'Continue'
                    )}
                </button>

                {/* Login Link */}
                <p className="text-center text-gray-600 text-sm">
                    Already have an account?{' '}
                    <a href="/login" className="text-[#12B981] hover:text-[#10A37F] font-medium transition-colors">
                        Sign in
                    </a>
                </p>
            </form>
        </div>
    );
}

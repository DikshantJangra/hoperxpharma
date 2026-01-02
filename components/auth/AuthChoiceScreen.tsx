"use client";

import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';

interface AuthChoiceScreenProps {
    mode: 'login' | 'signup';
    onSelectMethod: (method: 'google' | 'magic' | 'password') => void;
}

export function AuthChoiceScreen({ mode, onSelectMethod }: AuthChoiceScreenProps) {
    const isLogin = mode === 'login';
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header - Simplified */}
            <div className="text-center space-y-2">
                <h2 className="text-[26px] font-bold text-gray-900 leading-tight">
                    {isLogin ? 'Welcome back!' : 'Join HopeRxPharma'}
                </h2>
                <p className="text-gray-500 text-sm">
                    {isLogin ? 'How do you want to sign in?' : 'How do you want to sign up?'}
                </p>
            </div>

            {/* Auth Options - Reordered with email link at bottom */}
            <div className="space-y-3 pt-2">

                {/* Google - First */}
                <button
                    onClick={() => {
                        // Ensure we don't double stack /api/v1
                        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/v1\/?$/, '');
                        const intent = isLogin ? 'login' : 'signup';
                        window.location.href = `${baseUrl}/v1/auth/google?intent=${intent}`;
                    }}
                    className="w-full h-12 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200 flex items-center gap-3 px-4 group"
                >
                    <FcGoogle size={20} className="flex-shrink-0" />
                    <div className="flex-1 text-left">
                        <p className="font-medium text-gray-700 text-sm">
                            Continue with Google
                        </p>
                    </div>
                    <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Password - Visible for both, but different text */}
                <button
                    onClick={() => onSelectMethod('password')}
                    className="w-full h-12 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200 flex items-center gap-3 px-4 group"
                >
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div className="flex-1 text-left">
                        <p className="font-medium text-gray-700 text-sm">
                            {isLogin ? 'Use a password instead' : 'Sign up with Email'}
                        </p>
                    </div>
                    <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Divider */}
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-white text-gray-400">or</span>
                    </div>
                </div>

                {/* Email Link - PRIMARY at Bottom */}
                <button
                    onClick={() => onSelectMethod('magic')}
                    className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all duration-200 flex items-center gap-3 px-5 group shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                >
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-semibold text-[15px]">
                            {isLogin ? 'Send me a sign-in link' : 'Sign up with Magic Link'}
                        </p>
                    </div>
                    <svg
                        className="w-5 h-5 text-white/80 group-hover:text-white transition-colors flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Trust Indicator - Below email link button */}
                <p className="text-xs text-center text-gray-500 -mt-1">
                    Links expire in 15 minutes. We'll never share your email.
                </p>
            </div>

            {/* Footer Link - Subtle */}
            <div className="text-center pt-2">
                {isLogin ? (
                    <p className="text-sm text-gray-500">
                        New to HopeRxPharma?{' '}
                        <button
                            onClick={() => router.push('/signup')}
                            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors bg-transparent border-none p-0 cursor-pointer"
                        >
                            Create account
                        </button>
                    </p>
                ) : (
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <button
                            onClick={() => router.push('/login')}
                            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors bg-transparent border-none p-0 cursor-pointer"
                        >
                            Sign in
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}

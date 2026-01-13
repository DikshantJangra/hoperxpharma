"use client";

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface AuthChoiceScreenProps {
    mode: 'login' | 'signup';
    onSelectMethod: (method: 'google' | 'magic' | 'password') => void;
}

export function AuthChoiceScreen({ mode, onSelectMethod }: AuthChoiceScreenProps) {
    const isLogin = mode === 'login';
    const router = useRouter();
    const [isCheckingServer, setIsCheckingServer] = useState(false);
    const [showRetry, setShowRetry] = useState(false);

    // Check if backend is ready by polling health endpoint
    const waitForBackend = async (): Promise<boolean> => {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/v1\/?$/, '');
        const healthUrl = `${baseUrl}/v1/health`;
        const maxAttempts = 25; // ~50 seconds total
        const initialDelay = 1000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(healthUrl, {
                    method: 'GET',
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    return true;
                }
            } catch (error) {
                // Server not ready yet, continue polling
            }

            // Wait before next attempt (fixed 2s delay for consistent ~50s total)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return false;
    };

    const handleGoogleAuth = async () => {
        setIsCheckingServer(true);
        setShowRetry(false);

        try {
            const isReady = await waitForBackend();

            if (isReady) {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
                const intent = isLogin ? 'login' : 'signup';
                const googleAuthUrl = `${apiUrl}/auth/google?intent=${intent}`;
                
                // Test if route exists before redirecting
                try {
                    const testResponse = await fetch(googleAuthUrl, {
                        method: 'HEAD',
                        redirect: 'manual'
                    });
                    
                    // If we get 404, show error instead of redirecting
                    if (testResponse.status === 404) {
                        toast.error('Google sign-in is not available at the moment.');
                        setIsCheckingServer(false);
                        setShowRetry(true);
                        return;
                    }
                } catch (error) {
                    // Network error or CORS - proceed with redirect anyway
                }
                
                window.location.href = googleAuthUrl;
            } else {
                toast.error('Server is taking too long to respond.');
                setIsCheckingServer(false);
                setShowRetry(true);
            }
        } catch (error) {
            toast.error('Failed to connect to server.');
            setIsCheckingServer(false);
            setShowRetry(true);
        }
    };

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
                    onClick={handleGoogleAuth}
                    disabled={isCheckingServer}
                    className={`w-full h-12 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 flex items-center gap-3 px-4 group ${isCheckingServer
                        ? 'opacity-80 cursor-wait'
                        : 'hover:bg-gray-50 hover:border-gray-300'
                        }`}
                >
                    {isCheckingServer ? (
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    ) : (
                        <FcGoogle size={20} className="flex-shrink-0" />
                    )}
                    <div className="flex-1 text-left">
                        <p className={`font-medium text-sm ${isCheckingServer ? 'text-emerald-600' : 'text-gray-700'}`}>
                            {isCheckingServer ? 'Connecting...' : 'Continue with Google'}
                        </p>
                    </div>
                    {!isCheckingServer && (
                        <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    )}
                </button>

                {/* Retry Button - Shows after timeout */}
                {showRetry && (
                    <button
                        onClick={handleGoogleAuth}
                        className="w-full h-10 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry Connection
                    </button>
                )}

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

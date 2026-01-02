"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiClient, tokenManager } from '@/lib/api/client';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');
    const { checkAuth } = useAuthStore();

    const verifyingRef = useRef(false);

    useEffect(() => {
        const verifyToken = async () => {
            const token = searchParams?.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Invalid or missing token');
                return;
            }

            // Prevent strict mode double-invocation
            if (verifyingRef.current) return;
            verifyingRef.current = true;

            try {
                // Use apiClient for consistent request handling
                const data = await apiClient.get(`/auth/verify-magic-link?token=${token}`);

                // Manually set token to ensure checkAuth finds it immediately without relying on cookie refresh
                // This fixes the "Refresh token is required" error
                if (data.token) {
                    tokenManager.setAccessToken(data.token);
                }

                // Initialize auth state
                await checkAuth();

                setStatus('success');
                setMessage('Successfully authenticated! Redirecting...');

                // Smart Redirect Logic
                // validAuth checkAuth updates the store. We get the fresh state to decide navigation.
                const state = useAuthStore.getState();
                const user = state.user;
                const hasStore = state.hasStore;
                const isAdmin = user?.role === 'ADMIN';

                // Redirect to dashboard
                setTimeout(() => {
                    // Fix: Redirect ANY user without a store to onboarding, not just admins
                    // This ensures new signups (who default to PHARMACIST role) go to onboarding
                    if (!hasStore) {
                        console.log('No store found, redirecting to onboarding...');
                        router.push('/onboarding');
                    } else {
                        console.log('Store found, redirecting to dashboard...');
                        router.push('/dashboard/overview');
                    }
                }, 100);
            } catch (error: any) {
                console.error('Verification error:', error);

                // Show toast notification for better UX
                try {
                    const { default: toast } = await import('react-hot-toast');
                    toast.error(error.message || 'Failed to verify magic link');
                } catch (e) {
                    console.error('Failed to load toast notification', e);
                }

                setStatus('error');
                setMessage(error.message || 'Failed to verify magic link');

                // CRITICAL: We explicitly DO NOT redirect here.
                // The user must click 'Return to login' manually.
            }
        };

        verifyToken();
    }, [searchParams, router, checkAuth]);

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-10 py-10">
            {/* Logo */}
            <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4 flex justify-center items-center w-[98px] h-[98px]">
                    {/* Animated rings */}
                    <div className="absolute w-full h-full rounded-full bg-[#12B981]/15 animate-ping" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute w-full h-full rounded-full bg-[#12B981]/10 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
                    <div className="absolute w-full h-full rounded-full bg-[#12B981]/15"></div>
                    <div className="relative flex justify-center items-center font-bold text-white text-[26px] w-[66px] h-[66px] rounded-full bg-[#12B981]">
                        <span className="absolute" style={{ transform: 'translate(-6.5px, -1px)' }}>R</span>
                        <span className="absolute" style={{ transform: 'translate(6.5px, 1px)' }}>x</span>
                    </div>
                </div>

                <h1 className="text-[32px] font-bold tracking-tighter mb-3">
                    <span className="text-[#A0A0A0]">Hope</span>
                    <span className="text-[#12B981] relative">
                        Rx
                        <span className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-[#12B981] rounded-full"></span>
                        <span className="absolute -bottom-3 left-0 right-0 h-[3px] bg-[#12B981] rounded-full"></span>
                    </span>
                    <span className="text-[#A0A0A0]">Pharma</span>
                </h1>
            </div>

            {/* Status Icons and Messages */}
            <div className="text-center">
                {status === 'verifying' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 mx-auto mb-6">
                            <svg className="animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying your link...</h2>
                        <p className="text-gray-600">Please wait while we authenticate you.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
                        <p className="text-gray-600">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                            Return to login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyMagicLink() {
    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-6">
            <Suspense fallback={
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-10 py-10 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                </div>
            }>
                <VerifyContent />
            </Suspense>
        </div>
    );
}

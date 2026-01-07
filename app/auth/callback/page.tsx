'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { authApi } from '@/lib/api/auth';
import { toast } from 'react-hot-toast';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        if (!searchParams) return;

        const error = searchParams.get('error');
        if (error) {
            toast.error('Authentication failed. Please try again.');
            router.push('/login');
            return;
        }

        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const token = searchParams.get('token'); // Legacy magic link support

        const handleCallback = async () => {
            try {
                // OAuth flow: accessToken + refreshToken in URL
                if (accessToken && refreshToken) {
                    // Call set-session to establish httpOnly cookies
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/set-session`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ accessToken, refreshToken })
                    });

                    if (!response.ok) throw new Error('Failed to establish session');

                    // Store access token in memory
                    const { tokenManager } = await import('@/lib/api/client');
                    tokenManager.saveTokens(accessToken);

                    // Clear tokens from URL
                    window.history.replaceState({}, '', '/auth/callback');
                }
                // Magic link flow: single token in URL (cookies already set by backend)
                else if (token) {
                    const { tokenManager } = await import('@/lib/api/client');
                    tokenManager.saveTokens(token);
                } else {
                    router.push('/login');
                    return;
                }

                authApi.setLoggedInCookie();
                await checkAuth();
                toast.success('Successfully logged in!');

                const needsOnboarding = searchParams.get('onboarding');
                if (needsOnboarding === 'true') {
                    router.push('/onboarding/welcome');
                } else {
                    router.push('/dashboard/overview');
                }
            } catch (err) {
                console.error('Callback error:', err);
                toast.error('Login processing failed');
                router.push('/login');
            }
        };

        handleCallback();
    }, [searchParams, router, checkAuth]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700">Completing sign in...</h2>
                <p className="text-gray-500 mt-2">Please wait while we redirect you.</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}

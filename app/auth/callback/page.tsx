'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'react-hot-toast';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        if (!searchParams) return;

        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            toast.error('Authentication failed. Please try again.');
            router.push('/login');
            return;
        }

        if (token) {
            const handleCallback = async () => {
                try {
                    // Store the token
                    localStorage.setItem('accessToken', token);

                    // Store refresh token if present (for cross-domain fallback)
                    const refreshToken = searchParams.get('refreshToken');
                    if (refreshToken) {
                        localStorage.setItem('refreshToken', refreshToken);
                    }

                    // Set cookies for middleware
                    document.cookie = `logged_in=true; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
                    document.cookie = `token=${token}; path=/; max-age=${15 * 60}`; // 15 mins

                    // IMPORTANT: Call checkAuth to properly initialize the auth store
                    // This fetches user profile and sets all state correctly
                    await checkAuth();

                    toast.success('Successfully logged in!');

                    // Check if user needs onboarding
                    const needsOnboarding = searchParams.get('onboarding');

                    // Navigate to appropriate page
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
        } else {
            // No token, no error -> invalid access
            router.push('/login');
        }
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

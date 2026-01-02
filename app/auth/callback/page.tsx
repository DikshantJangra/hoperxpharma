'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'react-hot-toast';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuthStore();

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
            try {
                // Determine if we should parse user/permissions/etc from token or fetch profile
                // For now, the backend only returns options.accessTokens (aliased as token) in URL
                // We trust the token and let auth-store handle it (fetch profile usually)

                // Assuming auth-store has a method to set token directly, or we assume login accepts partial?
                // Actually useAuthStore often has `setToken` or `login` that takes user/token.
                // Let's verify useAuthStore usage.
                // But typically:
                // Store the token
                localStorage.setItem('accessToken', token);

                // IMPORTANT: Set the logged_in cookie so middleware knows we are auth'd
                // This prevents the redirect loop or immediate refresh attempt
                document.cookie = `logged_in=true; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
                document.cookie = `token=${token}; path=/; max-age=${15 * 60}`; // 15 mins (optional, middleware checks this too)

                // Force auth store to re-check immediately
                // We trust the token is valid because we just got it

                toast.success('Successfully logged in!');

                // Check if user needs onboarding
                const needsOnboarding = searchParams.get('onboarding');

                // Use window.location to force a full state refresh on the new page
                // enabling the auth-store to initialize cleanly from storage
                if (needsOnboarding === 'true') {
                    window.location.href = '/onboarding/welcome';
                } else {
                    window.location.href = '/dashboard/overview';
                }
            } catch (err) {
                console.error('Callback error:', err);
                toast.error('Login processing failed');
                router.push('/login');
            }
        } else {
            // No token, no error -> invalid access
            router.push('/login');
        }
    }, [searchParams, router, login]);

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

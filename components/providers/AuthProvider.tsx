'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { onboardingApi } from '@/lib/api/onboarding';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth, isAuthenticated, isLoading, hasStore } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Check onboarding completion status
    useEffect(() => {
        const checkOnboardingStatus = async () => {
            if (isAuthenticated && !isLoading) {
                try {
                    const progress = await onboardingApi.getProgress();
                    const isComplete = progress?.isComplete || false;
                    // If user has a store, consider onboarding complete regardless of progress flag
                    setOnboardingComplete(hasStore || isComplete);
                } catch (error) {
                    console.error('Failed to check onboarding status:', error);
                    // If user has a store, consider onboarding complete
                    setOnboardingComplete(hasStore);
                }
            }
        };

        if (isAuthenticated && !isLoading) {
            checkOnboardingStatus();
        }
    }, [isAuthenticated, isLoading, hasStore]);

    useEffect(() => {
        console.log('AuthProvider Effect:', {
            isAuthenticated,
            hasStore,
            onboardingComplete,
            isLoading,
            pathname
        });

        if (!isLoading && onboardingComplete !== null) {
            if (isAuthenticated) {
                const isPublicRoute = ['/login', '/signup', '/'].includes(pathname);
                const isOnboardingRoute = pathname.startsWith('/onboarding');
                const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/(main)');

                if (isPublicRoute) {
                    // Redirect authenticated users from public routes
                    if (onboardingComplete) {
                        router.push('/dashboard');
                    } else {
                        router.push('/onboarding');
                    }
                } else if (isDashboardRoute && !onboardingComplete) {
                    // Block dashboard access if onboarding is not complete
                    console.log('Onboarding not complete -> Redirecting to onboarding');
                    router.push('/onboarding');
                } else if (isOnboardingRoute && onboardingComplete) {
                    // If onboarding is complete, redirect to dashboard
                    console.log('Onboarding complete -> Redirecting to dashboard');
                    router.push('/dashboard');
                }
            }
        }
    }, [isAuthenticated, hasStore, onboardingComplete, isLoading, pathname, router]);

    if (isLoading || (isAuthenticated && onboardingComplete === null)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return <>{children}</>;
}

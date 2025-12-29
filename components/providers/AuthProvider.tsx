'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { onboardingApi } from '@/lib/api/onboarding';
import { LoadingScreen } from '@/components/LoadingScreen';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth, isAuthenticated, isLoading, hasStore, user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

    // Only check auth on non-public routes
    useEffect(() => {
        if (!pathname) return;

        const publicRoutes = ['/', '/login', '/signup'];
        const isPublicRoute = publicRoutes.includes(pathname);

        if (!isPublicRoute) {
            checkAuth();
        }
    }, [checkAuth, pathname]);

    // Check onboarding completion status
    useEffect(() => {
        const checkOnboardingStatus = () => {
            if (isAuthenticated && !isLoading) {
                console.log('Checking onboarding status:', {
                    userRole: user?.role,
                    hasStore,
                    isAuthenticated,
                    isLoading
                });

                // Staff members (non-ADMIN) don't need onboarding - they're added to existing stores by admins
                // Check this BEFORE making any API calls
                if (user && user.role !== 'ADMIN') {
                    console.log('User is staff (non-ADMIN), setting onboarding complete');
                    setOnboardingComplete(true);
                    return;
                }

                // For ADMIN users (store owners), onboarding is complete ONLY if they have a store
                if (hasStore) {
                    console.log('ADMIN has store, setting onboarding complete');
                    setOnboardingComplete(true);
                } else {
                    // ADMIN without store = onboarding NOT complete
                    console.log('ADMIN has NO store, setting onboarding INCOMPLETE');
                    setOnboardingComplete(false);
                }
            }
        };

        if (isAuthenticated && !isLoading) {
            checkOnboardingStatus();
        }
    }, [isAuthenticated, isLoading, hasStore, user]);

    // Monitor authentication state and redirect to login when logged out
    useEffect(() => {
        if (!isLoading && !isAuthenticated && pathname) {
            const publicRoutes = ['/login', '/signup', '/'];
            const isPublicRoute = publicRoutes.includes(pathname);

            // If user is not authenticated and not on a public route, redirect to login
            if (!isPublicRoute) {
                console.log('User not authenticated -> Redirecting to login');
                router.push('/login');
            }
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    useEffect(() => {
        console.log('AuthProvider Effect:', {
            isAuthenticated,
            hasStore,
            onboardingComplete,
            isLoading,
            pathname,
            userRole: user?.role
        });

        if (!isLoading && onboardingComplete !== null && pathname) {
            if (isAuthenticated) {
                const isPublicRoute = ['/login', '/signup', '/'].includes(pathname);
                const isOnboardingRoute = pathname.startsWith('/onboarding');
                const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/(main)');
                const isAdmin = user?.role === 'ADMIN';

                // CRITICAL: For ADMIN users (store owners), if they don't have a store, they MUST go to onboarding
                // Staff members (PHARMACIST, TECHNICIAN, etc.) can access dashboard even without hasStore
                // because they're added to existing stores by admins
                if (isAdmin && !hasStore && isDashboardRoute) {
                    console.log('ADMIN without store on dashboard -> Forcing redirect to onboarding');
                    router.replace('/onboarding');
                    return;
                }

                if (isPublicRoute) {
                    // Redirect authenticated users from public routes
                    if (onboardingComplete) {
                        router.push('/dashboard/overview');
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
                    router.push('/dashboard/overview');
                }
            }
        }
    }, [isAuthenticated, hasStore, onboardingComplete, isLoading, pathname, router, user]);

    // Skip loading screen for public routes
    const publicRoutes = ['/', '/login', '/signup'];
    const isPublicRoute = publicRoutes.includes(pathname || '');

    if (!isPublicRoute && (isLoading || (isAuthenticated && onboardingComplete === null))) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}

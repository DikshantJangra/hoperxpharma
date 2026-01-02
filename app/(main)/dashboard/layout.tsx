'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, hasStore, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // If loaded, logged in, but no store -> Redirect to Onboarding
        if (!isLoading && isAuthenticated && !hasStore) {
            router.push('/onboarding');
        }
    }, [isLoading, isAuthenticated, hasStore, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // Prevent rendering dashboard components if user has no store
    // This avoids "You do not have access to any stores" API errors while redirecting
    if (isAuthenticated && !hasStore) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return <>{children}</>;
}
"use client";

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/dashboard/sidebar/Sidebar"
import Navbar from "@/components/dashboard/navbar/Navbar"
import DemoModeBanner from "@/components/layout/DemoModeBanner"
import ProductTour from "@/components/tour/ProductTour"
import TourButton from "@/components/tour/TourButton"
import { PermissionProvider } from "@/contexts/PermissionContext"
import { BusinessTypeProvider } from "@/contexts/BusinessTypeContext"
import { useAuthStore } from "@/lib/store/auth-store"

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [expandedItems, setExpandedItems] = useState<string[]>([])
    const { permissions, isAuthenticated, hasStore, isLoading, primaryStore } = useAuthStore()

    useEffect(() => {
        if (!isLoading && isAuthenticated && !hasStore) {
            router.push('/onboarding');
        }
    }, [isLoading, isAuthenticated, hasStore, router]);

    // CRITICAL: Block rendering of EVERYTHING (including Navbar/Sidebar) if user has no store.
    // This prevents API calls (alerts, insights) that cause 429 errors before redirect.
    if (!isLoading && isAuthenticated && !hasStore) {
        // The redirects are handled in useEffects in the dashboard/layout or specific pages, 
        // but we must stop rendering HERE to prevent the "Too many requests" errors.
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <p className="text-sm text-gray-500 font-medium">Redirecting to onboarding...</p>
                </div>
            </div>
        );
    }

    const toggleItem = (item: string) => {
        setExpandedItems(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        )
    }

    return (
        <PermissionProvider initialPermissions={permissions}>
            <BusinessTypeProvider>
                {/* Demo Banner - Fixed Full Width Above Everything */}
                <DemoModeBanner isDemo={!!primaryStore?.isDemo} />

                {/* Product Tour - Only active in demo mode */}
                {primaryStore?.isDemo && <ProductTour />}

                {/* Main layout - use margin-top instead of padding for better positioning */}
                <div className={`flex h-screen bg-gray-50 ${primaryStore?.isDemo ? 'mt-[52px]' : ''}`}>
                    <Sidebar
                        isOpen={sidebarOpen}
                        expandedItems={expandedItems}
                        onToggleItem={toggleItem}
                    />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
                        <main className="flex-1 overflow-auto">
                            {children}
                        </main>
                    </div>
                </div>

                {/* Tour Help Button - Floating button to restart tour */}
                {primaryStore?.isDemo && <TourButton />}
            </BusinessTypeProvider>
        </PermissionProvider>
    )
}

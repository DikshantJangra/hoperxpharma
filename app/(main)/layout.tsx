"use client";

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/dashboard/sidebar/Sidebar"
import MobileNav from "@/components/dashboard/sidebar/MobileNav"
import Navbar from "@/components/dashboard/navbar/Navbar"
import DemoModeBanner from "@/components/layout/DemoModeBanner"
import { TrialBanner, PaymentOverdueBanner } from "@/components/billing/TrialBanner"
import ProductTour from "@/components/tour/ProductTour"
import TourButton from "@/components/tour/TourButton"
import { PermissionProvider } from "@/contexts/PermissionContext"
import { BusinessTypeProvider } from "@/contexts/BusinessTypeContext"
import { AlertProvider } from "@/contexts/AlertContext"
import { useAuthStore } from "@/lib/store/auth-store"

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false) // Default closed, will open on desktop
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [expandedItems, setExpandedItems] = useState<string[]>([])
    const { permissions, isAuthenticated, hasStore, isLoading, isLoggingOut, primaryStore } = useAuthStore()

    // Detect mobile viewport and set initial sidebar state
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            // On desktop, default to open; on mobile, default to closed
            if (!mobile && !sidebarOpen) {
                setSidebarOpen(true)
            }
            // Close mobile nav when switching to desktop
            if (!mobile && mobileNavOpen) {
                setMobileNavOpen(false)
            }
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (!isLoading && isAuthenticated && !hasStore) {
            router.push('/onboarding');
        }
    }, [isLoading, isAuthenticated, hasStore, router]);

    // Show logging out screen during logout transition
    if (isLoggingOut) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-gray-700">Logging out...</h2>
                        <p className="text-sm text-gray-500 mt-1">See you next time!</p>
                    </div>
                </div>
            </div>
        );
    }

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

    // Handle toggle for mobile vs desktop
    const handleToggleSidebar = () => {
        if (isMobile) {
            setMobileNavOpen(!mobileNavOpen)
        } else {
            setSidebarOpen(!sidebarOpen)
        }
    }

    return (
        <PermissionProvider initialPermissions={permissions}>
            <BusinessTypeProvider>
                <AlertProvider>
                    {/* Demo Banner - Fixed Full Width Above Everything */}
                    <DemoModeBanner isDemo={!!primaryStore?.isDemo} />

                    {/* Billing Banners - Shows below demo banner */}
                    <TrialBanner />
                    <PaymentOverdueBanner />

                    {/* Product Tour - Only active in demo mode */}
                    {primaryStore?.isDemo && <ProductTour />}

                    {/* Fullscreen Mobile Navigation */}
                    <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

                    {/* Main layout - fixed height accounting for demo banner */}
                    <div className={`flex ${primaryStore?.isDemo ? 'h-[calc(100vh-52px)] mt-[52px]' : 'h-screen'} bg-gray-50 overflow-hidden`}>
                        {/* Desktop Sidebar - hidden on mobile */}
                        <div className="hidden md:flex h-full">
                            <Sidebar
                                isOpen={sidebarOpen}
                                expandedItems={expandedItems}
                                onToggleItem={toggleItem}
                            />
                        </div>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <Navbar
                                onToggleSidebar={handleToggleSidebar}
                                sidebarOpen={isMobile ? mobileNavOpen : sidebarOpen}
                            />
                            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                                {children}
                            </main>
                        </div>
                    </div>

                    {/* Tour Help Button - Floating button to restart tour */}
                    {primaryStore?.isDemo && <TourButton />}
                </AlertProvider>
            </BusinessTypeProvider>
        </PermissionProvider>
    )
}

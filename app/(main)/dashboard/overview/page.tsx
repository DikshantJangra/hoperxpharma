"use client"
import { useEffect, useState } from "react"
import { FiDollarSign, FiAlertTriangle, FiClock, FiPackage } from "react-icons/fi"
import { TbPrescription } from "react-icons/tb"
import { MdStore } from "react-icons/md"
import { useRouter } from "next/navigation"
import KPICard from "@/components/dashboard/overview/KPICard"
import SalesChart from "@/components/dashboard/overview/SalesChart"
import AIInsights from "@/components/dashboard/overview/AIInsights"
import QuickActions from "@/components/dashboard/overview/QuickActions"
import ActionQueues from "@/components/dashboard/overview/ActionQueues"
import KeyboardShortcuts from "@/components/dashboard/KeyboardShortcuts"
import OfflineIndicator from "@/components/dashboard/overview/OfflineIndicator"
import { useAuthStore } from "@/lib/store/auth-store"
import { dashboardApi } from "@/lib/api/dashboard"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount)
}

export default function OverviewPage() {
    const router = useRouter()
    const { user, primaryStore, hasStore } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        revenue: 0,
        prescriptions: 0,
        prescriptionDetails: { active: 0, draft: 0, refill: 0 },
        readyForPickup: 0,
        criticalStock: 0,
        expiringSoon: 0,
        yesterdayRevenue: 0
    })

    useEffect(() => {
        const fetchDashboardData = async () => {
            // Don't fetch if user has no store
            if (!hasStore) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true)

                // Fetch real dashboard stats
                const dashboardStats = await dashboardApi.getStats()

                setStats({
                    revenue: dashboardStats.revenue || 0,
                    prescriptions: dashboardStats.prescriptions || 0,
                    prescriptionDetails: dashboardStats.prescriptionDetails || { active: 0, draft: 0, refill: 0 },
                    readyForPickup: dashboardStats.readyForPickup || 0,
                    criticalStock: dashboardStats.criticalStock || 0,
                    expiringSoon: dashboardStats.expiringSoon || 0,
                    yesterdayRevenue: dashboardStats.yesterdayRevenue || 0
                })
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [hasStore])

    // Calculate revenue comparison
    const calculateComparison = (today: number, yesterday: number) => {
        if (yesterday === 0) {
            if (today > 0) return "+100%"
            return "0%"
        }
        const change = ((today - yesterday) / yesterday) * 100
        const sign = change >= 0 ? "+" : ""
        return `${sign}${change.toFixed(1)}%`
    }

    return (
        <>
            <KeyboardShortcuts />
            <OfflineIndicator />
            <div className="p-6 space-y-5 bg-[#f7fafc]" role="main" aria-label="Dashboard Overview">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">Welcome back, {user?.firstName || 'User'}!</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <MdStore size={16} className="text-emerald-600" />
                                <span>Store: <span className="font-medium text-gray-800">{primaryStore?.name || 'Loading...'}</span></span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span>Shift: <span className="font-medium text-gray-800">Morning</span></span>
                        </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                        <p>Last sync: <span className="font-medium text-gray-800">{new Date().toLocaleTimeString()}</span></p>
                        <p className="text-xs text-emerald-600 mt-1">Auto-sync ON</p>
                    </div>
                </div>

                {/* KPI Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <KPICard
                        icon={<FiDollarSign size={20} />}
                        title="Revenue (Today)"
                        value={formatCurrency(stats.revenue)}
                        microtext={loading ? "Loading..." : `${calculateComparison(stats.revenue, stats.yesterdayRevenue)} vs yesterday`}
                        ctaLabel="View"
                        updated="Just now"
                        onAction={() => router.push('/pos/invoices')}
                        loading={loading}
                    />
                    <KPICard
                        icon={<TbPrescription size={20} />}
                        title="Prescriptions"
                        value={stats.prescriptions.toString()}
                        microtext={loading ? "Loading..." : "Pending review"}
                        ctaLabel="Open Queue"
                        tooltipContent={
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-emerald-300">
                                    <span>Active (Refills Left):</span>
                                    <span className="font-bold">{stats.prescriptionDetails?.active || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-amber-300">
                                    <span>Drafts/New:</span>
                                    <span className="font-bold">{stats.prescriptionDetails?.draft || 0}</span>
                                </div>
                            </div>
                        }
                        onAction={() => router.push('/prescriptions/all-prescriptions')}
                        loading={loading}
                    />
                    <KPICard
                        icon={<FiClock size={20} />}
                        title="Ready for Pickup"
                        value={stats.readyForPickup.toString()}
                        microtext={loading ? "Loading..." : "Waiting for patient"}
                        ctaLabel="Notify"
                        onAction={() => router.push('/prescriptions/ready')}
                        loading={loading}
                    />
                    <KPICard
                        icon={<FiAlertTriangle size={20} />}
                        title="Critical Stock"
                        value={stats.criticalStock.toString()}
                        microtext={loading ? "Loading..." : "Items below threshold"}
                        ctaLabel="Order"
                        variant={stats.criticalStock > 0 ? "critical" : "default"}
                        onAction={() => router.push('/inventory?filter=low_stock')}
                        loading={loading}
                    />
                    <KPICard
                        icon={<FiPackage size={20} />}
                        title="Expiring Soon"
                        value={stats.expiringSoon.toString()}
                        microtext={loading ? "Loading..." : "In next 30 days"}
                        ctaLabel="Manage"
                        variant={stats.expiringSoon > 0 ? "critical" : "default"}
                        onAction={() => router.push('/inventory?filter=expiring')}
                        loading={loading}
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                        <SalesChart />
                    </div>
                    <div >
                        <AIInsights />
                    </div>
                    <div className="lg:col-span-2">
                        <ActionQueues />
                    </div>
                    <div>
                        <QuickActions />
                    </div>
                </div>

                {/* Keyboard hint */}
                <div className="fixed bottom-6 right-6 bg-[#0f172a] text-white px-3 py-2 rounded-lg text-xs font-semibold" style={{ boxShadow: '0 10px 30px rgba(2,6,23,0.12)' }}>
                    Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded mx-1">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-white/20 rounded mx-1">?</kbd> for shortcuts
                </div>
            </div>
        </>
    )
}

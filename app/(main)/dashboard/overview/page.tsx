"use client"
import { FiDollarSign, FiAlertTriangle, FiClock, FiPackage } from "react-icons/fi"
import { TbPrescription } from "react-icons/tb"
import { MdStore } from "react-icons/md"
import KPICard from "@/components/dashboard/overview/KPICard"
import SalesChart from "@/components/dashboard/overview/SalesChart"
import AIInsights from "@/components/dashboard/overview/AIInsights"
import QuickActions from "@/components/dashboard/overview/QuickActions"
import ActionQueues from "@/components/dashboard/overview/ActionQueues"
import KeyboardShortcuts from "@/components/dashboard/KeyboardShortcuts"
import OfflineIndicator from "@/components/dashboard/overview/OfflineIndicator"

export default function OverviewPage() {
    return (
        <>
        <KeyboardShortcuts />
        <OfflineIndicator />
        <div className="p-6 space-y-5 bg-[#f7fafc]" role="main" aria-label="Dashboard Overview">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Welcome back, Krishan!</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <MdStore size={16} className="text-emerald-600" />
                            <span>Store: <span className="font-medium text-gray-800">Hope Medicos Pharmacy</span></span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span>Shift: <span className="font-medium text-gray-800">Day (08:00–16:00)</span></span>
                    </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                    <p>Last sync: <span className="font-medium text-gray-800">03:12 PM</span></p>
                    <p className="text-xs text-emerald-600 mt-1">Auto-sync ON</p>
                </div>
            </div>

            {/* KPI Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard 
                    icon={<FiDollarSign size={20} />}
                    title="Revenue (Today)"
                    value="₹12,450"
                    microtext="vs yesterday • +5.2%"
                    ctaLabel="View"
                    updated="09:12"
                    onAction={() => {}}
                />
                <KPICard 
                    icon={<TbPrescription size={20} />}
                    title="Prescriptions"
                    value="82"
                    microtext="New: 12 • Avg fill: 4m"
                    ctaLabel="Open Queue"
                    onAction={() => {}}
                />
                <KPICard 
                    icon={<FiClock size={20} />}
                    title="Ready for Pickup"
                    value="13"
                    microtext="Avg wait: 22m"
                    ctaLabel="Notify"
                    onAction={() => {}}
                />
                <KPICard 
                    icon={<FiAlertTriangle size={20} />}
                    title="Critical Stock"
                    value="3"
                    microtext="Atorvastatin, Metformin..."
                    ctaLabel="Order"
                    variant="critical"
                    onAction={() => {}}
                />
                <KPICard 
                    icon={<FiPackage size={20} />}
                    title="Expiring Soon"
                    value="2"
                    microtext="Within 7 days"
                    ctaLabel="Manage"
                    variant="critical"
                    onAction={() => {}}
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

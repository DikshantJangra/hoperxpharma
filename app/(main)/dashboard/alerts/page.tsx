"use client"
import { useState, useEffect } from "react"
import { FiSearch, FiRefreshCw, FiDownload, FiAlertCircle, FiCheckCircle, FiClock } from "react-icons/fi"
import AlertCard from "@/components/dashboard/alerts/AlertCard"
import AlertDetailDrawer from "@/components/dashboard/alerts/AlertDetailDrawer"
import { Alert } from "@/components/dashboard/alerts/types"

const AlertCardSkeleton = () => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 animate-pulse">
        <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
                <div className="w-5 h-5 bg-gray-200 rounded-full mt-1"></div>
                <div>
                    <div className="h-5 bg-gray-200 rounded-md w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-64"></div>
                </div>
            </div>
            <div className="h-4 bg-gray-200 rounded-md w-24"></div>
        </div>
    </div>
)

export default function AlertsPage() {
    const [activeTab, setActiveTab] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [lastChecked, setLastChecked] = useState<string | null>(null)

    useEffect(() => {
        setIsLoading(true)
        const timer = setTimeout(() => {
            setAlerts([]) // Start with no data
            setIsLoading(false)
            setLastChecked(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
        }, 1500) // Simulate network delay

        return () => clearTimeout(timer)
    }, [autoRefresh])

    const criticalCount = alerts.filter(a => a.severity === "critical").length
    const warningCount = alerts.filter(a => a.severity === "warning").length
    const infoCount = alerts.filter(a => a.severity === "info").length
    const newToday = alerts.filter(a => a.status === "new").length

    const filteredAlerts = alerts.filter(alert => {
        if (activeTab !== "all" && alert.type !== activeTab && activeTab !== "resolved") return false
        if (searchQuery && !alert.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !alert.medicine?.toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
    })

    return (
        <>
            <div className="min-h-screen bg-[#f8fafc]">
                {/* Header */}
                <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold text-[#0f172a]">Alerts & Notifications</h1>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setAutoRefresh(!autoRefresh)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${autoRefresh
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-white text-[#64748b] border border-[#e2e8f0]'
                                        }`}
                                >
                                    <FiRefreshCw size={16} className={autoRefresh && isLoading ? 'animate-spin' : ''} />
                                    <span className="text-sm font-medium">Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
                                </button>
                                <button className="px-4 py-2 bg-white border border-[#e2e8f0] text-[#475569] rounded-lg font-medium hover:bg-[#f8fafc] transition-colors flex items-center gap-2 text-sm">
                                    <FiDownload size={16} />
                                    Export Log
                                </button>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-4 gap-3 mt-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-red-900">Critical</span>
                                    <FiAlertCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="text-3xl font-bold text-red-700">{isLoading ? '...' : criticalCount}</div>
                                <div className="text-xs text-red-600 mt-1">{isLoading ? 'fetching...' : 'Requires immediate action'}</div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-amber-900">Warning</span>
                                    <FiAlertCircle className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="text-3xl font-bold text-amber-700">{isLoading ? '...' : warningCount}</div>
                                <div className="text-xs text-amber-600 mt-1">{isLoading ? 'fetching...' : 'Needs attention soon'}</div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-900">Info</span>
                                    <FiCheckCircle className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="text-3xl font-bold text-blue-700">{isLoading ? '...' : infoCount}</div>
                                <div className="text-xs text-blue-600 mt-1">{isLoading ? 'fetching...' : 'Informational only'}</div>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-emerald-900">New Today</span>
                                    <FiClock className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="text-3xl font-bold text-emerald-700">{isLoading ? '...' : newToday}</div>
                                <div className="text-xs text-emerald-600 mt-1">{isLoading ? 'fetching...' : 'New alerts today'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    {/* Search & Actions */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" size={18} />
                            <input
                                type="text"
                                placeholder="Search by medicine name, patient, or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] focus:border-transparent"
                                disabled={isLoading}
                            />
                        </div>
                        <button className="px-4 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors" disabled={isLoading}>
                            Mark All Read
                        </button>
                        <button className="px-4 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors" disabled={isLoading}>
                            Snooze 1 hr
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="bg-white rounded-xl border border-[#e2e8f0] p-1.5 flex items-center gap-1.5 overflow-x-auto">
                        {[
                            { id: "all", label: "All Alerts" },
                            { id: "critical", label: "Critical" },
                            { id: "inventory", label: "Inventory" },
                            { id: "compliance", label: "Compliance" },
                            { id: "workflow", label: "Workflow" },
                            { id: "system", label: "System" },
                            { id: "resolved", label: "Resolved" }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-[#0ea5a3] text-white shadow-sm'
                                    : 'text-[#64748b] hover:bg-[#f8fafc]'
                                    }`}
                                disabled={isLoading}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Alerts List */}
                    <div className="space-y-3">
                        {isLoading ? (
                            <>
                                <AlertCardSkeleton />
                                <AlertCardSkeleton />
                                <AlertCardSkeleton />
                            </>
                        ) : filteredAlerts.length === 0 ? (
                            <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center">
                                <div className="w-16 h-16 bg-[#f8fafc] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiCheckCircle className="w-8 h-8 text-[#64748b]" />
                                </div>
                                <p className="text-[#64748b] font-medium">No alerts found</p>
                                <p className="text-sm text-[#94a3b8] mt-1">All clear! No alerts match your current filter.</p>
                            </div>
                        ) : (
                            filteredAlerts.map(alert => (
                                <AlertCard
                                    key={alert.id}
                                    alert={alert}
                                    onClick={() => setSelectedAlert(alert)}
                                />
                            ))
                        )}
                    </div>

                    {/* Last Updated */}
                    <div className="text-center text-sm text-[#94a3b8]">
                        {isLoading ? 'Checking for alerts...' : `Last checked at ${lastChecked} • Auto-refresh ${autoRefresh ? 'enabled' : 'disabled'}`}
                    </div>
                </div>
            </div>

            {/* Alert Detail Drawer */}
            {selectedAlert && (
                <AlertDetailDrawer
                    alert={selectedAlert}
                    onClose={() => setSelectedAlert(null)}
                />
            )}
        </>
    )
}

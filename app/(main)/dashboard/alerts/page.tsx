"use client"
import { useState } from "react"
import { FiSearch, FiRefreshCw, FiDownload } from "react-icons/fi"
import AlertCard from "@/components/dashboard/alerts/AlertCard"
import AlertDetailDrawer from "@/components/dashboard/alerts/AlertDetailDrawer"
import { Alert } from "@/components/dashboard/alerts/types"

const mockAlerts: Alert[] = [
    {
        id: "1",
        type: "inventory",
        severity: "critical",
        title: "Critical: Atorvastatin 10 mg – 4 left",
        description: "Stock critically low. Reorder recommended.",
        createdAt: "09:45 AM",
        source: "Inventory Monitor",
        priority: "High",
        status: "new",
        medicine: "Atorvastatin 10 mg"
    },
    {
        id: "2",
        type: "inventory",
        severity: "critical",
        title: "2 batches of Amoxicillin expire within 7 days",
        description: "Batch #AMX-2401 (50 units) and #AMX-2402 (30 units) expiring soon.",
        createdAt: "08:30 AM",
        source: "Expiry Monitor",
        priority: "High",
        status: "new"
    },
    {
        id: "3",
        type: "compliance",
        severity: "warning",
        title: "GST return due in 2 days",
        description: "Monthly GST return submission deadline approaching.",
        createdAt: "Yesterday",
        source: "Compliance System",
        priority: "Medium",
        status: "new"
    },
    {
        id: "4",
        type: "system",
        severity: "warning",
        title: "WhatsApp API disconnected",
        description: "Reconnect to resume automated patient alerts.",
        createdAt: "2 hours ago",
        source: "Integration Monitor",
        priority: "Medium",
        status: "new"
    },
    {
        id: "5",
        type: "workflow",
        severity: "warning",
        title: "3 prescriptions pending verification",
        description: "Prescriptions awaiting pharmacist review.",
        createdAt: "1 hour ago",
        source: "Prescription System",
        priority: "Medium",
        status: "new"
    },
    {
        id: "6",
        type: "inventory",
        severity: "warning",
        title: "Metformin 500 mg – 12 left",
        description: "Stock running low. Consider reordering.",
        createdAt: "3 hours ago",
        source: "Inventory Monitor",
        priority: "Medium",
        status: "new",
        medicine: "Metformin 500 mg"
    },
    {
        id: "7",
        type: "system",
        severity: "info",
        title: "POS sync completed successfully",
        description: "All transactions synced to cloud at 03:12 PM.",
        createdAt: "03:12 PM",
        source: "System",
        priority: "Low",
        status: "new"
    }
]

export default function AlertsPage() {
    const [activeTab, setActiveTab] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
    const [autoRefresh, setAutoRefresh] = useState(true)

    const criticalCount = mockAlerts.filter(a => a.severity === "critical").length
    const warningCount = mockAlerts.filter(a => a.severity === "warning").length
    const infoCount = mockAlerts.filter(a => a.severity === "info").length
    const newToday = mockAlerts.filter(a => a.status === "new").length

    const filteredAlerts = mockAlerts.filter(alert => {
        if (activeTab !== "all" && alert.type !== activeTab && activeTab !== "resolved") return false
        if (searchQuery && !alert.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !alert.medicine?.toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
    })

    return (
        <>
            <div className="p-6 space-y-5 bg-[#f7fafc] min-h-screen">
                {/* Header & Summary */}
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800">Alerts & Notifications</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                                        Critical ({criticalCount})
                                    </span>
                                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                                        Warning ({warningCount})
                                    </span>
                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                                        Info ({infoCount})
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <span className="font-medium">{newToday} new today</span>
                                <span className="text-gray-400">•</span>
                                <span>8 resolved</span>
                                <span className="text-gray-400">•</span>
                                <span>2 snoozed</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <button 
                                    onClick={() => setAutoRefresh(!autoRefresh)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                                        autoRefresh ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    <FiRefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
                                    Auto-update {autoRefresh ? 'ON' : 'OFF'}
                                </button>
                                <span className="text-gray-500">Last checked 3:12 PM</span>
                            </div>
                        </div>
                    </div>

                    {/* Search & Bulk Actions */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by medicine name, patient, or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                        <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Mark All Read
                        </button>
                        <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Snooze 1 hr
                        </button>
                        <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <FiDownload size={16} />
                            Export Log
                        </button>
                    </div>
                </div>

                {/* Filters & Tabs */}
                <div className="bg-white rounded-xl border border-gray-200 p-1 flex items-center gap-1 overflow-x-auto">
                    {[
                        { id: "all", label: "All" },
                        { id: "critical", label: "Critical" },
                        { id: "inventory", label: "Inventory" },
                        { id: "compliance", label: "Compliance" },
                        { id: "workflow", label: "Workflow" },
                        { id: "system", label: "System" },
                        { id: "resolved", label: "Resolved / Snoozed" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Alerts List */}
                <div className="max-w-5xl space-y-3">
                    {filteredAlerts.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <p className="text-gray-500">No alerts found</p>
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

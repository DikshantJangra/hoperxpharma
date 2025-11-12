"use client"
import { useState } from "react"
import { FiDownload, FiShare2, FiCalendar } from "react-icons/fi"
import SummaryKPIGrid from "@/components/dashboard/summary/SummaryKPIGrid"
import PerformanceCharts from "@/components/dashboard/summary/PerformanceCharts"
import InventoryCompliance from "@/components/dashboard/summary/InventoryCompliance"
import StaffEfficiency from "@/components/dashboard/summary/StaffEfficiency"
import AIInsightsPanel from "@/components/dashboard/summary/AIInsightsPanel"

export default function SummaryPage() {
    const [dateRange, setDateRange] = useState("month")
    const [showDatePicker, setShowDatePicker] = useState(false)

    return (
        <div className="p-6 space-y-5 bg-[#f7fafc] min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Summary & Insights</h1>
                    <p className="text-sm text-gray-600 mt-1">Performance overview and growth trends</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button 
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <FiCalendar size={16} />
                            <span className="capitalize">{dateRange}</span>
                        </button>
                        {showDatePicker && (
                            <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[140px]">
                                {["today", "week", "month", "quarter"].map(range => (
                                    <button
                                        key={range}
                                        onClick={() => { setDateRange(range); setShowDatePicker(false) }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 capitalize ${dateRange === range ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'}`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <FiDownload size={16} />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#0ea5a3] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5a3]/90 transition-colors">
                        <FiShare2 size={16} />
                        Share
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <SummaryKPIGrid />

            {/* Performance Charts */}
            <PerformanceCharts />

            {/* Inventory & Compliance + AI Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <InventoryCompliance />
                </div>
                <div>
                    <AIInsightsPanel />
                </div>
            </div>

            {/* Staff Efficiency */}
            <StaffEfficiency />

            {/* Footer */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between text-xs text-gray-600">
                <span>Last updated 03:15 PM · All metrics verified and synced from POS + Inventory</span>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-emerald-600">Live</span>
                </div>
            </div>
        </div>
    )
}

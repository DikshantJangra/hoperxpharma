"use client"
import { useState } from "react"
import { FiBarChart2, FiPieChart } from "react-icons/fi"

export default function PerformanceCharts() {
    const [period, setPeriod] = useState('week')
    const loading = true; // Default to loading state

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Revenue Trend */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                        {loading ? (
                            <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-1"></div>
                        ) : (
                            <p className="text-sm text-gray-600 mt-1">Total ₹0 · +0% vs last period</p>
                        )}
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['week', 'month', 'year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-64 w-full flex items-end justify-between gap-2">
                    {loading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                            <span className="text-sm">Loading chart data...</span>
                        </div>
                    ) : (
                        // Chart rendering logic would go here
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            No data available
                        </div>
                    )}
                </div>
            </div>

            {/* Category Split */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Sales by Category</h3>
                <div className="h-64 flex items-center justify-center relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <div className="w-32 h-32 rounded-full border-4 border-gray-100 border-t-emerald-500 animate-spin mb-4"></div>
                            <span className="text-sm">Fetching categories...</span>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 text-sm">
                            No category data
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

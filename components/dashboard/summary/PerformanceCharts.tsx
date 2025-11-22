"use client"
import { useState, useEffect } from "react"
import { FiBarChart2, FiPieChart } from "react-icons/fi"

// A simple skeleton for the bar chart
const BarChartSkeleton = () => (
    <div className="w-full h-full flex items-end justify-between gap-2 animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-full bg-gray-200 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
        ))}
    </div>
)

export default function PerformanceCharts() {
    const [period, setPeriod] = useState('week')
    const [isLoading, setIsLoading] = useState(true)
    const [revenueData, setRevenueData] = useState<any>(null)
    const [categoryData, setCategoryData] = useState<any>(null)

    useEffect(() => {
        setIsLoading(true)
        const timer = setTimeout(() => {
            // Set to null to show empty state
            setRevenueData(null) 
            setCategoryData(null)
            setIsLoading(false)
        }, 1500)

        return () => clearTimeout(timer)
    }, [period])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Revenue Trend */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                        {isLoading ? (
                            <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                        ) : (
                            <p className="text-sm text-gray-600 mt-1">
                                {revenueData ? `Total ₹${revenueData.total}` : 'No revenue data for this period'}
                            </p>
                        )}
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['week', 'month', 'year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                disabled={isLoading}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                    {isLoading ? (
                        <BarChartSkeleton />
                    ) : revenueData ? (
                        // Actual chart would go here
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                           Chart Area
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                             <FiBarChart2 className="mx-auto h-10 w-10 text-gray-300 mb-2"/>
                            <p>No data available to display chart.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Split */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Sales by Category</h3>
                <div className="h-64 flex items-center justify-center relative">
                    {isLoading ? (
                        <div className="w-40 h-40 bg-gray-200 rounded-full animate-pulse"></div>
                    ) : categoryData ? (
                        // Actual pie chart would go here
                         <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                           Pie Chart Area
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                             <FiPieChart className="mx-auto h-10 w-10 text-gray-300 mb-2"/>
                            <p>No category data available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

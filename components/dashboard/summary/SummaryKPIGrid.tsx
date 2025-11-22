"use client"
import { useState, useEffect } from "react"
import { FiDollarSign, FiTrendingUp, FiShoppingBag, FiUsers } from "react-icons/fi"

const kpiSkeletons = [
    { label: "Total Revenue", icon: FiDollarSign, color: "blue" },
    { label: "Net Profit", icon: FiTrendingUp, color: "emerald" },
    { label: "Total Orders", icon: FiShoppingBag, color: "violet" },
    { label: "Active Patients", icon: FiUsers, color: "amber" },
]

export default function SummaryKPIGrid() {
    const [kpis, setKpis] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            // When data is fetched, it would look something like this:
            // setKpis([
            //     { ...kpiSkeletons[0], value: "₹1,42,345", change: "+12.5%", trend: "up", subline: "vs. previous 30 days" },
            //     { ...kpiSkeletons[1], value: "₹45,820", change: "+8.2%", trend: "up", subline: "Profit margin: 32.2%" },
            //     { ...kpiSkeletons[2], value: "892", change: "-1.4%", trend: "down", subline: "Avg. order value: ₹159.5" },
            //     { ...kpiSkeletons[3], value: "1,204", change: "+50", trend: "up", subline: "32 new this month" },
            // ])
            // For now, we set empty state
            setKpis([])
            setIsLoading(false)
        }, 1500)
        return () => clearTimeout(timer)
    }, [])

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {kpiSkeletons.map((kpi, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                                <kpi.icon size={20} />
                            </div>
                            <div className="h-4 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">{kpi.label}</p>
                            <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (kpis.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {kpiSkeletons.map((kpi, i) => (
                     <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                                <kpi.icon size={20} />
                            </div>
                             <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500`}>
                                --%
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">{kpi.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">--</h3>
                            <p className="text-xs text-gray-400">No data available</p>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                            <kpi.icon size={20} />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${kpi.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {kpi.change}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">{kpi.label}</p>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</h3>
                        <p className="text-xs text-gray-400">{kpi.subline}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

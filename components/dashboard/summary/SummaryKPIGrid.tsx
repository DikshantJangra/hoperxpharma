"use client"
import { FiDollarSign, FiTrendingUp, FiShoppingBag, FiUsers } from "react-icons/fi"

export default function SummaryKPIGrid() {
    const loading = true; // Default to loading state

    const kpis = [
        {
            label: "Total Revenue",
            value: "",
            change: "+0%",
            trend: "neutral",
            icon: FiDollarSign,
            color: "blue",
            subline: "Loading..."
        },
        {
            label: "Net Profit",
            value: "",

            change: "+0%",
            trend: "neutral",
            icon: FiTrendingUp,
            color: "emerald",
            subline: "Loading..."
        },
        {
            label: "Total Orders",
            value: "",

            change: "+0%",
            trend: "neutral",
            icon: FiShoppingBag,
            color: "violet",
            subline: "Loading..."
        },
        {
            label: "Active Patients",
            value: "",

            change: "+0%",
            trend: "neutral",
            icon: FiUsers,
            color: "amber",
            subline: "Loading..."
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                            <kpi.icon size={20} />
                        </div>
                        {loading ? (
                            <div className="h-4 w-12 bg-gray-100 rounded animate-pulse"></div>
                        ) : (
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${kpi.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {kpi.change}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">{kpi.label}</p>
                        {loading ? (
                            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                        ) : (
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</h3>
                        )}
                        {loading ? (
                            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
                        ) : (
                            <p className="text-xs text-gray-400">{kpi.subline}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

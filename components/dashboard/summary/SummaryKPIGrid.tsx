"use client"
import { FiDollarSign, FiTrendingUp, FiUsers, FiPackage, FiClock, FiFileText, FiAlertCircle } from "react-icons/fi"
import { TbPrescription } from "react-icons/tb"

interface KPIData {
    icon: React.ReactNode
    title: string
    value: string
    subline: string
    trend: string
    category: 'finance' | 'operations' | 'customer' | 'compliance'
}

export default function SummaryKPIGrid() {
    const kpis: KPIData[] = [
        {
            icon: <FiDollarSign size={20} />,
            title: "Total Revenue",
            value: "₹3,42,000",
            subline: "vs last month",
            trend: "+6.4%",
            category: "finance"
        },
        {
            icon: <TbPrescription size={20} />,
            title: "Prescriptions Filled",
            value: "1,284",
            subline: "Avg. 42/day",
            trend: "+8.2%",
            category: "operations"
        },
        {
            icon: <FiUsers size={20} />,
            title: "New Patients",
            value: "138",
            subline: "Repeat: 62%",
            trend: "+12%",
            category: "customer"
        },
        {
            icon: <FiTrendingUp size={20} />,
            title: "Top-selling Drug",
            value: "Paracetamol",
            subline: "13% of sales",
            trend: "↑ 5%",
            category: "operations"
        },
        {
            icon: <FiPackage size={20} />,
            title: "Inventory Turnover",
            value: "4.8x",
            subline: "Healthy",
            trend: "Optimal",
            category: "operations"
        },
        {
            icon: <FiClock size={20} />,
            title: "Avg Fill Time",
            value: "3m 12s",
            subline: "vs goal 4m",
            trend: "-20%",
            category: "operations"
        },
        {
            icon: <FiFileText size={20} />,
            title: "Pending Invoices",
            value: "18",
            subline: "Total ₹23,500",
            trend: "Action",
            category: "finance"
        },
        {
            icon: <FiAlertCircle size={20} />,
            title: "Compliance Score",
            value: "97%",
            subline: "2 actions needed",
            trend: "Good",
            category: "compliance"
        }
    ]

    const categoryColors = {
        finance: 'border-t-emerald-500',
        operations: 'border-t-blue-500',
        customer: 'border-t-purple-500',
        compliance: 'border-t-amber-500'
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => (
                <button
                    key={idx}
                    className={`bg-white border border-gray-200 rounded-lg p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 text-left border-t-4 ${categoryColors[kpi.category]}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kpi.title}</span>
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                            {kpi.icon}
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{kpi.value}</div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{kpi.subline}</span>
                        <span className={`font-semibold ${kpi.trend.includes('+') || kpi.trend.includes('↑') ? 'text-emerald-600' : kpi.trend.includes('-') ? 'text-red-600' : 'text-gray-600'}`}>
                            {kpi.trend}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    )
}

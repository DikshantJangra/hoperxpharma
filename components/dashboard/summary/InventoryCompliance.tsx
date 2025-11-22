"use client"
import { useState, useEffect } from "react"
import { FiCheckCircle, FiAlertTriangle } from "react-icons/fi"

const StatRowSkeleton = () => (
    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
        <div className="h-6 bg-gray-200 rounded-md w-1/4"></div>
    </div>
)

const CircleSkeleton = ({ label }: { label: string }) => (
    <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                <span className="text-xs text-gray-500 mt-2">{label}</span>
            </div>
        </div>
    </div>
);


export default function InventoryCompliance() {
    const [inventoryData, setInventoryData] = useState<any>(null)
    const [complianceData, setComplianceData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        const timer = setTimeout(() => {
            // Set to null for empty state
            setInventoryData(null)
            setComplianceData(null)
            setIsLoading(false)
        }, 1500)
        return () => clearTimeout(timer)
    }, [])


    const renderInventory = () => {
        if (isLoading) {
            return (
                <>
                    <CircleSkeleton label="Fetching health..."/>
                    <div className="space-y-3">
                        <StatRowSkeleton />
                        <StatRowSkeleton />
                        <StatRowSkeleton />
                    </div>
                </>
            )
        }
        if (!inventoryData) {
            return (
                <div className="text-center py-10 text-gray-500">
                    <p>No inventory data available.</p>
                </div>
            )
        }
        
        const { stockHealth, lowStock, expiringSoon, overstocked } = inventoryData;
        const circumference = 2 * Math.PI * 70;

        return (
            <>
                <div className="flex items-center justify-center mb-6">
                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                            <circle
                                cx="80" cy="80" r="70" stroke="#0ea5a3" strokeWidth="12" fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference * (1 - stockHealth / 100)}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-gray-900">{stockHealth}%</span>
                            <span className="text-xs text-gray-600 mt-1">Stock Health</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Low Stock Items</span>
                        <span className="text-lg font-bold text-red-600">{lowStock}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Expiring Soon</span>
                        <span className="text-lg font-bold text-amber-600">{expiringSoon}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Overstocked</span>
                        <span className="text-lg font-bold text-blue-600">{overstocked}</span>
                    </div>
                </div>
            </>
        )
    }
    
    const renderCompliance = () => {
        if (isLoading) {
            return (
                <>
                    <CircleSkeleton label="Fetching score..."/>
                    <div className="space-y-3">
                        <StatRowSkeleton />
                        <StatRowSkeleton />
                        <StatRowSkeleton />
                    </div>
                </>
            )
        }
        if (!complianceData) {
            return (
                <div className="text-center py-10 text-gray-500">
                    <p>No compliance data available.</p>
                </div>
            )
        }

        const { score, gstFiled, auditPending, dataPrivacy } = complianceData;
        const circumference = 2 * Math.PI * 70;

        return (
            <>
                <div className="flex items-center justify-center mb-6">
                     <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                            <circle
                                cx="80" cy="80" r="70" stroke="#10b981" strokeWidth="12" fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference * (1 - score / 100)}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-gray-900">{score}%</span>
                            <span className="text-xs text-gray-600 mt-1">Compliance</span>
                        </div>
                    </div>
                </div>
                 <div className="space-y-3">
                    <div className={`flex items-center justify-between p-3 rounded-lg ${gstFiled ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                             <FiCheckCircle className={gstFiled ? "text-emerald-600" : "text-gray-400"} size={18} />
                            <span className="text-sm font-medium text-gray-700">GST Filed</span>
                        </div>
                        <span className={`text-xs font-semibold ${gstFiled ? 'text-emerald-600' : 'text-gray-500'}`}>{gstFiled ? '✓' : 'Pending'}</span>
                    </div>
                     <div className={`flex items-center justify-between p-3 rounded-lg ${!auditPending ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                        <div className="flex items-center gap-2">
                             <FiAlertTriangle className={auditPending ? "text-amber-600" : "text-gray-400"} size={18} />
                            <span className="text-sm font-medium text-gray-700">Audit Pending</span>
                        </div>
                        <span className={`text-xs font-semibold ${auditPending ? 'text-amber-600' : 'text-gray-500'}`}>{auditPending ? '⚠' : 'None'}</span>
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${dataPrivacy ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center gap-2">
                            <FiCheckCircle className={dataPrivacy ? "text-emerald-600" : "text-red-500"} size={18} />
                            <span className="text-sm font-medium text-gray-700">Data Privacy</span>
                        </div>
                        <span className={`text-xs font-semibold ${dataPrivacy ? 'text-emerald-600' : 'text-red-600'}`}>{dataPrivacy ? '✓' : 'At Risk'}</span>
                    </div>
                </div>
            </>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Inventory Health */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-6">Inventory Health</h3>
                {renderInventory()}
                <button 
                    className="w-full mt-4 px-4 py-2 bg-[#0ea5a3] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5a3]/90 transition-colors disabled:bg-gray-300"
                    disabled={isLoading}
                >
                    Manage Inventory
                </button>
            </div>

            {/* Compliance */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-6">Compliance Score</h3>
                {renderCompliance()}
                <button 
                    className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:bg-gray-300"
                    disabled={isLoading}
                >
                    View Compliance Log
                </button>
            </div>
        </div>
    )
}

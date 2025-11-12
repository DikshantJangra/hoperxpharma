"use client"
import { FiCheckCircle, FiAlertTriangle } from "react-icons/fi"

export default function InventoryCompliance() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Inventory Health */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-6">Inventory Health</h3>
                
                <div className="flex items-center justify-center mb-6">
                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="#e5e7eb"
                                strokeWidth="12"
                                fill="none"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="#0ea5a3"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 70}`}
                                strokeDashoffset={`${2 * Math.PI * 70 * (1 - 0.82)}`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-gray-900">82%</span>
                            <span className="text-xs text-gray-600 mt-1">Stock Health</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Low Stock Items</span>
                        <span className="text-lg font-bold text-red-600">7</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Expiring Soon</span>
                        <span className="text-lg font-bold text-amber-600">5</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Overstocked</span>
                        <span className="text-lg font-bold text-blue-600">2</span>
                    </div>
                </div>

                <button className="w-full mt-4 px-4 py-2 bg-[#0ea5a3] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5a3]/90 transition-colors">
                    Manage Inventory
                </button>
            </div>

            {/* Compliance */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-6">Compliance Score</h3>
                
                <div className="flex items-center justify-center mb-6">
                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="#e5e7eb"
                                strokeWidth="12"
                                fill="none"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="#10b981"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 70}`}
                                strokeDashoffset={`${2 * Math.PI * 70 * (1 - 0.97)}`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-gray-900">97%</span>
                            <span className="text-xs text-gray-600 mt-1">Compliance</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FiCheckCircle className="text-emerald-600" size={18} />
                            <span className="text-sm font-medium text-gray-700">GST Filed</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">✓</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FiAlertTriangle className="text-amber-600" size={18} />
                            <span className="text-sm font-medium text-gray-700">Audit Pending</span>
                        </div>
                        <span className="text-xs font-semibold text-amber-600">⚠</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FiCheckCircle className="text-emerald-600" size={18} />
                            <span className="text-sm font-medium text-gray-700">Data Privacy</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">✓</span>
                    </div>
                </div>

                <button className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    View Compliance Log
                </button>
            </div>
        </div>
    )
}

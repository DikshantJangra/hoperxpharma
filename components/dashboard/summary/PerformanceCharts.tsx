"use client"
import { useState } from "react"

export default function PerformanceCharts() {
    const [activeChart, setActiveChart] = useState<'revenue' | 'prescriptions' | 'profit'>('revenue')
    
    const currentData = [28, 35, 42, 38, 45, 52, 48]
    const previousData = [25, 30, 38, 35, 40, 45, 42]
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    const customerData = {
        new: [12, 15, 18, 14, 20, 22, 19],
        returning: [45, 48, 52, 50, 55, 58, 54]
    }

    const categories = [
        { name: 'Pain Relief', value: 35, color: 'bg-emerald-500' },
        { name: 'Antibiotics', value: 25, color: 'bg-blue-500' },
        { name: 'Vitamins', value: 20, color: 'bg-purple-500' },
        { name: 'Skin Care', value: 12, color: 'bg-amber-500' },
        { name: 'Others', value: 8, color: 'bg-gray-400' }
    ]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Sales Performance */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-base font-semibold text-gray-800">Sales Performance</h3>
                        <p className="text-sm text-gray-600 mt-1">Total ₹3.4L · +6.4% vs last period · Peak Thursday ₹42K</p>
                    </div>
                    <div className="flex gap-2">
                        {(['revenue', 'prescriptions', 'profit'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setActiveChart(type)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                                    activeChart === type ? 'bg-[#0ea5a3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="relative h-64">
                    <div className="absolute inset-0 flex items-end justify-between gap-3">
                        {days.map((day, idx) => {
                            const currentHeight = (currentData[idx] / Math.max(...currentData)) * 100
                            const previousHeight = (previousData[idx] / Math.max(...previousData)) * 100
                            
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full relative flex items-end justify-center gap-1" style={{ height: '220px' }}>
                                        <div 
                                            className="w-full bg-gray-200 rounded-t opacity-40"
                                            style={{ height: `${previousHeight}%` }}
                                        />
                                        <div 
                                            className="w-full bg-[#0ea5a3] rounded-t hover:bg-[#0ea5a3]/80 transition-all cursor-pointer absolute bottom-0"
                                            style={{ height: `${currentHeight}%` }}
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                ₹{currentData[idx]}K · {Math.floor(currentData[idx] * 1.5)} RX
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">{day}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#0ea5a3] rounded"></div>
                        <span className="text-gray-600">Current Period</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-300 rounded"></div>
                        <span className="text-gray-600">Previous Period</span>
                    </div>
                </div>
            </div>

            {/* Customer Growth */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Customer Growth</h3>
                
                <div className="h-48 flex items-end justify-between gap-2 mb-4">
                    {days.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex flex-col gap-0.5" style={{ height: '180px', justifyContent: 'flex-end' }}>
                                <div 
                                    className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors cursor-pointer"
                                    style={{ height: `${(customerData.new[idx] / 25) * 100}%` }}
                                    title={`New: ${customerData.new[idx]}`}
                                />
                                <div 
                                    className="w-full bg-emerald-500 rounded-t hover:bg-emerald-600 transition-colors cursor-pointer"
                                    style={{ height: `${(customerData.returning[idx] / 60) * 100}%` }}
                                    title={`Returning: ${customerData.returning[idx]}`}
                                />
                            </div>
                            <span className="text-[10px] text-gray-600 font-medium">{day.slice(0, 1)}</span>
                        </div>
                    ))}
                </div>

                <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                            <span className="text-gray-600">Returning</span>
                        </div>
                        <span className="font-semibold text-gray-900">62%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded"></div>
                            <span className="text-gray-600">New</span>
                        </div>
                        <span className="font-semibold text-gray-900">38%</span>
                    </div>
                    <p className="text-gray-600 mt-3">Avg visits per patient: <span className="font-semibold text-gray-900">1.4</span></p>
                </div>
            </div>

            {/* Top Categories */}
            <div className="lg:col-span-3 bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Top Categories by Revenue</h3>
                <div className="space-y-3">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="group cursor-pointer">
                            <div className="flex items-center justify-between mb-1 text-sm">
                                <span className="font-medium text-gray-700">{cat.name}</span>
                                <span className="font-semibold text-gray-900">{cat.value}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div 
                                    className={`h-full ${cat.color} transition-all duration-300 group-hover:opacity-80`}
                                    style={{ width: `${cat.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

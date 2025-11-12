"use client"
import { useState } from "react"

export default function SalesChart() {
    const [period, setPeriod] = useState('week')
    const hasData = true

    return (
        <div className="bg-white rounded-xl border border-[#e6eef2] p-6 h-full flex flex-col" style={{ boxShadow: '0 6px 18px rgba(3,15,31,0.06)' }}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-[13px] font-semibold text-[#0f172a]">Sales Analytics</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-[#6b7280]">Total sales: <span className="font-bold text-[#0f172a]">₹12,450</span></span>
                        <span className="text-[#6b7280]/40">•</span>
                        <span className="text-[#6b7280]">RX filled: <span className="font-bold text-[#0f172a]">82</span></span>
                        <span className="text-[#6b7280]/40">•</span>
                        <span className="text-[#6b7280]">Avg order: <span className="font-bold text-[#0f172a]">₹151</span></span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setPeriod('week')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${period === 'week' ? 'bg-[#0ea5a3]/10 text-[#0ea5a3]' : 'text-[#6b7280] hover:bg-gray-50'}`}
                    >
                        This Week
                    </button>
                    <button 
                        onClick={() => setPeriod('month')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${period === 'month' ? 'bg-[#0ea5a3]/10 text-[#0ea5a3]' : 'text-[#6b7280] hover:bg-gray-50'}`}
                    >
                        This Month
                    </button>
                </div>
            </div>
            
            {hasData ? (
                <div className="w-full flex items-end justify-between gap-2 flex-1">
                    {[40, 60, 50, 75, 80, 65, 90].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full bg-[#0ea5a3] rounded-t-lg hover:bg-[#0ea5a3]/80 transition-all cursor-pointer relative" style={{ height: `${h}%` }}>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    ₹{(h * 100).toLocaleString()} • {Math.floor(h/10)} RX
                                </div>
                            </div>
                            <span className="text-xs text-[#6b7280] font-medium">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-[#0f172a] mb-1">No sales data yet</h4>
                    <p className="text-xs text-[#6b7280] mb-4">Connect your POS to see analytics</p>
                    <button className="px-4 py-2 bg-[#0ea5a3] text-white text-xs font-semibold rounded-lg hover:bg-[#0ea5a3]/90 transition-colors">
                        Import POS Data
                    </button>
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#e6eef2] flex items-center gap-4">
                <WorkflowChip label="New" count={12} color="blue" />
                <WorkflowChip label="In Progress" count={6} color="amber" />
                <WorkflowChip label="Ready" count={13} color="emerald" />
                <WorkflowChip label="Delivered" count={77} color="gray" />
                <div className="ml-auto text-xs text-[#6b7280]">
                    Avg processing: <span className="font-bold text-[#0f172a]">3m 40s</span>
                </div>
            </div>
        </div>
    )
}

function WorkflowChip({ label, count, color }: { label: string, count: number, color: string }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        gray: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return (
        <button className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${colors[color as keyof typeof colors]} hover:opacity-80 transition-opacity`}>
            {label} <span className="ml-1.5">({count})</span>
        </button>
    )
}

"use client"
import { useState, useEffect } from "react"

export default function SalesChart() {
    const [period, setPeriod] = useState('week')
    const [hasData, setHasData] = useState(false)
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const { salesApi } = await import('@/lib/api/sales');
                const data = await salesApi.getStats(period === 'week' ? 'weekly' : 'monthly');
                setStats(data);
                setHasData(true);
            } catch (error) {
                console.error('Failed to fetch sales chart data:', error);
                setHasData(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [period]);

    return (
        <div className="bg-white rounded-xl border border-[#e6eef2] p-6 h-full flex flex-col" style={{ boxShadow: '0 6px 18px rgba(3,15,31,0.06)' }}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-[13px] font-semibold text-[#0f172a]">Sales Analytics</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                        {hasData && stats ? (
                            <>
                                <span className="text-[#6b7280]">Total sales: <span className="font-bold text-[#0f172a]">₹{stats.totalRevenue.toLocaleString('en-IN')}</span></span>
                                <span className="text-[#6b7280]/40">•</span>
                                <span className="text-[#6b7280]">RX filled: <span className="font-bold text-[#0f172a]">{stats.totalOrders}</span></span>
                                <span className="text-[#6b7280]/40">•</span>
                                <span className="text-[#6b7280]">Avg order: <span className="font-bold text-[#0f172a]">₹{Math.round(stats.averageOrderValue)}</span></span>
                            </>
                        ) : (
                            <>
                                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse mr-2 inline-block"></div>
                                <span className="text-[#6b7280]/40">•</span>
                                <div className="h-4 w-8 bg-gray-100 rounded animate-pulse mr-2 inline-block"></div>
                                <span className="text-[#6b7280]/40">•</span>
                                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse inline-block"></div>
                            </>
                        )}
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
                <div className="w-full flex items-end justify-between gap-2 flex-1 relative min-h-[200px]">
                    {/* Placeholder for chart visualization - would use Recharts or similar here */}
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        Chart visualization coming soon
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0ea5a3] rounded-full animate-spin"></div>
                    </div>
                    <h4 className="text-sm font-semibold text-[#0f172a] mb-1">Fetching sales data...</h4>
                    <p className="text-xs text-[#6b7280]">Please wait while we retrieve your analytics</p>
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#e6eef2] flex items-center gap-4">
                <WorkflowChip label="New" count={0} color="blue" />
                <WorkflowChip label="In Progress" count={0} color="amber" />
                <WorkflowChip label="Ready" count={0} color="emerald" />
                <WorkflowChip label="Delivered" count={0} color="gray" />
                <div className="ml-auto text-xs text-[#6b7280]">
                    Avg processing: <span className="font-bold text-[#0f172a]">-</span>
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

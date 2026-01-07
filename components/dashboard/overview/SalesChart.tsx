"use client"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { dashboardApi, SalesChartData } from "@/lib/api/dashboard"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { usePremiumTheme } from "@/lib/hooks/usePremiumTheme";

export default function SalesChart() {
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week')
    const [hasData, setHasData] = useState(false)
    const [chartData, setChartData] = useState<SalesChartData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const hasStore = useAuthStore(state => state.hasStore)
    const { isPremium, tokens } = usePremiumTheme();

    useEffect(() => {
        const fetchStats = async () => {
            if (!hasStore) {
                setIsLoading(false);
                setHasData(false);
                return;
            }

            setIsLoading(true);
            try {
                const data = await dashboardApi.getSalesChart(period);
                setChartData(data);
                setHasData(!!data && Array.isArray(data.data) && data.data.length > 0);
            } catch (error) {
                console.error('Failed to fetch sales chart data:', error);
                setHasData(false);
                setChartData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [period, hasStore]);

    const salesData = chartData?.data || [];
    const totalRevenue = Array.isArray(salesData) ? salesData.reduce((sum, item) => sum + item.revenue, 0) : 0;
    const totalOrders = Array.isArray(salesData) ? salesData.reduce((sum, item) => sum + item.count, 0) : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Format data for Recharts
    const formattedData = salesData.map(item => {
        const date = new Date(item.date);
        return {
            date: item.date,
            label: period === 'week'
                ? date.toLocaleDateString('en-US', { weekday: 'short' })
                : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: item.revenue,
            count: item.count,
            fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
    });

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className={`${isPremium ? 'bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-emerald-500/20' : 'bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/10'} text-white px-5 py-4 rounded-xl`}>
                    <div className="text-gray-400 text-[10px] mb-2 font-semibold uppercase tracking-wide">{data.fullDate}</div>
                    <div className="text-emerald-400 font-bold text-2xl mb-2">₹{data.revenue.toLocaleString('en-IN')}</div>
                    <div className="flex items-center gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Orders:</span>{' '}
                            <span className="text-white font-bold">{data.count}</span>
                        </div>
                        {data.count > 0 && (
                            <div>
                                <span className="text-gray-500">Avg:</span>{' '}
                                <span className="text-white font-bold">₹{Math.round(data.revenue / data.count).toLocaleString('en-IN')}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className={`
                h-full flex flex-col p-6 rounded-xl border transition-all 
                ${isPremium ? 'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.01]' : 'duration-200'}
                ${isPremium
                    ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                    : 'bg-white border-[#e6eef2]'
                }
            `}
            style={!isPremium ? { boxShadow: '0 6px 18px rgba(3,15,31,0.06)' } : {}}
            {...(isPremium ? { 'data-premium': 'true' } : {})}
        >
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-[13px] font-semibold text-[#0f172a]">Sales Analytics</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                        {isLoading ? (
                            <>
                                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
                                <span className="text-[#6b7280]/40">•</span>
                                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse"></div>
                                <span className="text-[#6b7280]/40">•</span>
                                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
                            </>
                        ) : hasData && chartData ? (
                            <>
                                <span className="text-[#6b7280]">Total: <span className="font-bold text-[#0f172a]">₹{totalRevenue.toLocaleString('en-IN')}</span></span>
                                <span className="text-[#6b7280]/40">•</span>
                                <span className="text-[#6b7280]">Orders: <span className="font-bold text-[#0f172a]">{totalOrders}</span></span>
                                <span className="text-[#6b7280]/40">•</span>
                                <span className="text-[#6b7280]">Avg: <span className="font-bold text-[#0f172a]">₹{Math.round(avgOrderValue)}</span></span>
                                {chartData.growthPercent && (
                                    <>
                                        <span className="text-[#6b7280]/40">•</span>
                                        <span className={`font-bold flex items-center gap-1 ${parseFloat(chartData.growthPercent) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {parseFloat(chartData.growthPercent) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(chartData.growthPercent)).toFixed(1)}%
                                        </span>
                                    </>
                                )}
                            </>
                        ) : (
                            <span className="text-[#6b7280]">No data</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPeriod('week')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${period === 'week' ? 'bg-[#0 ea5a3]/10 text-[#0ea5a3]' : 'text-[#6b7280] hover:bg-gray-50'}`}
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

            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[240px]">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0ea5a3] rounded-full animate-spin"></div>
                    </div>
                    <h4 className="text-sm font-semibold text-[#0f172a] mb-1">Fetching data...</h4>
                    <p className="text-xs text-[#6b7280]">Please wait</p>
                </div>
            ) : hasData && chartData ? (
                <div className="flex-1 min-h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formattedData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                            <Bar
                                dataKey="revenue"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={60}
                            >
                                {formattedData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill="url(#colorGradient)"
                                        filter={isPremium ? "url(#glow)" : undefined}
                                    />
                                ))}
                            </Bar>
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isPremium ? '#10b981' : '#34d399'} stopOpacity={1} />
                                    <stop offset="50%" stopColor={isPremium ? '#059669' : '#10b981'} stopOpacity={1} />
                                    <stop offset="100%" stopColor={isPremium ? '#047857' : '#0ea5a3'} stopOpacity={1} />
                                </linearGradient>
                                {isPremium && (
                                    <filter id="glow" height="130%">
                                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                                        <feOffset dx="0" dy="2" result="offsetblur" />
                                        <feFlood floodColor="rgba(16, 185, 129, 0.5)" />
                                        <feComposite in2="offsetblur" operator="in" />
                                        <feMerge>
                                            <feMergeNode />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                )}
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[240px]">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-[#0f172a] mb-1">No Sales Data</h4>
                    <p className="text-xs text-[#6b7280]">Start making sales to see analytics</p>
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#e6eef2] flex items-center gap-4">
                <WorkflowChip label="New" count={chartData?.workflowStats?.new || 0} color="blue" />
                <WorkflowChip label="In Progress" count={chartData?.workflowStats?.inProgress || 0} color="amber" />
                <WorkflowChip label="Ready" count={chartData?.workflowStats?.ready || 0} color="emerald" />
                <WorkflowChip label="Delivered" count={chartData?.workflowStats?.delivered || 0} color="gray" />
                <div className="ml-auto text-xs text-[#6b7280]">
                    Avg processing: <span className="font-bold text-[#0f172a]">{chartData?.averageProcessingTime || '-'}</span>
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

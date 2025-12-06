"use client";

import { useState, useEffect } from "react";
import { FiTrendingUp, FiTrendingDown, FiDownload, FiCalendar } from "react-icons/fi";
import { MdShowChart, MdInsights } from "react-icons/md";
import { BsLightningChargeFill } from "react-icons/bs";
import { getTrendsReport, TrendsReportData } from "@/lib/api/reports";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ChartSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-[300px] bg-gray-100 rounded"></div>
    </div>
);

const InsightSkeleton = () => (
    <div className="p-4 rounded-lg border border-[#e2e8f0] animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
    </div>
);

export default function TrendsReportPage() {
    const [reportData, setReportData] = useState<TrendsReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<string>('90d');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getTrendsReport({ dateRange: dateRange as any });
                setReportData(data);
            } catch (err) {
                console.error('Failed to fetch trends report:', err);
                setError('Failed to load trends report');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [dateRange]);

    const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
    const formatMonth = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Trend Analysis</h1>
                            <p className="text-sm text-[#64748b]">Business trends, growth patterns, and predictive insights</p>
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                disabled={isLoading}
                            >
                                <option value="30d">Last 30 Days</option>
                                <option value="90d">Last 90 Days</option>
                                <option value="thisYear">This Year</option>
                            </select>
                            <button
                                className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                                disabled={isLoading}
                            >
                                <FiDownload className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="space-y-6">
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InsightSkeleton />
                                <InsightSkeleton />
                            </div>
                        </div>
                        <ChartSkeleton />
                        <ChartSkeleton />
                    </div>
                ) : error ? (
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                        <p className="text-red-600">{error}</p>
                    </div>
                ) : reportData ? (
                    <div className="space-y-6">
                        {/* Key Insights */}
                        {reportData.insights && reportData.insights.length > 0 && (
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <MdInsights className="w-5 h-5 text-[#0ea5a3]" />
                                    <h3 className="font-semibold text-[#0f172a]">Key Insights</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {reportData.insights.map((insight, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-lg border ${insight.type === 'positive'
                                                    ? 'bg-green-50 border-green-200'
                                                    : insight.type === 'warning'
                                                        ? 'bg-amber-50 border-amber-200'
                                                        : 'bg-blue-50 border-blue-200'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {insight.type === 'positive' ? (
                                                    <FiTrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                ) : insight.type === 'warning' ? (
                                                    <FiTrendingDown className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                                ) : (
                                                    <BsLightningChargeFill className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                )}
                                                <div>
                                                    <div className="font-medium text-[#0f172a] mb-1">{insight.title}</div>
                                                    <div className="text-sm text-[#64748b]">{insight.message}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Monthly Revenue Trend Chart */}
                        {reportData.monthlyTrend && reportData.monthlyTrend.length > 0 && (
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h3 className="font-semibold text-[#0f172a] mb-6">Monthly Revenue Trend</h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={reportData.monthlyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="month"
                                            tickFormatter={formatMonth}
                                            stroke="#64748b"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                            stroke="#64748b"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                                            labelFormatter={formatMonth}
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                padding: '8px 12px'
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#0ea5a3"
                                            strokeWidth={3}
                                            dot={{ fill: '#0ea5a3', r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name="Revenue"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Monthly Orders Trend */}
                        {reportData.monthlyTrend && reportData.monthlyTrend.length > 0 && (
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h3 className="font-semibold text-[#0f172a] mb-6">Monthly Orders Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={reportData.monthlyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="month"
                                            tickFormatter={formatMonth}
                                            stroke="#64748b"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                                        <Tooltip
                                            formatter={(value: any) => [value, 'Orders']}
                                            labelFormatter={formatMonth}
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                padding: '8px 12px'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="orders" fill="#0ea5a3" radius={[8, 8, 0, 0]} name="Orders" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Top Growing Products */}
                        {reportData.topGrowingProducts && reportData.topGrowingProducts.length > 0 && (
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h3 className="font-semibold text-[#0f172a] mb-6">Top Growing Products</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#e2e8f0]">
                                                <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Rank</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Product ID</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-[#64748b]">Current Sales</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-[#64748b]">Previous Sales</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-[#64748b]">Growth</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.topGrowingProducts.slice(0, 10).map((product, idx) => (
                                                <tr key={idx} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-yellow-500' :
                                                                    idx === 1 ? 'bg-gray-400' :
                                                                        idx === 2 ? 'bg-orange-600' :
                                                                            'bg-[#0ea5a3]'
                                                                }`}>
                                                                {idx + 1}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="font-medium text-[#0f172a]">{product.drugId}</div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-[#0f172a]">{product.currentQty} units</td>
                                                    <td className="py-4 px-4 text-right text-[#64748b]">{product.prevQty} units</td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <FiTrendingUp className="w-4 h-4 text-green-600" />
                                                            <span className="font-semibold text-green-600">+{product.growthRate.toFixed(0)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                        <MdShowChart className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-[#0f172a] mb-2">No Trends Data Available</h3>
                        <p className="text-[#64748b]">Start making sales to see trend analysis and growth patterns</p>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiCalendar, FiDownload } from "react-icons/fi";
import { MdShowChart } from "react-icons/md";

export default function ProfitReportPage() {
    const [dateRange, setDateRange] = useState("thisMonth");

    const profitData = {
        revenue: 1250000,
        cogs: 750000,
        grossProfit: 500000,
        expenses: 180000,
        netProfit: 320000,
        grossMargin: 40,
        netMargin: 25.6,
        revenueGrowth: 12.5,
        profitGrowth: 8.3
    };

    const categoryBreakdown = [
        { category: "Prescription Drugs", revenue: 650000, cost: 390000, profit: 260000, margin: 40 },
        { category: "OTC Medicines", revenue: 350000, cost: 210000, profit: 140000, margin: 40 },
        { category: "Health Supplements", revenue: 150000, cost: 90000, profit: 60000, margin: 40 },
        { category: "Medical Devices", revenue: 100000, cost: 60000, profit: 40000, margin: 40 }
    ];

    const monthlyTrend = [
        { month: "Aug", revenue: 980000, profit: 245000 },
        { month: "Sep", revenue: 1050000, profit: 273000 },
        { month: "Oct", revenue: 1120000, profit: 291200 },
        { month: "Nov", revenue: 1180000, profit: 307400 },
        { month: "Dec", revenue: 1250000, profit: 320000 }
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Profit & Loss Report</h1>
                            <p className="text-sm text-[#64748b]">Financial performance analysis</p>
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            >
                                <option value="today">Today</option>
                                <option value="thisWeek">This Week</option>
                                <option value="thisMonth">This Month</option>
                                <option value="lastMonth">Last Month</option>
                                <option value="thisQuarter">This Quarter</option>
                                <option value="thisYear">This Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2">
                                <FiDownload className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Revenue</span>
                            <FiDollarSign className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">₹{(profitData.revenue / 1000).toFixed(0)}K</div>
                        <div className="flex items-center gap-1 text-sm text-green-600">
                            <FiTrendingUp className="w-4 h-4" />
                            <span>+{profitData.revenueGrowth}% vs last month</span>
                        </div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Gross Profit</span>
                            <MdShowChart className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-green-600 mb-2">₹{(profitData.grossProfit / 1000).toFixed(0)}K</div>
                        <div className="text-sm text-[#64748b]">Margin: {profitData.grossMargin}%</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Net Profit</span>
                            <FiTrendingUp className="w-5 h-5 text-[#0ea5a3]" />
                        </div>
                        <div className="text-3xl font-bold text-[#0ea5a3] mb-2">₹{(profitData.netProfit / 1000).toFixed(0)}K</div>
                        <div className="flex items-center gap-1 text-sm text-green-600">
                            <FiTrendingUp className="w-4 h-4" />
                            <span>+{profitData.profitGrowth}% vs last month</span>
                        </div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Net Margin</span>
                            <MdShowChart className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="text-3xl font-bold text-purple-600 mb-2">{profitData.netMargin}%</div>
                        <div className="text-sm text-[#64748b]">Industry avg: 22%</div>
                    </div>
                </div>

                {/* P&L Statement */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-[#0f172a] mb-6">Profit & Loss Statement</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <span className="font-semibold text-[#0f172a]">Revenue</span>
                            <span className="text-xl font-bold text-blue-600">₹{profitData.revenue.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
                            <span className="text-[#64748b]">Cost of Goods Sold (COGS)</span>
                            <span className="font-medium text-red-600">-₹{profitData.cogs.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-t-2 border-green-200">
                            <span className="font-semibold text-[#0f172a]">Gross Profit</span>
                            <span className="text-xl font-bold text-green-600">₹{profitData.grossProfit.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
                            <span className="text-[#64748b]">Operating Expenses</span>
                            <span className="font-medium text-red-600">-₹{profitData.expenses.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#0ea5a3] bg-opacity-10 rounded-lg border-t-2 border-[#0ea5a3]">
                            <span className="font-bold text-[#0f172a] text-lg">Net Profit</span>
                            <span className="text-2xl font-bold text-[#0ea5a3]">₹{profitData.netProfit.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-[#0f172a] mb-6">Profitability by Category</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#e2e8f0]">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Category</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Revenue</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Cost</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Profit</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryBreakdown.map((cat) => (
                                    <tr key={cat.category} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                                        <td className="py-4 px-4 font-medium text-[#0f172a]">{cat.category}</td>
                                        <td className="py-4 px-4 text-right text-[#0f172a]">₹{cat.revenue.toLocaleString()}</td>
                                        <td className="py-4 px-4 text-right text-red-600">₹{cat.cost.toLocaleString()}</td>
                                        <td className="py-4 px-4 text-right font-semibold text-green-600">₹{cat.profit.toLocaleString()}</td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                {cat.margin}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Monthly Trend */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <h3 className="font-semibold text-[#0f172a] mb-6">5-Month Trend</h3>

                    <div className="space-y-4">
                        {monthlyTrend.map((month) => (
                            <div key={month.month} className="flex items-center gap-4">
                                <div className="w-16 text-sm font-medium text-[#64748b]">{month.month}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="flex-1">
                                            <div className="h-8 bg-blue-100 rounded-lg overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${(month.revenue / 1250000) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="w-32 text-right text-sm font-medium text-blue-600">
                                            ₹{(month.revenue / 1000).toFixed(0)}K
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="h-6 bg-green-100 rounded-lg overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500"
                                                    style={{ width: `${(month.profit / 320000) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="w-32 text-right text-sm font-medium text-green-600">
                                            ₹{(month.profit / 1000).toFixed(0)}K
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-[#e2e8f0] flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-[#64748b]">Revenue</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-[#64748b]">Profit</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

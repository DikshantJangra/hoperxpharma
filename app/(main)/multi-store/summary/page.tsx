"use client";

import { useState, useEffect } from "react";
import { FiTrendingUp, FiDollarSign, FiPackage, FiAlertTriangle, FiDownload, FiCalendar } from "react-icons/fi";

interface StorePerformance {
    storeId: string;
    storeName: string;
    sales: number;
    profit: number;
    stockValue: number;
    lowStockCount: number;
    expiringCount: number;
    rank: number;
}

const StatCardSkeleton = () => (
    <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl animate-pulse">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gray-100 rounded-lg">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>
            <div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-300 rounded w-32 mt-1"></div>
            </div>
        </div>
        <div className="h-3 bg-gray-100 rounded w-full"></div>
    </div>
)

const SalesChartSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
        </div>
    </div>
)

const TableRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="w-8 h-8 bg-gray-200 rounded-full"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
        <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
        <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
        <td className="px-6 py-4 text-center"><div className="h-6 w-16 bg-gray-200 rounded-full mx-auto"></div></td>
        <td className="px-6 py-4 text-center"><div className="h-6 w-16 bg-gray-200 rounded-full mx-auto"></div></td>
    </tr>
)

export default function SummaryPage() {
    const [dateRange, setDateRange] = useState("month");
    const [performanceData, setPerformanceData] = useState<StorePerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setPerformanceData([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [dateRange]);

    const totalSales = performanceData.reduce((sum, store) => sum + store.sales, 0);
    const totalProfit = performanceData.reduce((sum, store) => sum + store.profit, 0);
    const totalStockValue = performanceData.reduce((sum, store) => sum + store.stockValue, 0);
    const totalAlerts = performanceData.reduce((sum, store) => sum + store.lowStockCount + store.expiringCount, 0);
    const avgSalesPerStore = performanceData.length > 0 ? totalSales / performanceData.length : 0;

    const topStore = performanceData.length > 0 ? [...performanceData].sort((a, b) => b.sales - a.sales)[0] : null;
    const maxSales = performanceData.length > 0 ? Math.max(...performanceData.map((s) => s.sales)) : 0;

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Multi-Store Summary</h1>
                            <p className="text-sm text-[#64748b]">Multi-Store › Summary</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] flex items-center gap-2"
                                disabled={isLoading}
                            >
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="quarter">This Quarter</option>
                                <option value="year">This Year</option>
                            </select>
                            <button className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] transition-colors flex items-center gap-2" disabled={isLoading}>
                                <FiDownload className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {isLoading ? (
                        <>
                            <StatCardSkeleton/>
                            <StatCardSkeleton/>
                            <StatCardSkeleton/>
                            <StatCardSkeleton/>
                        </>
                    ) : (
                        <>
                            <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <FiDollarSign className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Total Sales</div>
                                        <div className="text-2xl font-bold text-[#0f172a]">₹{totalSales.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-[#64748b]">Across {performanceData.length} stores</div>
                            </div>

                            <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <FiTrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Avg per Store</div>
                                        <div className="text-2xl font-bold text-[#0f172a]">₹{avgSalesPerStore.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-[#64748b]">Average sales performance</div>
                            </div>

                            <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-3 bg-amber-100 rounded-lg">
                                        <FiPackage className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Total Stock Value</div>
                                        <div className="text-2xl font-bold text-[#0f172a]">₹{totalStockValue.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-[#64748b]">Combined inventory value</div>
                            </div>

                            <div className="p-6 bg-white border border-[#e2e8f0] rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-3 bg-red-100 rounded-lg">
                                        <FiAlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Total Alerts</div>
                                        <div className="text-2xl font-bold text-[#0f172a]">{totalAlerts}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-[#64748b]">Low stock + expiring items</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Top Performer Banner */}
                {isLoading ? (
                    <div className="p-6 bg-gray-200 rounded-xl mb-8 animate-pulse">
                        <div className="h-6 bg-gray-300 rounded w-1/4 mb-2"></div>
                        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                    </div>
                ) : topStore && (
                    <div className="p-6 bg-gradient-to-r from-[#0ea5a3] to-[#0d9391] text-white rounded-xl mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold uppercase opacity-90 mb-1">🏆 Top Performing Store</div>
                                <h2 className="text-3xl font-bold mb-1">{topStore.storeName}</h2>
                                <p className="text-white/80">Leading with ₹{topStore.sales.toLocaleString()} in sales</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold">#{topStore.rank}</div>
                                <div className="text-sm text-white/80">Rank</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sales Comparison Chart */}
                <SalesChartSkeleton/>

                {/* Store Comparison Table */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-[#e2e8f0]">
                        <h3 className="text-lg font-bold text-[#0f172a]">Store Performance Comparison</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#f8fafc]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Store</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748b] uppercase">Sales</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748b] uppercase">Profit</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748b] uppercase">Stock Value</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-[#64748b] uppercase">Low Stock</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-[#64748b] uppercase">Expiring</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e2e8f0]">
                                {isLoading ? (
                                    <>
                                        <TableRowSkeleton/>
                                        <TableRowSkeleton/>
                                        <TableRowSkeleton/>
                                    </>
                                ) : performanceData.length > 0 ? (
                                    performanceData.sort((a, b) => b.sales - a.sales).map((store, index) => (
                                        <tr key={store.storeId} className="hover:bg-[#f8fafc] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center font-bold text-[#0f172a]">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-[#0f172a]">{store.storeName}</td>
                                            <td className="px-6 py-4 text-right font-bold text-[#0ea5a3]">
                                                ₹{store.sales.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-green-700">
                                                ₹{store.profit.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-[#475569]">
                                                ₹{store.stockValue.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-bold">
                                                    {store.lowStockCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                                                    {store.expiringCount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={7} className="text-center py-10 text-gray-500">No store performance data available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

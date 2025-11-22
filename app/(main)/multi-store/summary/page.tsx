"use client";

import { useState } from "react";
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

const MOCK_PERFORMANCE: StorePerformance[] = [
    {
        storeId: "1",
        storeName: "HopeRx Main Branch",
        sales: 450000,
        profit: 67500,
        stockValue: 1200000,
        lowStockCount: 12,
        expiringCount: 8,
        rank: 1
    },
    {
        storeId: "2",
        storeName: "HopeRx Andheri",
        sales: 320000,
        profit: 48000,
        stockValue: 850000,
        lowStockCount: 8,
        expiringCount: 5,
        rank: 2
    },
    {
        storeId: "3",
        storeName: "HopeRx Thane",
        sales: 280000,
        profit: 42000,
        stockValue: 720000,
        lowStockCount: 15,
        expiringCount: 10,
        rank: 3
    },
    {
        storeId: "4",
        storeName: "HopeRx Pune",
        sales: 380000,
        profit: 57000,
        stockValue: 950000,
        lowStockCount: 20,
        expiringCount: 12,
        rank: 2
    }
];

export default function SummaryPage() {
    const [dateRange, setDateRange] = useState("month");

    const totalSales = MOCK_PERFORMANCE.reduce((sum, store) => sum + store.sales, 0);
    const totalProfit = MOCK_PERFORMANCE.reduce((sum, store) => sum + store.profit, 0);
    const totalStockValue = MOCK_PERFORMANCE.reduce((sum, store) => sum + store.stockValue, 0);
    const totalAlerts = MOCK_PERFORMANCE.reduce((sum, store) => sum + store.lowStockCount + store.expiringCount, 0);
    const avgSalesPerStore = totalSales / MOCK_PERFORMANCE.length;

    const topStore = [...MOCK_PERFORMANCE].sort((a, b) => b.sales - a.sales)[0];
    const maxSales = Math.max(...MOCK_PERFORMANCE.map((s) => s.sales));

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
                            >
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="quarter">This Quarter</option>
                                <option value="year">This Year</option>
                            </select>
                            <button className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
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
                        <div className="text-xs text-[#64748b]">Across {MOCK_PERFORMANCE.length} stores</div>
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
                </div>

                {/* Top Performer Banner */}
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

                {/* Sales Comparison Chart */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-[#0f172a] mb-6">Sales by Store</h3>
                    <div className="space-y-4">
                        {MOCK_PERFORMANCE.sort((a, b) => b.sales - a.sales).map((store) => (
                            <div key={store.storeId}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-[#0f172a]">{store.storeName}</span>
                                    <span className="font-bold text-[#0ea5a3]">₹{store.sales.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-[#f1f5f9] rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-[#0ea5a3] to-[#0d9391] h-3 rounded-full transition-all"
                                        style={{ width: `${(store.sales / maxSales) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

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
                                {MOCK_PERFORMANCE.sort((a, b) => b.sales - a.sales).map((store, index) => (
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

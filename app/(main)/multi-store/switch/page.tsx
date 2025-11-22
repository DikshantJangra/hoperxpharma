"use client";

import { useState } from "react";
import { FiStar, FiMapPin, FiTrendingUp, FiAlertTriangle, FiClock, FiUsers, FiCheck } from "react-icons/fi";

interface Store {
    id: string;
    name: string;
    location: string;
    region: string;
    status: "online" | "offline";
    isPinned: boolean;
    stats: {
        todaySales: number;
        stockValue: number;
        lowStockCount: number;
        expiringCount: number;
        staffCount: number;
    };
    lastAccessed?: Date;
}

const MOCK_STORES: Store[] = [
    {
        id: "1",
        name: "HopeRx Main Branch",
        location: "Mumbai, Maharashtra",
        region: "West",
        status: "online",
        isPinned: true,
        stats: {
            todaySales: 45000,
            stockValue: 1200000,
            lowStockCount: 12,
            expiringCount: 8,
            staffCount: 5
        },
        lastAccessed: new Date()
    },
    {
        id: "2",
        name: "HopeRx Andheri",
        location: "Andheri, Mumbai",
        region: "West",
        status: "online",
        isPinned: true,
        stats: {
            todaySales: 32000,
            stockValue: 850000,
            lowStockCount: 8,
            expiringCount: 5,
            staffCount: 4
        }
    },
    {
        id: "3",
        name: "HopeRx Thane",
        location: "Thane, Maharashtra",
        region: "West",
        status: "online",
        isPinned: false,
        stats: {
            todaySales: 28000,
            stockValue: 720000,
            lowStockCount: 15,
            expiringCount: 10,
            staffCount: 3
        }
    },
    {
        id: "4",
        name: "HopeRx Pune",
        location: "Pune, Maharashtra",
        region: "West",
        status: "offline",
        isPinned: false,
        stats: {
            todaySales: 0,
            stockValue: 950000,
            lowStockCount: 20,
            expiringCount: 12,
            staffCount: 4
        }
    }
];

export default function SwitchStorePage() {
    const [currentStoreId, setCurrentStoreId] = useState("1");
    const [stores, setStores] = useState(MOCK_STORES);
    const [searchQuery, setSearchQuery] = useState("");

    const currentStore = stores.find((s) => s.id === currentStoreId);
    const pinnedStores = stores.filter((s) => s.isPinned);
    const filteredStores = stores.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const togglePin = (id: string) => {
        setStores(stores.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s)));
    };

    const switchStore = (id: string) => {
        setCurrentStoreId(id);
        // In production, this would update global context and refresh data
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Switch Store</h1>
                    <p className="text-sm text-[#64748b] mb-4">Multi-Store › Switch</p>

                    {/* Current Store */}
                    <div className="p-4 bg-gradient-to-r from-[#0ea5a3] to-[#0d9391] text-white rounded-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <FiCheck className="w-5 h-5" />
                                    <span className="text-sm font-semibold uppercase opacity-90">Current Store</span>
                                </div>
                                <h2 className="text-2xl font-bold">{currentStore?.name}</h2>
                                <p className="text-white/80 text-sm">{currentStore?.location}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold">₹{currentStore?.stats.todaySales.toLocaleString()}</div>
                                <div className="text-sm text-white/80">Today's Sales</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Pinned Stores */}
                {pinnedStores.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-[#64748b] uppercase mb-3 flex items-center gap-2">
                            <FiStar className="w-4 h-4" />
                            Favorite Stores
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {pinnedStores.map((store) => (
                                <button
                                    key={store.id}
                                    onClick={() => switchStore(store.id)}
                                    className={`p-4 border-2 rounded-xl text-left transition-all ${store.id === currentStoreId
                                            ? "border-[#0ea5a3] bg-[#f0fdfa]"
                                            : "border-[#e2e8f0] hover:border-[#cbd5e1] bg-white"
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#0f172a]">{store.name}</h4>
                                            <p className="text-xs text-[#64748b]">{store.location}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePin(store.id);
                                            }}
                                            className="p-1 hover:bg-[#f8fafc] rounded"
                                        >
                                            <FiStar className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        </button>
                                    </div>
                                    <div className="text-lg font-bold text-[#0ea5a3]">
                                        ₹{store.stats.todaySales.toLocaleString()}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search stores by name or location..."
                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                    />
                </div>

                {/* All Stores Grid */}
                <div>
                    <h3 className="text-sm font-semibold text-[#64748b] uppercase mb-3">
                        All Stores ({filteredStores.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStores.map((store) => (
                            <div
                                key={store.id}
                                className={`bg-white border-2 rounded-xl overflow-hidden transition-all ${store.id === currentStoreId
                                        ? "border-[#0ea5a3] shadow-lg"
                                        : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                                    }`}
                            >
                                {/* Card Header */}
                                <div className="p-4 border-b border-[#e2e8f0]">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#0f172a] mb-1">{store.name}</h4>
                                            <div className="flex items-center gap-1 text-xs text-[#64748b]">
                                                <FiMapPin className="w-3 h-3" />
                                                {store.location}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => togglePin(store.id)}
                                            className="p-1.5 hover:bg-[#f8fafc] rounded transition-colors"
                                        >
                                            <FiStar
                                                className={`w-4 h-4 ${store.isPinned ? "fill-amber-400 text-amber-400" : "text-[#cbd5e1]"
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-2 h-2 rounded-full ${store.status === "online" ? "bg-green-500" : "bg-red-500"
                                                }`}
                                        ></div>
                                        <span className="text-xs font-medium text-[#64748b]">
                                            {store.status === "online" ? "Online" : "Offline"}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-[#64748b]">
                                            <FiTrendingUp className="w-4 h-4" />
                                            <span>Today's Sales</span>
                                        </div>
                                        <span className="font-bold text-[#0f172a]">
                                            ₹{store.stats.todaySales.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-[#64748b]">Stock Value</div>
                                        <span className="font-semibold text-[#475569]">
                                            ₹{store.stats.stockValue.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-[#64748b]">
                                            <FiAlertTriangle className="w-4 h-4 text-amber-600" />
                                            <span>Low Stock</span>
                                        </div>
                                        <span className="font-semibold text-amber-700">{store.stats.lowStockCount}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-[#64748b]">
                                            <FiClock className="w-4 h-4 text-red-600" />
                                            <span>Expiring Soon</span>
                                        </div>
                                        <span className="font-semibold text-red-700">{store.stats.expiringCount}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-[#64748b]">
                                            <FiUsers className="w-4 h-4" />
                                            <span>Staff on Duty</span>
                                        </div>
                                        <span className="font-semibold text-[#475569]">{store.stats.staffCount}</span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="p-4 border-t border-[#e2e8f0]">
                                    {store.id === currentStoreId ? (
                                        <div className="px-4 py-2 bg-[#f0fdfa] border-2 border-[#0ea5a3] rounded-lg text-center font-semibold text-[#0ea5a3] flex items-center justify-center gap-2">
                                            <FiCheck className="w-4 h-4" />
                                            Current Store
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => switchStore(store.id)}
                                            disabled={store.status === "offline"}
                                            className="w-full px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Switch to this Store
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

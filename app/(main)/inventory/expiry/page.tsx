"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiDownload, FiAlertTriangle, FiTag, FiTrash2 } from "react-icons/fi";

type ExpiryCategory = "critical" | "90days" | "180days" | "dead";

interface ExpiryItem {
    id: string;
    medicineName: string;
    strength: string;
    batchNumber: string;
    expiryDate: string;
    daysUntilExpiry: number;
    quantity: number;
    costPrice: number;
    mrp: number;
    totalCostValue: number;
    totalMRPValue: number;
    supplier: string;
    category: ExpiryCategory;
    suggestedDiscount: number;
    currentDiscount?: number;
}

const CATEGORY_CONFIG = {
    critical: {
        label: "Critical (<30 days)",
        color: "red",
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-900",
        badge: "bg-red-100 text-red-800"
    },
    "90days": {
        label: "90 Days",
        color: "orange",
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-900",
        badge: "bg-orange-100 text-orange-800"
    },
    "180days": {
        label: "180 Days",
        color: "yellow",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-900",
        badge: "bg-yellow-100 text-yellow-800"
    },
    dead: {
        label: "Dead Stock",
        color: "gray",
        bg: "bg-gray-50",
        border: "border-gray-300",
        text: "text-gray-700",
        badge: "bg-gray-100 text-gray-800"
    }
};

const TableRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3 text-right"><div className="h-6 w-16 bg-gray-200 rounded-full ml-auto"></div></td>
        <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-10 ml-auto"></div></td>
        <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-12 ml-auto"></div></td>
        <td className="px-4 py-3 text-center"><div className="h-6 w-12 bg-gray-200 rounded-full mx-auto"></div></td>
    </tr>
)

export default function ExpiryPage() {
    const [activeCategory, setActiveCategory] = useState<ExpiryCategory>("critical");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState<ExpiryItem | null>(null);
    const [expiryItems, setExpiryItems] = useState<ExpiryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setExpiryItems([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, []);

    const filteredItems = expiryItems.filter(
        (item) =>
            item.category === activeCategory &&
            (item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const stats = {
        critical: expiryItems.filter((i) => i.category === "critical"),
        "90days": expiryItems.filter((i) => i.category === "90days"),
        "180days": expiryItems.filter((i) => i.category === "180days"),
        dead: expiryItems.filter((i) => i.category === "dead")
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                document.getElementById("expiry-search")?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a]">Expiry Management</h1>
                        <p className="text-sm text-[#64748b]">Inventory › Expiry</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm" disabled={isLoading}>
                            <FiDownload className="w-4 h-4" />
                            Export Report
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                        <input
                            id="expiry-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search medicine / batch# — press /"
                            className="w-full pl-10 pr-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-3">
                    {isLoading ? (
                        <>
                            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                        </>
                    ) : (
                        <>
                            <div className="px-3 py-1.5 bg-[#fee2e2] rounded-lg text-sm">
                                <span className="text-[#991b1b]">Critical:</span>{" "}
                                <span className="font-semibold text-[#991b1b]">
                                    {stats.critical.length} | ₹
                                    {stats.critical.reduce((sum, i) => sum + i.totalMRPValue, 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="px-3 py-1.5 bg-[#fed7aa] rounded-lg text-sm">
                                <span className="text-[#9a3412]">90 Days:</span>{" "}
                                <span className="font-semibold text-[#9a3412]">
                                    {stats["90days"].length} | ₹
                                    {stats["90days"].reduce((sum, i) => sum + i.totalMRPValue, 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="px-3 py-1.5 bg-[#fef3c7] rounded-lg text-sm">
                                <span className="text-[#92400e]">180 Days:</span>{" "}
                                <span className="font-semibold text-[#92400e]">
                                    {stats["180days"].length} | ₹
                                    {stats["180days"].reduce((sum, i) => sum + i.totalMRPValue, 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="px-3 py-1.5 bg-[#f1f5f9] rounded-lg text-sm">
                                <span className="text-[#475569]">Dead Stock:</span>{" "}
                                <span className="font-semibold text-[#475569]">
                                    {stats.dead.length} | ₹
                                    {stats.dead.reduce((sum, i) => sum + i.totalMRPValue, 0).toLocaleString()}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Category Tabs (Left Sidebar) */}
                <div className="w-64 bg-white border-r border-[#e2e8f0] p-4">
                    <h3 className="text-sm font-semibold text-[#64748b] uppercase mb-3">Categories</h3>
                    <div className="space-y-2">
                        {(Object.keys(CATEGORY_CONFIG) as ExpiryCategory[]).map((category) => {
                            const config = CATEGORY_CONFIG[category];
                            const count = stats[category].length;
                            const isActive = activeCategory === category;

                            return (
                                <button
                                    key={category}
                                    onClick={() => {
                                        setActiveCategory(category);
                                        setSelectedItem(null);
                                    }}
                                    className={`w-full px-4 py-3 rounded-lg text-left transition-all ${isActive
                                            ? `${config.bg} border-2 ${config.border}`
                                            : "border-2 border-transparent hover:bg-[#f8fafc]"
                                        }`}
                                    disabled={isLoading}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-semibold text-sm ${isActive ? config.text : "text-[#475569]"}`}>
                                            {config.label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${config.badge}`}>
                                            {isLoading ? '...' : count}
                                        </span>
                                    </div>
                                    <div className="text-xs text-[#64748b]">
                                        ₹{stats[category].reduce((sum, i) => sum + i.totalMRPValue, 0).toLocaleString()}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Expiry Table */}
                <div className={`${selectedItem ? "w-[45%]" : "flex-1"} transition-all overflow-auto`}>
                    <div className="p-4">
                        <table className="w-full">
                            <thead className="bg-[#f8fafc] sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Medicine</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Batch</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Expiry</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b] uppercase">Days Left</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b] uppercase">Qty</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b] uppercase">Value</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#64748b] uppercase">Discount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <>
                                        <TableRowSkeleton/>
                                        <TableRowSkeleton/>
                                        <TableRowSkeleton/>
                                        <TableRowSkeleton/>
                                    </>
                                ) : filteredItems.length > 0 ? (
                                    filteredItems.map((item) => {
                                        const config = CATEGORY_CONFIG[item.category];
                                        const isSelected = selectedItem?.id === item.id;

                                        return (
                                            <tr
                                                key={item.id}
                                                onClick={() => setSelectedItem(item)}
                                                className={`border-b border-[#e2e8f0] cursor-pointer transition-all ${isSelected ? `${config.bg} border-l-4 ${config.border}` : "hover:bg-[#f8fafc]"
                                                    }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-[#0f172a]">{item.medicineName}</div>
                                                    <div className="text-xs text-[#64748b]">{item.strength}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-sm text-[#475569]">{item.batchNumber}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[#475569]">{item.expiryDate}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-bold ${item.daysUntilExpiry < 0
                                                                ? "bg-black text-white"
                                                                : item.daysUntilExpiry < 30
                                                                    ? "bg-red-100 text-red-800"
                                                                    : item.daysUntilExpiry < 90
                                                                        ? "bg-orange-100 text-orange-800"
                                                                        : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                    >
                                                        {item.daysUntilExpiry < 0 ? "EXPIRED" : `${item.daysUntilExpiry}d`}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">
                                                    ₹{item.totalMRPValue.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.suggestedDiscount > 0 ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                                            {item.suggestedDiscount}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-[#94a3b8]">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-[#94a3b8]">
                                            <FiAlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No items found in this category</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Panel */}
                {selectedItem && (
                    <div className="w-[35%] bg-white border-l border-[#e2e8f0] overflow-auto">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-[#0f172a] mb-1">{selectedItem.medicineName}</h2>
                                    <p className="text-sm text-[#64748b]">{selectedItem.strength}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Batch Info */}
                            <div className="mb-6 p-4 bg-[#f8fafc] rounded-lg">
                                <h3 className="font-semibold text-[#0f172a] mb-3">Batch Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[#64748b]">Batch Number:</span>
                                        <span className="font-mono font-semibold text-[#0f172a]">{selectedItem.batchNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#64748b]">Expiry Date:</span>
                                        <span className="font-semibold text-[#0f172a]">{selectedItem.expiryDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#64748b]">Days Until Expiry:</span>
                                        <span className={`font-bold ${selectedItem.daysUntilExpiry < 0 ? "text-black" : selectedItem.daysUntilExpiry < 30 ? "text-red-700" : "text-orange-700"}`}>
                                            {selectedItem.daysUntilExpiry < 0 ? "EXPIRED" : `${selectedItem.daysUntilExpiry} days`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#64748b]">Supplier:</span>
                                        <span className="font-semibold text-[#0f172a]">{selectedItem.supplier}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="mb-6 p-4 border-2 border-[#0ea5a3] rounded-lg bg-[#f0fdfa]">
                                <h3 className="font-semibold text-[#0f172a] mb-3">Pricing Suggestion</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#64748b]">Current MRP:</span>
                                        <span className="font-semibold text-[#0f172a]">₹{selectedItem.mrp}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#64748b]">Suggested Discount:</span>
                                        <span className="font-bold text-[#0ea5a3]">{selectedItem.suggestedDiscount}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#64748b]">New Selling Price:</span>
                                        <span className="font-bold text-[#0ea5a3]">
                                            ₹{(selectedItem.mrp * (1 - selectedItem.suggestedDiscount / 100)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t border-[#0ea5a3]/20">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-[#0f172a]">Total Value (Discounted):</span>
                                            <span className="font-bold text-[#0ea5a3] text-lg">
                                                ₹
                                                {(
                                                    selectedItem.quantity *
                                                    selectedItem.mrp *
                                                    (1 - selectedItem.suggestedDiscount / 100)
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button className="w-full px-4 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center justify-center gap-2">
                                    <FiTag className="w-4 h-4" />
                                    Apply Discount
                                </button>
                                <button className="w-full px-4 py-3 border-2 border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors">
                                    Return to Supplier
                                </button>
                                {selectedItem.category === "dead" && (
                                    <button className="w-full px-4 py-3 border-2 border-red-200 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                                        <FiTrash2 className="w-4 h-4" />
                                        Mark for Disposal
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

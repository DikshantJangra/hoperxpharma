"use client";

import { useState, useEffect } from "react";
import { FiClock, FiTrash2, FiEdit, FiSave } from "react-icons/fi";
import { MdDrafts } from "react-icons/md";

const DraftCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                <div className="h-10 w-24 bg-gray-100 rounded-lg"></div>
            </div>
        </div>
        <div className="border-t border-[#e2e8f0] pt-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="space-y-2">
                <div className="h-12 bg-gray-100 rounded-lg"></div>
                <div className="h-12 bg-gray-100 rounded-lg"></div>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex items-center justify-between">
            <div className="h-4 bg-gray-100 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
    </div>
)

export default function POSDraftsPage() {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setDrafts([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [])

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h`;
        return "Expiring soon";
    };

    const handleDelete = (id: string) => {
        setDrafts(drafts.filter(d => d.id !== id));
    };

    const totalDrafts = drafts.length;
    const totalValue = drafts.reduce((sum, d) => sum + d.subtotal, 0);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Draft Invoices</h1>
                    <p className="text-sm text-[#64748b]">Resume incomplete sales • Auto-saved every 30 seconds</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Drafts</span>
                            <MdDrafts className="w-5 h-5 text-[#0ea5a3]" />
                        </div>
                        {isLoading ? <div className="h-8 w-1/4 bg-gray-200 rounded-md animate-pulse"></div> : <div className="text-3xl font-bold text-[#0ea5a3]">{totalDrafts}</div>}
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Value</span>
                            <FiSave className="w-5 h-5 text-blue-500" />
                        </div>
                        {isLoading ? <div className="h-8 w-1/2 bg-gray-200 rounded-md animate-pulse"></div> : <div className="text-3xl font-bold text-blue-600">₹{totalValue.toLocaleString()}</div>}
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Auto-Save</span>
                            <FiClock className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-lg font-bold text-green-600">Active</div>
                        <div className="text-xs text-[#64748b] mt-1">Last saved: Just now</div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <FiClock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <strong>Note:</strong> Drafts are automatically deleted after 7 days of inactivity.
                        All drafts are auto-saved every 30 seconds to prevent data loss.
                    </div>
                </div>

                {/* Drafts List */}
                {isLoading ? (
                    <div className="space-y-4">
                        <DraftCardSkeleton/>
                        <DraftCardSkeleton/>
                    </div>
                ) : drafts.length > 0 ? (
                    <div className="space-y-4">
                        {drafts.map((draft) => (
                            <div key={draft.id} className="bg-white border border-[#e2e8f0] rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-[#0f172a]">
                                                {draft.customerName || "Walk-in Customer"}
                                            </h3>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                                                <FiClock className="w-3 h-3" />
                                                Expires in {getTimeRemaining(draft.expiresAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-[#64748b]">
                                            <span>Draft ID: {draft.id}</span>
                                            {draft.customerPhone && <span>Phone: {draft.customerPhone}</span>}
                                            <span>Created: {new Date(draft.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2">
                                            <FiEdit className="w-4 h-4" />
                                            Resume
                                        </button>
                                        <button
                                            onClick={() => handleDelete(draft.id)}
                                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Items Preview */}
                                <div className="border-t border-[#e2e8f0] pt-4">
                                    <h4 className="font-medium text-[#0f172a] mb-3 text-sm">Items ({draft.items.length})</h4>
                                    <div className="space-y-2">
                                        {draft.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                                                <div className="flex-1">
                                                    <div className="font-medium text-[#0f172a]">{item.name}</div>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm">
                                                    <div className="text-[#64748b]">Qty: <span className="font-medium text-[#0f172a]">{item.qty}</span></div>
                                                    <div className="font-medium text-[#0f172a]">₹{item.price}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Subtotal */}
                                <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex items-center justify-between">
                                    <div className="text-sm text-[#64748b]">
                                        Last modified: {new Date(draft.lastModified).toLocaleString()}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-[#64748b] mb-1">Subtotal</div>
                                        <div className="text-2xl font-bold text-[#0ea5a3]">₹{draft.subtotal.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                        <MdDrafts className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-[#0f172a] mb-2">No Draft Invoices</h3>
                        <p className="text-[#64748b] mb-6">Start a new sale to create a draft</p>
                        <button className="px-6 py-3 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors">
                            New Sale
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

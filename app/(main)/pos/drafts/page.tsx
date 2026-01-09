"use client";

import { useState, useEffect } from "react";
import { toast } from 'sonner';
import { FiClock, FiTrash2, FiEdit, FiSave, FiSettings, FiChevronDown } from "react-icons/fi";
import { MdDrafts } from "react-icons/md";
import { salesApi } from "@/lib/api/sales";
import { useRouter } from "next/navigation";

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
    const router = useRouter();
    const [drafts, setDrafts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [autoRestore, setAutoRestore] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('pos_auto_restore_drafts') !== 'false';
        }
        return true;
    });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (showSettings && !target.closest('.settings-dropdown')) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSettings]);

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await salesApi.getDrafts();
            console.log('Drafts API response:', response);

            // Handle both wrapped response {data: [...]} and direct array
            const draftsData = response.data || response.drafts || response;
            const draftsArray = Array.isArray(draftsData) ? draftsData : [];

            console.log('Extracted drafts:', draftsArray);
            setDrafts(draftsArray);
        } catch (err: any) {
            console.error('Error fetching drafts:', err);
            setError(err.message || 'Failed to load drafts');
            setDrafts([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this draft?')) return;

        try {
            await salesApi.deleteDraft(id);
            setDrafts(drafts.filter(d => d.id !== id));
            toast.success('Draft deleted successfully');
        } catch (err: any) {
            console.error('Failed to delete draft:', err);
            toast.error('Failed to delete draft: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Are you sure you want to delete ALL drafts? This cannot be undone.')) return;

        try {
            for (const draft of drafts) {
                await salesApi.deleteDraft(draft.id);
            }
            setDrafts([]);
            toast.success('All drafts deleted successfully');
        } catch (err: any) {
            console.error('Failed to delete all drafts:', err);
            toast.error('Failed to delete drafts');
        }
    };

    const handleToggleAutoRestore = () => {
        const newValue = !autoRestore;
        setAutoRestore(newValue);
        localStorage.setItem('pos_auto_restore_drafts', String(newValue));
        toast.success(newValue ? 'Auto-restore enabled' : 'Auto-restore disabled');
    };

    const handleResume = (draft: any) => {
        try {
            // Parse items if they're stored as JSON string
            const items = typeof draft.items === 'string' ? JSON.parse(draft.items) : draft.items;

            // Store complete draft with parsed items in localStorage
            const draftToResume = {
                ...draft,
                items: items || []
            };

            localStorage.setItem('resumeDraft', JSON.stringify(draftToResume));
            console.log('Stored draft for resume:', draftToResume);

            // Navigate to new sale
            router.push('/pos/new-sale');
        } catch (err) {
            console.error('Error preparing draft for resume:', err);
            toast.error('Failed to resume draft');
        }
    };

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

    const totalDrafts = drafts.length;
    const totalValue = drafts.reduce((sum, d) => sum + Number(d.total), 0);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Draft Invoices</h1>
                        <p className="text-sm text-[#64748b]">Resume incomplete sales • Auto-saved every 30 seconds</p>
                    </div>
                    <div className="relative settings-dropdown">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <FiSettings className="w-4 h-4" />
                            <span className="text-sm font-medium">Settings</span>
                            <FiChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                        </button>
                        {showSettings && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">Auto-restore Drafts</div>
                                            <div className="text-xs text-gray-500 mt-0.5">Restore last draft on page load</div>
                                        </div>
                                        <button
                                            onClick={handleToggleAutoRestore}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRestore ? 'bg-teal-600' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoRestore ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <button
                                            onClick={handleDeleteAll}
                                            disabled={drafts.length === 0}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                            Delete All Drafts
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                        <button onClick={fetchDrafts} className="mt-2 text-red-600 underline">Retry</button>
                    </div>
                )}

                {/* Drafts List */}
                {isLoading ? (
                    <div className="space-y-4">
                        <DraftCardSkeleton />
                        <DraftCardSkeleton />
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
                                            <span>Draft: {draft.draftNumber}</span>
                                            {draft.customerPhone && <span>Phone: {draft.customerPhone}</span>}
                                            <span>Created: {new Date(draft.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleResume(draft)}
                                            className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                                        >
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
                                    <h4 className="font-medium text-[#0f172a] mb-3 text-sm">Items ({(() => {
                                        try {
                                            const items = typeof draft.items === 'string' ? JSON.parse(draft.items) : draft.items;
                                            return items?.length || 0;
                                        } catch {
                                            return 0;
                                        }
                                    })()})</h4>
                                    <div className="space-y-2">
                                        {(() => {
                                            try {
                                                const items = typeof draft.items === 'string' ? JSON.parse(draft.items) : draft.items;
                                                return items?.slice(0, 3).map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-[#0f172a]">{item.name || 'Item'}</div>
                                                        </div>
                                                        <div className="flex items-center gap-6 text-sm">
                                                            <div className="text-[#64748b]">Qty: <span className="font-medium text-[#0f172a]">{item.qty || item.quantity}</span></div>
                                                            <div className="font-medium text-[#0f172a]">₹{item.mrp}</div>
                                                        </div>
                                                    </div>
                                                ));
                                            } catch (e) {
                                                console.error('Error parsing draft items:', e);
                                                return <div className="text-sm text-red-500">Error loading items</div>;
                                            }
                                        })()}
                                        {(() => {
                                            try {
                                                const items = typeof draft.items === 'string' ? JSON.parse(draft.items) : draft.items;
                                                return items?.length > 3 && (
                                                    <div className="text-sm text-[#64748b] text-center py-2">
                                                        +{items.length - 3} more items
                                                    </div>
                                                );
                                            } catch {
                                                return null;
                                            }
                                        })()}
                                    </div>
                                </div>

                                {/* Subtotal */}
                                <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex items-center justify-between">
                                    <div className="text-sm text-[#64748b]">
                                        Last modified: {new Date(draft.updatedAt).toLocaleString()}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-[#64748b] mb-1">Total</div>
                                        <div className="text-2xl font-bold text-[#0ea5a3]">₹{Number(draft.total).toLocaleString()}</div>
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
                        <button
                            onClick={() => router.push('/pos/new-sale')}
                            className="px-6 py-3 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors"
                        >
                            New Sale
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

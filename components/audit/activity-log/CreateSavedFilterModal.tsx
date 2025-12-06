"use client";
import { useState } from "react";
import { FiX, FiSave, FiFilter, FiBell } from "react-icons/fi";
import { auditApi } from "@/lib/api/audit";
import { toast } from "react-hot-toast";

interface CreateSavedFilterModalProps {
    currentFilters: any;
    onClose: () => void;
    onSave: () => void;
}

export default function CreateSavedFilterModal({
    currentFilters,
    onClose,
    onSave,
}: CreateSavedFilterModalProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState<"filter" | "watchlist">("filter");
    const [alertEnabled, setAlertEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setIsSubmitting(true);
            await auditApi.createSavedFilter({
                name,
                filters: currentFilters,
                type,
                alertEnabled: type === "watchlist" ? alertEnabled : false,
            });
            toast.success("Saved filter created successfully");
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to create saved filter:", error);
            toast.error("Failed to create saved filter");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[500px] shadow-xl">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Save Filter</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., High Value Sales, Suspicious Logins"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setType("filter")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${type === "filter"
                                        ? "bg-teal-50 border-teal-200 text-teal-700"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <FiFilter />
                                <span>Saved Filter</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("watchlist")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${type === "watchlist"
                                        ? "bg-teal-50 border-teal-200 text-teal-700"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <FiBell />
                                <span>Watchlist</span>
                            </button>
                        </div>
                    </div>

                    {type === "watchlist" && (
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex items-center h-5">
                                    <input
                                        id="alerts"
                                        type="checkbox"
                                        checked={alertEnabled}
                                        onChange={(e) => setAlertEnabled(e.target.checked)}
                                        className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                    />
                                </div>
                                <div className="text-sm">
                                    <label htmlFor="alerts" className="font-medium text-gray-900">
                                        Enable Alerts
                                    </label>
                                    <p className="text-gray-500 mt-1">
                                        Receive notifications when new events match this filter.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
                        >
                            <FiSave size={16} />
                            {isSubmitting ? "Saving..." : "Save Filter"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

"use client";

import React, { useState } from "react";
import { FiFilter, FiX, FiSearch, FiCalendar } from "react-icons/fi";

interface PrescriptionFiltersProps {
    onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
    search: string;
    dateFrom?: string;
    dateTo?: string;
    priority?: "all" | "normal" | "urgent";
    sortBy: "newest" | "oldest" | "patient";
}

export default function PrescriptionFilters({ onFilterChange }: PrescriptionFiltersProps) {
    const [filters, setFilters] = useState<FilterState>({
        search: "",
        sortBy: "newest",
        priority: "all"
    });

    const [showAdvanced, setShowAdvanced] = useState(false);

    const updateFilters = (updates: Partial<FilterState>) => {
        const newFilters = { ...filters, ...updates };
        setFilters(newFilters);
        onFilterChange?.(newFilters);
    };

    const clearFilters = () => {
        const defaultFilters: FilterState = {
            search: "",
            sortBy: "newest",
            priority: "all"
        };
        setFilters(defaultFilters);
        onFilterChange?.(defaultFilters);
    };

    const hasActiveFilters = filters.search || filters.dateFrom || filters.dateTo || filters.priority !== "all";

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            {/* Main Search Bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Rx ID, patient name, or doctor..."
                        value={filters.search}
                        onChange={(e) => updateFilters({ search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${showAdvanced
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    <FiFilter className="h-4 w-4" />
                    Filters
                </button>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <FiX className="h-4 w-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Date From */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            From Date
                        </label>
                        <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={filters.dateFrom || ""}
                                onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            To Date
                        </label>
                        <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={filters.dateTo || ""}
                                onChange={(e) => updateFilters({ dateTo: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Priority
                        </label>
                        <select
                            value={filters.priority}
                            onChange={(e) => updateFilters({ priority: e.target.value as FilterState["priority"] })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Priorities</option>
                            <option value="urgent">Urgent Only</option>
                            <option value="normal">Normal Only</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Sort Options */}
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Sort by:</span>
                    <div className="flex gap-1">
                        {[
                            { value: "newest", label: "Newest" },
                            { value: "oldest", label: "Oldest" },
                            { value: "patient", label: "Patient A-Z" }
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => updateFilters({ sortBy: option.value as FilterState["sortBy"] })}
                                className={`px-3 py-1 rounded-md font-medium transition-colors ${filters.sortBy === option.value
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

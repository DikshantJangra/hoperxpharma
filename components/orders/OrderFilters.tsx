'use client';

import React, { useState } from 'react';
import { FiSearch, FiCalendar, FiFilter } from 'react-icons/fi';

interface OrderFiltersProps {
    onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
    search: string;
    status: string;
    supplier: string;
    dateFrom: string;
    dateTo: string;
}

export default function OrderFilters({ onFilterChange }: OrderFiltersProps) {
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        status: 'all',
        supplier: 'all',
        dateFrom: '',
        dateTo: ''
    });

    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by PO number, supplier..."
                        value={filters.search}
                        onChange={(e) => handleChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={filters.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                {/* Advanced Filters Toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <FiFilter size={18} />
                    {showAdvanced ? 'Hide' : 'More'} Filters
                </button>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier
                        </label>
                        <select
                            value={filters.supplier}
                            onChange={(e) => handleChange('supplier', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        >
                            <option value="all">All Suppliers</option>
                            <option value="abc-pharma">ABC Pharma Distributors</option>
                            <option value="medicore">MediCore Supplies</option>
                            <option value="healthplus">HealthPlus Distributors</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FiCalendar className="inline mr-1" size={14} />
                            Date From
                        </label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleChange('dateFrom', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FiCalendar className="inline mr-1" size={14} />
                            Date To
                        </label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleChange('dateTo', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

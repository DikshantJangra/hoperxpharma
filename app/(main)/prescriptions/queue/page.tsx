'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiRefreshCw, FiPlus } from 'react-icons/fi';
import QueueBoard from './components/QueueBoard';
import { prescriptionApi } from '@/lib/api/prescriptions';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';

export default function PrescriptionQueuePage() {
    const { isPremium } = usePremiumTheme();
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        priority: '',
        isControlled: '',
        dateRange: 'today'
    });

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const response = await prescriptionApi.getQueue({
                search,
                ...filters
            });
            if (response.success) {
                setPrescriptions(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch queue:', error);
            toast.error('Failed to load prescription queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timeout = setTimeout(() => {
            fetchQueue();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, filters]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className={`flex flex-col h-screen transition-colors ${isPremium ? 'bg-slate-50' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className={`px-6 py-3 flex items-center justify-between z-20 transition-all ${isPremium
                ? 'bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm'
                : 'bg-white border-b border-gray-200 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">Workbench</h1>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <Link
                            href="/prescriptions"
                            className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md transition-colors"
                        >
                            List
                        </Link>
                        <span className="px-3 py-1 text-sm font-medium bg-white text-teal-700 shadow rounded-md">
                            Kanban
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/prescriptions" // Using the list view for creating new for now
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <FiPlus className="w-4 h-4" />
                        New Prescription
                    </Link>
                </div>
            </div>

            {/* Toolbar */}
            <div className={`px-6 py-2 flex items-center gap-4 z-10 border-b transition-all ${isPremium
                ? 'bg-white/60 backdrop-blur-md border-white/20'
                : 'bg-white border-gray-200'}`}>
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Patient, Rx#, or Phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    />
                </div>

                <div className="h-6 w-px bg-gray-200"></div>

                <div className="flex items-center gap-2">
                    <select
                        value={filters.dateRange}
                        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                        className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="">All Time</option>
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">All Priorities</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Normal">Normal</option>
                    </select>

                    <select
                        value={filters.isControlled}
                        onChange={(e) => handleFilterChange('isControlled', e.target.value)}
                        className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">All Drugs</option>
                        <option value="true">Controlled Only</option>
                        <option value="false">Non-Controlled</option>
                    </select>
                </div>

                <div className="ml-auto">
                    <button
                        onClick={fetchQueue}
                        className="p-2 text-gray-500 hover:text-teal-600 transition-colors rounded-lg hover:bg-gray-50"
                        title="Refresh Queue"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-hidden p-0">
                {loading && prescriptions.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="flex flex-col items-center">
                            <FiRefreshCw className="w-8 h-8 animate-spin mb-2 text-teal-600" />
                            <p>Loading workbench...</p>
                        </div>
                    </div>
                ) : (
                    <QueueBoard prescriptions={prescriptions} onRefresh={fetchQueue} />
                )}
            </div>
        </div>
    );
}

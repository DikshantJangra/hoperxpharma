'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiSearch, FiFilter, FiDownload, FiDollarSign, FiClock, FiChevronLeft, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import { patientsApi } from '@/lib/api/patients';
import CustomerLedgerPanel from '@/components/customers/CustomerLedgerPanel';

export default function CreditDashboard() {
    const [debtors, setDebtors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOutstanding: 0,
        totalDebtors: 0,
        averageDebt: 0
    });

    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('balance_desc'); // balance_desc, balance_asc, name_asc
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Selected Customer for Ledger
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch Data
    const fetchDebtors = async () => {
        try {
            setLoading(true);
            const response = await patientsApi.getDebtors({
                page,
                limit: 10,
                search: debouncedSearch,
                sort: sortBy
            });

            if (response && response.data) {
                setDebtors(response.data);

                // Update stats from meta if available
                if (response.meta) {
                    setTotalPages(response.meta.pagination?.totalPages || 1);
                    setStats({
                        totalOutstanding: Number(response.meta.totalOutstanding || 0),
                        totalDebtors: Number(response.meta.totalDebtors || 0),
                        averageDebt: Number(response.meta.totalDebtors) > 0
                            ? Number(response.meta.totalOutstanding) / Number(response.meta.totalDebtors)
                            : 0
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching debtors:', error);
            toast.error('Failed to load credit data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDebtors();
    }, [page, debouncedSearch, sortBy]);

    // Handle successful payment in modal
    const handleBalanceUpdate = (newBalance: number) => {
        // If balance becomes 0, we might want to remove them from list or just update locally
        // For a dashboard, updating locally is better UX than row disappearing suddenly
        setDebtors(prev => prev.map(d =>
            d.id === selectedCustomer?.id ? { ...d, currentBalance: newBalance } : d
        ));

        // Also refresh stats globally? Minimal impact, but good for accuracy
        fetchDebtors();
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
                        <h3 className="text-2xl font-bold text-red-600 mt-1">₹{stats.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                        <FiDollarSign className="w-6 h-6 text-red-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Debtors</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDebtors}</h3>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <FiAlertCircle className="w-6 h-6 text-orange-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Average Debt</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{stats.averageDebt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <FiClock className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
                    <div className="relative w-full md:w-96">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            >
                                <option value="balance_desc">Highest Debt First</option>
                                <option value="balance_asc">Lowest Debt First</option>
                                <option value="name_asc">Name (A-Z)</option>
                                <option value="updated_desc">Recently Updated</option>
                            </select>
                            <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-3 h-3" />
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
                            <FiDownload className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Last Activity</th>
                                <th className="px-6 py-4 text-right">Credit Limit</th>
                                <th className="px-6 py-4 text-right">Balance Due</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                // Skeleton Loader
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-24 mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : debtors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <div className="bg-gray-100 p-4 rounded-full mb-3">
                                                <FiDollarSign className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-lg font-medium text-gray-900">No debtors found</p>
                                            <p className="text-sm text-gray-500 mt-1">Great! All accounts are settled or no match found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                debtors.map((debtor) => (
                                    <tr key={debtor.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{debtor.firstName} {debtor.lastName}</div>
                                            <div className="text-xs text-gray-500">ID: ...{debtor.id.slice(-6)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">{debtor.phoneNumber}</div>
                                            <div className="text-xs text-gray-500">{debtor.email || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {debtor.sales?.[0]?.createdAt
                                                ? new Date(debtor.sales[0].createdAt).toLocaleDateString()
                                                : (debtor.updatedAt ? new Date(debtor.updatedAt).toLocaleDateString() : '-')}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600 font-mono">
                                            {Number(debtor.creditLimit) > 0 ? `₹${Number(debtor.creditLimit).toLocaleString()}` : <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">No Limit</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
                                                ₹{Number(debtor.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedCustomer(debtor)}
                                                className="text-teal-600 hover:text-teal-700 font-medium text-sm hover:underline px-3 py-1.5 rounded hover:bg-teal-50 transition-colors"
                                            >
                                                View & Settle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
                    <span className="text-sm text-gray-600">
                        Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1 || loading}
                            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-white shadow-sm transition-all"
                        >
                            <FiChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages || loading}
                            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-white shadow-sm transition-all"
                        >
                            <FiChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Ledger Panel */}
            {selectedCustomer && (
                <CustomerLedgerPanel
                    isOpen={!!selectedCustomer}
                    customerId={selectedCustomer.id}
                    onClose={() => setSelectedCustomer(null)}
                    onBalanceUpdate={handleBalanceUpdate}
                />
            )}
        </div>
    );
}

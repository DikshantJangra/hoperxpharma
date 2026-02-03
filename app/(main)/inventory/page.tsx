'use client';

import { useState, useEffect } from 'react';
import { FiRefreshCw, FiArrowLeft, FiPlus, FiCamera, FiUpload, FiEdit, FiAlertCircle } from 'react-icons/fi';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function InventoryPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const filter = searchParams?.get('filter');

    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Redirect base /inventory to /inventory/stock (preserve filtered views for dashboard alerts)
    useEffect(() => {
        if (!filter) {
            router.replace('/inventory/stock');
        }
    }, [filter, router]);

    // If no filter and redirecting, show loading state
    if (!filter) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="text-gray-500">Redirecting...</div>
            </div>
        );
    }
    const [showAddModal, setShowAddModal] = useState(false);

    const getTitle = () => {
        switch (filter) {
            case 'low_stock': return 'Critical Stock Alerts';
            case 'expiring': return 'Expiring Items';
            default: return 'Inventory Management';
        }
    };

    const getDescription = () => {
        switch (filter) {
            case 'low_stock': return 'Items currently below reorder threshold';
            case 'expiring': return 'Batches expiring within the next 90 days';
            default: return 'Manage your pharmacy inventory, stock levels, and batch tracking';
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { inventoryApi } = await import('@/lib/api/inventory');

            let data: any[] = [];

            if (filter === 'low_stock') {
                const response = await inventoryApi.getLowStockAlerts();
                data = Array.isArray(response) ? response : (response.data || []);
            } else if (filter === 'expiring') {
                const response = await inventoryApi.getExpiringItems();
                data = Array.isArray(response) ? response : (response.data || []);
            } else {
                // Default view
                const response = await inventoryApi.getDrugs({
                    page: 1,
                    limit: 100,
                    search: searchQuery,
                });
                data = Array.isArray(response) ? response : (response.data || []);
            }

            console.log(`📦 Inventory Data (${filter || 'all'}):`, data);
            setItems(data);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter, searchQuery]); // Re-fetch when filter changes

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [filter, searchQuery]);

    const renderTableHeaders = () => {
        if (filter === 'low_stock') {
            return (
                <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Drug Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Current Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Threshold</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Status</th>
                </tr>
            );
        }
        if (filter === 'expiring') {
            return (
                <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Drug Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Batch Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Expiry Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Days Left</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Stock</th>
                </tr>
            );
        }
        return (
            <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Drug Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Strength</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Form</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Manufacturer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">GST Rate</th>
            </tr>
        );
    };

    const renderTableRows = () => {
        if (items.length === 0) {
            return (
                <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#64748b]">
                        No items found {filter ? `for ${filter} filter` : ''}
                    </td>
                </tr>
            );
        }

        if (filter === 'low_stock') {
            return items.map((item: any) => (
                <tr key={item.drugId} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                    <td className="px-4 py-3 text-sm font-medium text-[#0f172a]">{item.name}</td>
                    <td className="px-4 py-3 text-sm font-bold text-red-600">{item.totalStock}</td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{item.lowStockThreshold || 10}</td>
                    <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Critical
                        </span>
                    </td>
                </tr>
            ));
        }

        if (filter === 'expiring') {
            return items.map((item: any) => {
                const expiryDate = new Date(item.expiryDate);
                const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                return (
                    <tr key={item.id} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                        <td className="px-4 py-3 text-sm font-medium text-[#0f172a]">{item.drug?.name || 'Unknown Drug'}</td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">{item.batchNumber}</td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">{format(expiryDate, 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3 text-sm font-bold text-amber-600">{daysLeft} days</td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">{Number(item.baseUnitQuantity)}</td>
                    </tr>
                );
            });
        }

        // Default render
        return items.map((drug: any) => {
            const isPending = drug.ingestionStatus === 'SALT_PENDING' || drug.ingestionStatus === 'DRAFT';

            return (
                <tr
                    key={drug.id}
                    className={`border-b border-[#e2e8f0] hover:bg-[#f8fafc] ${isPending ? 'bg-orange-50' : ''}`}
                >
                    <td className="px-4 py-3 text-sm text-[#0f172a]">
                        <div className="flex items-center gap-2">
                            {drug.name}
                            {isPending && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                    <FiAlertCircle className="w-3 h-3 mr-1" />
                                    Needs Review
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{drug.strength || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{drug.form || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{drug.manufacturer || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                        {isPending ? (
                            <button
                                onClick={() => router.push('/inventory/maintenance')}
                                className="text-xs text-[#0ea5a3] hover:underline font-medium"
                            >
                                Fix Now →
                            </button>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b]">{drug.gstRate}%</td>
                </tr>
            );
        });
    };

    return (
        <div className="p-6">
            {/* Add Medicine Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-[#0f172a]">Add New Medicine</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mb-6">
                                Choose how you'd like to add a new medicine to your inventory
                            </p>

                            <div className="space-y-3">
                                {/* Scan Strip Option */}
                                <button
                                    onClick={() => router.push('/inventory/ingest')}
                                    className="w-full p-4 border-2 border-[#0ea5a3] rounded-lg hover:bg-[#f0fdfa] transition-colors text-left group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-[#0ea5a3] rounded-lg text-white group-hover:scale-110 transition-transform">
                                            <FiCamera size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-[#0f172a] mb-1">
                                                Scan Medicine Strip
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Upload or capture strip image. OCR will extract composition automatically.
                                            </p>
                                            <span className="inline-block mt-2 text-xs font-medium text-[#0ea5a3]">
                                                ⚡ Fastest • Recommended
                                            </span>
                                        </div>
                                    </div>
                                </button>

                                {/* Manual Entry Option */}
                                <button
                                    onClick={() => router.push('/inventory/ingest?mode=manual')}
                                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:scale-110 transition-transform">
                                            <FiEdit size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-[#0f172a] mb-1">
                                                Manual Entry
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Enter medicine details manually without scanning.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {/* Bulk Import Option */}
                                <button
                                    onClick={() => router.push('/inventory/import')}
                                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:scale-110 transition-transform">
                                            <FiUpload size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-[#0f172a] mb-1">
                                                Bulk Import
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Import multiple medicines from CSV or Excel file.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        {filter && (
                            <button
                                onClick={() => router.push('/inventory')}
                                className="mr-2 p-1 hover:bg-gray-100 rounded-full text-gray-500"
                            >
                                <FiArrowLeft size={20} />
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-[#0f172a]">{getTitle()}</h1>
                    </div>
                    <p className="text-[#6b7280] mt-2">{getDescription()}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9491] flex items-center gap-2 text-sm font-medium shadow-sm"
                    >
                        <FiPlus className="w-4 h-4" />
                        Add Medicine
                    </button>
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Quick Actions - Only show on main inventory view */}
            {!filter && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <button
                            onClick={() => router.push('/inventory/ingest')}
                            className="p-4 bg-gradient-to-br from-[#0ea5a3] to-[#0d9491] text-white rounded-lg hover:shadow-lg transition-all text-left group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <FiCamera size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">Quick</span>
                            </div>
                            <h3 className="font-semibold mb-1">Scan Medicine Strip</h3>
                            <p className="text-sm text-white text-opacity-90">
                                Upload strip image for instant OCR extraction
                            </p>
                        </button>

                        <button
                            onClick={() => router.push('/inventory/maintenance')}
                            className="p-4 bg-white border-2 border-orange-200 rounded-lg hover:shadow-lg transition-all text-left group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <FiAlertCircle size={24} className="text-orange-500 group-hover:scale-110 transition-transform" />
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Action Needed</span>
                            </div>
                            <h3 className="font-semibold text-[#0f172a] mb-1">Fix Pending Medicines</h3>
                            <p className="text-sm text-gray-600">
                                Review and correct salt mappings
                            </p>
                        </button>

                        <button
                            onClick={() => router.push('/inventory/batches')}
                            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:shadow-lg transition-all text-left group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <FiEdit size={24} className="text-gray-600 group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="font-semibold text-[#0f172a] mb-1">Manage Batches</h3>
                            <p className="text-sm text-gray-600">
                                Track expiry dates and stock levels
                            </p>
                        </button>
                    </div>

                    {/* Floating Action Button for mobile */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="fixed bottom-6 right-6 w-14 h-14 bg-[#0ea5a3] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#0d9491] hover:scale-110 transition-all z-50"
                        >
                            <FiPlus size={24} />
                        </button>
                    </div>
                </>
            )}

            {!filter && (
                <div className="mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search drugs..."
                        className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                    />
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0]">
                {isLoading ? (
                    <div className="p-8 text-center text-[#64748b]">Loading data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                {renderTableHeaders()}
                            </thead>
                            <tbody>
                                {renderTableRows()}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

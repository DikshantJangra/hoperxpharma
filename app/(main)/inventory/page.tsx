'use client';

import { useState, useEffect } from 'react';
import { FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function InventoryPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const filter = searchParams?.get('filter');

    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
                        <td className="px-4 py-3 text-sm text-[#64748b]">{item.quantityInStock}</td>
                    </tr>
                );
            });
        }

        // Default render
        return items.map((drug: any) => (
            <tr key={drug.id} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                <td className="px-4 py-3 text-sm text-[#0f172a]">{drug.name}</td>
                <td className="px-4 py-3 text-sm text-[#64748b]">{drug.strength || '-'}</td>
                <td className="px-4 py-3 text-sm text-[#64748b]">{drug.form || '-'}</td>
                <td className="px-4 py-3 text-sm text-[#64748b]">{drug.manufacturer || '-'}</td>
                <td className="px-4 py-3 text-sm text-[#64748b]">{drug.gstRate}%</td>
            </tr>
        ));
    };

    return (
        <div className="p-6">
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
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm disabled:opacity-50"
                >
                    <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

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

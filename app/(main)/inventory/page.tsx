'use client';

import { useState, useEffect } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

export default function InventoryPage() {
    const [drugs, setDrugs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDrugs = async () => {
        setIsLoading(true);
        try {
            const { inventoryApi } = await import('@/lib/api/inventory');
            const response = await inventoryApi.getDrugs({
                page: 1,
                limit: 100,
                search: searchQuery,
            });

            console.log('💊 Drugs API Response:', response);
            
            // Handle both response formats
            const drugsData = Array.isArray(response) ? response : (response.data || []);
            console.log('💊 Drugs Data:', drugsData);
            console.log('💊 Number of drugs:', drugsData.length);

            setDrugs(drugsData);
        } catch (error) {
            console.error('Failed to fetch drugs:', error);
            setDrugs([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchDrugs, searchQuery ? 300 : 0);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchDrugs, 30000);
        return () => clearInterval(interval);
    }, [searchQuery]);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a]">Inventory Management</h1>
                    <p className="text-[#6b7280] mt-2">Manage your pharmacy inventory, stock levels, and batch tracking.</p>
                </div>
                <button
                    onClick={fetchDrugs}
                    disabled={isLoading}
                    className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm disabled:opacity-50"
                >
                    <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search drugs..."
                    className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0]">
                {isLoading ? (
                    <div className="p-8 text-center text-[#64748b]">Loading inventory...</div>
                ) : drugs.length === 0 ? (
                    <div className="p-8 text-center text-[#64748b]">No drugs found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Drug Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Strength</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Form</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">Manufacturer</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f172a]">GST Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drugs.map((drug: any) => (
                                    <tr key={drug.id} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                                        <td className="px-4 py-3 text-sm text-[#0f172a]">{drug.name}</td>
                                        <td className="px-4 py-3 text-sm text-[#64748b]">{drug.strength || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-[#64748b]">{drug.form || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-[#64748b]">{drug.manufacturer || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-[#64748b]">{drug.gstRate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

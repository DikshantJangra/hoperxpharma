'use client';

import { useState, useEffect } from 'react';
import { FiCalendar, FiFilter, FiCheck, FiFileText } from 'react-icons/fi';
import { consolidatedInvoicesApi, type GRNForInvoicing } from '@/lib/api/consolidatedInvoices';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CreateInvoiceTab() {
    const router = useRouter();
    const [grns, setGrns] = useState<GRNForInvoicing[]>([]);
    const [selectedGRNs, setSelectedGRNs] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Filters
    const [dateRange, setDateRange] = useState('month');
    const [supplierId, setSupplierId] = useState('');
    const [status, setStatus] = useState<'all' | 'not_invoiced'>('not_invoiced');

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchGRNs();
    }, [dateRange, supplierId, status]);

    const fetchGRNs = async () => {
        setLoading(true);
        setError(null);
        try {
            const { startDate, endDate } = getDateRange(dateRange);
            const response = await consolidatedInvoicesApi.getGRNsForInvoicing({
                startDate,
                endDate,
                supplierId: supplierId || undefined,
                status,
            });

            if (response.success) {
                setGrns(response.data || []);
            }
        } catch (error: any) {
            console.error('Failed to fetch GRNs:', error);
            setError(error.message || 'Failed to load GRNs');

            if (error.status === 401) {
                toast.error('Session expired. Please log in again.');
            } else {
                toast.error(error.message || 'Failed to load GRNs');
            }
        } finally {
            setLoading(false);
        }
    };

    const getDateRange = (range: string) => {
        const now = new Date();
        let startDate: Date;

        switch (range) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0]
        };
    };

    const toggleGRN = (grnId: string) => {
        const newSelected = new Set(selectedGRNs);
        if (newSelected.has(grnId)) {
            newSelected.delete(grnId);
        } else {
            newSelected.add(grnId);
        }
        setSelectedGRNs(newSelected);
    };

    const selectAll = () => {
        if (selectedGRNs.size === grns.length) {
            setSelectedGRNs(new Set());
        } else {
            setSelectedGRNs(new Set(grns.map(grn => grn.id)));
        }
    };

    const selectedTotal = grns
        .filter(grn => selectedGRNs.has(grn.id))
        .reduce((sum, grn) => sum + Number(grn.total), 0);

    const uniqueSuppliers = new Set(
        grns
            .filter(grn => selectedGRNs.has(grn.id))
            .map(grn => grn.supplier.name)
    );

    const handleCreateInvoice = async () => {
        if (selectedGRNs.size === 0) return;

        setCreating(true);
        try {
            const response = await consolidatedInvoicesApi.createInvoice({
                grnIds: Array.from(selectedGRNs)
            });

            if (response.success) {
                toast.success('Invoice created successfully!');
                router.push(`/orders/invoices/${response.data.id}`);
            }
        } catch (error: any) {
            console.error('Failed to create invoice:', error);
            toast.error(error.message || 'Failed to create invoice');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="flex h-full">
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-500">Loading GRNs...</div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="text-lg font-semibold text-gray-700 mb-2">
                            Failed to load GRNs
                        </div>
                        <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                            {error}
                        </p>
                        <button
                            onClick={fetchGRNs}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                        >
                            Retry
                        </button>
                    </div>
                ) : grns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <FiFileText className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            No GRNs Available
                        </h3>
                        <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                            {status === 'not_invoiced'
                                ? "All GRNs have been invoiced or no completed GRNs exist yet."
                                : "No GRNs found for the selected filters."}
                        </p>
                        <button
                            onClick={() => router.push('/orders/received')}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                        >
                            View Received Orders
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedGRNs.size === grns.length && grns.length > 0}
                                        onChange={selectAll}
                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">GRN #</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice #</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Items</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {grns.map((grn) => (
                                <tr
                                    key={grn.id}
                                    onClick={() => toggleGRN(grn.id)}
                                    className={`cursor-pointer hover:bg-gray-50 ${selectedGRNs.has(grn.id) ? 'bg-emerald-50' : ''}`}
                                >
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedGRNs.has(grn.id)}
                                            onChange={() => toggleGRN(grn.id)}
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{grn.grnNumber}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(grn.receivedDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{grn.supplier.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{grn.supplierInvoiceNo || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{grn.itemsCount}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                        ₹{Number(grn.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {grn.isInvoiced ? (
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                                Invoiced
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="w-96 bg-gray-50 border-l border-gray-200 p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selection Summary</h3>

                <div className="space-y-4 flex-1">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Selected GRNs</div>
                        <div className="text-2xl font-bold text-gray-900">{selectedGRNs.size}</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Total Value</div>
                        <div className="text-2xl font-bold text-emerald-600">
                            ₹{selectedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    {uniqueSuppliers.size > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="text-sm text-gray-600 mb-2">Suppliers</div>
                            <div className="space-y-1">
                                {Array.from(uniqueSuppliers).map((supplier) => (
                                    <div key={supplier} className="text-sm text-gray-900">
                                        • {supplier}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleCreateInvoice}
                    disabled={selectedGRNs.size === 0 || creating}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {creating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <FiCheck className="w-4 h-4" />
                            Create Invoice
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
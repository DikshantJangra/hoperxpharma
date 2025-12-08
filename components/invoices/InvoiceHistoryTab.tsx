'use client';

import { useState, useEffect } from 'react';
import { FiDownload, FiPrinter, FiEye, FiTrash2, FiSearch } from 'react-icons/fi';
import { consolidatedInvoicesApi, type ConsolidatedInvoice } from '@/lib/api/consolidatedInvoices';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function InvoiceHistoryTab() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<ConsolidatedInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, [search, statusFilter]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await consolidatedInvoicesApi.listInvoices({
                search: search || undefined,
                status: statusFilter || undefined,
            });

            if (response.success) {
                setInvoices(response.data || []);
            }
        } catch (error: any) {
            console.error('Failed to fetch invoices:', error);

            if (error.status === 401) {
                toast.error('Session expired. Please log in again.');
                router.push('/login');
            } else {
                toast.error(error.message || 'Failed to load invoices');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleView = (invoice: ConsolidatedInvoice) => {
        router.push(`/orders/invoices/${invoice.id}`);
    };

    const handleDelete = async (invoice: ConsolidatedInvoice) => {
        if (!confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;

        try {
            await consolidatedInvoicesApi.deleteInvoice(invoice.id);
            toast.success('Invoice deleted successfully');
            fetchInvoices();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete invoice');
        }
    };

    const handleDownload = async (invoice: ConsolidatedInvoice) => {
        try {
            // Navigate to detail page which has PDF download
            router.push(`/orders/invoices/${invoice.id}`);
        } catch (error: any) {
            toast.error('Failed to download invoice');
        }
    };

    const handlePrint = (invoice: ConsolidatedInvoice) => {
        // Navigate to detail page and trigger print
        router.push(`/orders/invoices/${invoice.id}?print=true`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return 'bg-gray-100 text-gray-700';
            case 'FINALIZED':
                return 'bg-blue-100 text-blue-700';
            case 'SENT':
                return 'bg-green-100 text-green-700';
            case 'ARCHIVED':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search invoices..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="FINALIZED">Finalized</option>
                        <option value="SENT">Sent</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>
            </div>

            {/* Invoice List */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-500">Loading invoices...</div>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <FiSearch className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            No Invoices Found
                        </h3>
                        <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                            {search || statusFilter
                                ? "No invoices match your search criteria."
                                : "Create your first invoice from the Create Invoice tab."}
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice #</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier(s)</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">GRNs</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Items</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {invoice.invoiceNumber}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {invoice.supplier?.name || 'Multiple Suppliers'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                        {invoice.grnsCount || 0}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                        {invoice.itemsCount || 0}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                        ₹{Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleView(invoice)}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                                title="View"
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(invoice)}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                                title="Download PDF"
                                            >
                                                <FiDownload className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handlePrint(invoice)}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                                title="Print"
                                            >
                                                <FiPrinter className="w-4 h-4" />
                                            </button>
                                            {invoice.status === 'DRAFT' && (
                                                <button
                                                    onClick={() => handleDelete(invoice)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

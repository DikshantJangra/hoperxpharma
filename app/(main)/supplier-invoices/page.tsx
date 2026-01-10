'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supplierInvoiceApi, SupplierInvoice } from '@/lib/api/supplierInvoices';
import {
    HiOutlinePlus,
    HiOutlineDocumentText,
    HiOutlineCurrencyRupee,
    HiOutlineCheckCircle,
    HiOutlineClock
} from 'react-icons/hi2';

export default function SupplierInvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        status: 'all',
        search: ''
    });

    useEffect(() => {
        fetchInvoices();
    }, [filter.status]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params: any = {};

            if (filter.status !== 'all') {
                params.status = filter.status.toUpperCase();
            }

            const result = await supplierInvoiceApi.getInvoices(params);
            setInvoices(result.data || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats
    const stats = {
        draft: invoices.filter(i => i.status === 'DRAFT').length,
        confirmed: invoices.filter(i => i.status === 'CONFIRMED' || i.status === 'FINALIZED').length,
        paid: invoices.filter(i => i.paymentStatus === 'PAID').length,
        overdue: invoices.filter(i => i.paymentStatus === 'OVERDUE').length,
        totalValue: invoices.reduce((sum, i) => sum + Number(i.total), 0)
    };

    const getStatusBadge = (invoice: SupplierInvoice) => {
        const paymentStatus = invoice.paymentStatus;
        const status = invoice.status;

        if (paymentStatus === 'PAID') {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Paid</span>;
        }
        if (paymentStatus === 'PARTIALLY_PAID') {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Partially Paid</span>;
        }
        if (status === 'DRAFT') {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Draft</span>;
        }
        if (status === 'CONFIRMED' || status === 'FINALIZED') {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Confirmed</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">{status}</span>;
    };

    const filteredInvoices = invoices.filter(invoice => {
        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            return (
                invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
                invoice.supplier?.name?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Supplier Invoices</h1>
                        <p className="text-slate-600">Manage monthly supplier settlements and payments</p>
                    </div>
                    <button
                        onClick={() => router.push('/supplier-invoices/new')}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 font-medium"
                    >
                        <HiOutlinePlus className="h-5 w-5" />
                        New Invoice
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-gray-100 rounded-xl">
                            <HiOutlineDocumentText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-600">Draft</div>
                            <div className="text-2xl font-bold text-slate-900">{stats.draft}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-amber-100 rounded-xl">
                            <HiOutlineClock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-600">Confirmed</div>
                            <div className="text-2xl font-bold text-slate-900">{stats.confirmed}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-green-100 rounded-xl">
                            <HiOutlineCheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-600">Paid</div>
                            <div className="text-2xl font-bold text-slate-900">{stats.paid}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-red-100 rounded-xl">
                            <HiOutlineClock className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-600">Overdue</div>
                            <div className="text-2xl font-bold text-slate-900">{stats.overdue}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 shadow-lg shadow-emerald-500/30 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-white/20 rounded-xl">
                            <HiOutlineCurrencyRupee className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-emerald-100 text-sm">Total Value</div>
                            <div className="text-2xl font-bold">₹{(stats.totalValue / 100000).toFixed(1)}L</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60">
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex gap-2">
                            {['all', 'draft', 'confirmed', 'paid'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter({ ...filter, status })}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter.status === status
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            className="flex-1 min-w-[200px] px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading invoices...</div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="p-12 text-center">
                            <HiOutlineDocumentText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">No invoices found</p>
                            <button
                                onClick={() => router.push('/supplier-invoices/new')}
                                className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Create your first invoice
                            </button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Invoice #</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Period</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Paid</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-slate-900">{invoice.invoiceNumber}</div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(invoice.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900">{invoice.supplier?.name || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                                            ₹{Number(invoice.total).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            ₹{Number(invoice.paidAmount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(invoice)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => router.push(`/supplier-invoices/${invoice.id}`)}
                                                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

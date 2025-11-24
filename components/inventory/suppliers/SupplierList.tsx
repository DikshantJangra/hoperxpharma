'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiPhone, FiTrash2, FiEye, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

const SupplierRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div><div className="h-3 bg-gray-100 rounded w-24 mt-1"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-md w-24 ml-auto"></div></td>
    </tr>
)

interface SupplierListProps {
    onAddClick?: () => void;
    onRefresh?: number;
}

export default function SupplierList({ onAddClick, onRefresh }: SupplierListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetchSuppliers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { supplierApi } = await import('@/lib/api/supplier');
            const response = await supplierApi.getSuppliers({
                page,
                limit,
                search: searchTerm || undefined,
            });

            if (response.success) {
                setSuppliers(response.data || []);
                setTotal(response.pagination?.total || 0);
            }
        } catch (err: any) {
            console.error('Failed to fetch suppliers:', err);
            setError(err.message || 'Failed to load suppliers');
            setSuppliers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [page, onRefresh]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) {
                fetchSuppliers();
            } else {
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;

        try {
            const { supplierApi } = await import('@/lib/api/supplier');
            await supplierApi.deleteSupplier(id);
            fetchSuppliers();
        } catch (err: any) {
            alert(err.message || 'Failed to delete supplier');
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header & Filters */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search suppliers by name, contact, GST..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddClick}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                        disabled={isLoading}
                    >
                        <FiPlus />
                        <span>Add Supplier</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-700">
                    <FiAlertCircle />
                    <span>{error}</span>
                    <button onClick={fetchSuppliers} className="ml-auto text-sm underline">Retry</button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Supplier Name</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Contact</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <>
                                <SupplierRowSkeleton />
                                <SupplierRowSkeleton />
                                <SupplierRowSkeleton />
                            </>
                        ) : suppliers.length > 0 ? (
                            suppliers.map((supplier) => (
                                <tr key={supplier.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{supplier.name}</div>
                                        {supplier.gstin && <div className="text-xs text-gray-500">GST: {supplier.gstin}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            {supplier.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-gray-900">{supplier.contactName}</div>
                                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                <span>{supplier.phoneNumber}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${supplier.status === 'Active'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                            {supplier.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={`tel:${supplier.phoneNumber}`} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded">
                                                <FiPhone size={16} />
                                            </a>
                                            <Link href={`/inventory/suppliers/${supplier.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                                <FiEye size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(supplier.id, supplier.name)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                    {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers yet. Click "Add Supplier" to get started.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                {isLoading ? (
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                ) : (
                    <span>Showing {suppliers.length} of {total} suppliers</span>
                )}
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={page === 1 || isLoading}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1">Page {page} of {totalPages || 1}</span>
                    <button
                        className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={page >= totalPages || isLoading}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

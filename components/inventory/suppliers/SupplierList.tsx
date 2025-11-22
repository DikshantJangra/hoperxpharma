'use client';

import React, { useState, useEffect } from 'react';
import { Supplier, SupplierFilter } from '@/types/supplier';
import { FiSearch, FiFilter, FiPlus, FiMoreVertical, FiPhone, FiMail, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import Link from 'next/link';

const SupplierRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div><div className="h-3 bg-gray-100 rounded w-24 mt-1"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-12 mx-auto"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-md w-24 ml-auto"></div></td>
    </tr>
)

interface SupplierListProps {
    onAddClick?: () => void;
    isLoading: boolean;
}

export default function SupplierList({ onAddClick, isLoading }: SupplierListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<SupplierFilter>({});
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    useEffect(() => {
        if (!isLoading) {
            setSuppliers([]);
        }
    }, [isLoading])


    // Filter logic would go here
    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact.primaryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50" disabled={isLoading}>
                        <FiFilter />
                        <span>Filters</span>
                    </button>
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

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Supplier Name</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Contact</th>
                            <th className="px-6 py-3 text-right">Outstanding</th>
                            <th className="px-6 py-3 text-center">Rating</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <>
                               <SupplierRowSkeleton/>
                               <SupplierRowSkeleton/>
                               <SupplierRowSkeleton/>
                            </>
                        ) : filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map((supplier) => (
                                <tr key={supplier.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{supplier.name}</div>
                                        <div className="text-xs text-gray-500">GST: {supplier.gstin}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            {supplier.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-gray-900">{supplier.contact.primaryName}</div>
                                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                <span>{supplier.contact.phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-xs text-gray-500 mb-1">Outstanding</div>
                                        <div className="font-semibold text-gray-900">₹{supplier.performance.outstandingBalance.toLocaleString('en-IN')}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-100">
                                            <span className="font-bold">{supplier.performance.rating}</span>
                                            <span className="text-xs">★</span>
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
                                            <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded">
                                                <FiPhone size={16} />
                                            </button>
                                            <Link href={`/inventory/suppliers/${supplier.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                                <FiEye size={16} />
                                            </Link>
                                            <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">No suppliers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Simple) */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                {isLoading ? <div className="h-4 bg-gray-200 rounded w-24"></div> : <span>Showing {filteredSuppliers.length} suppliers</span>}
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
                    <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
                </div>
            </div>
        </div>
    );
}

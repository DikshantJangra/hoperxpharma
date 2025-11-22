'use client';

import React, { useState, useEffect } from 'react';
import SupplierList from '@/components/inventory/suppliers/SupplierList';
import SupplierForm from '@/components/inventory/suppliers/SupplierForm';
import { FiUsers, FiAlertTriangle, FiDollarSign, FiCheckCircle } from 'react-icons/fi';

const StatCardSkeleton = () => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
        <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-7 bg-gray-300 rounded w-16"></div>
        </div>
    </div>
)

export default function SuppliersDashboardPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setStats({
                total: 0,
                outstanding: '₹0',
                expiringLicenses: 0,
                activeOrders: 0,
            });
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, []);

    const handleSaveSupplier = (data: any) => {
        console.log('Saving supplier:', data);
        setIsAddModalOpen(false);
        // Refresh list logic would go here
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header & Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Supplier Overview</h1>
                    <p className="text-gray-500">Manage relationships, performance, and compliance.</p>
                </div>
                <div className="flex gap-4">
                    {/* Stats could go here or be their own section */}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isLoading ? (
                    <>
                        <StatCardSkeleton/>
                        <StatCardSkeleton/>
                        <StatCardSkeleton/>
                        <StatCardSkeleton/>
                    </>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <FiUsers size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Total Suppliers</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.total}</div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                <FiDollarSign size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Outstanding</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.outstanding}</div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                                <FiAlertTriangle size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Expiring Licenses</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.expiringLicenses}</div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <FiCheckCircle size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Active Orders</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.activeOrders}</div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Main List */}
            <SupplierList onAddClick={() => setIsAddModalOpen(true)} isLoading={isLoading} />

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
                        <SupplierForm
                            onSave={handleSaveSupplier}
                            onCancel={() => setIsAddModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

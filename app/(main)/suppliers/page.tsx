'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SupplierList from '@/components/suppliers/SupplierList';
import SupplierForm from '@/components/suppliers/SupplierForm';
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
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchStats();
    }, [refreshKey]);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const { supplierApi } = await import('@/lib/api/supplier');
            const response = await supplierApi.getStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch supplier stats:', error);
            setStats({
                total: 0,
                active: 0,
                outstanding: 0,
                expiringLicenses: 0,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSupplier = async (data: any) => {
        try {
            const { supplierApi } = await import('@/lib/api/supplier');

            // Transform form data to match backend schema
            const supplierData = {
                name: data.name,
                category: data.category,
                status: 'Active',
                gstin: data.gstin,
                dlNumber: data.dlNumber,
                pan: data.pan,
                contactName: data.contactName,
                phoneNumber: data.phoneNumber,
                email: data.email,
                whatsapp: data.whatsapp,
                addressLine1: data.addressLine1,
                addressLine2: data.addressLine2,
                city: data.city,
                state: data.state,
                pinCode: data.pinCode,
                paymentTerms: data.paymentTerms,
                creditLimit: data.creditLimit,
            };

            await supplierApi.createSupplier(supplierData);
            setIsAddModalOpen(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        } catch (error: any) {
            alert(error.message || 'Failed to create supplier');
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header & Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Supplier Overview</h1>
                    <p className="text-gray-500">Manage relationships, performance, and compliance.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <FiUsers size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Total Suppliers</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                <FiDollarSign size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Outstanding</div>
                                <div className="text-2xl font-bold text-gray-900">₹{(stats?.outstanding || 0).toLocaleString('en-IN')}</div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                                <FiAlertTriangle size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Expiring Licenses</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.expiringLicenses || 0}</div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <FiCheckCircle size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Active Suppliers</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.active || 0}</div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Main List */}
            <SupplierList onAddClick={() => setIsAddModalOpen(true)} onRefresh={refreshKey} />

            {/* Add Modal */}
            {isAddModalOpen && typeof window !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
                        <SupplierForm
                            onSave={handleSaveSupplier}
                            onCancel={() => setIsAddModalOpen(false)}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

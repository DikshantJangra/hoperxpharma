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

import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';
import SupplierDrawer from '@/components/suppliers/SupplierDrawer';

export default function SuppliersDashboardPage() {
    const { isPremium } = usePremiumTheme();
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

    const handleSupplierSaved = () => {
        setRefreshKey(prev => prev + 1); // Trigger refresh
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header & Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Supplier Overview</h1>
                    <p className="text-gray-500">Manage relationships, powerformance, and compliance.</p>
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
                        {/* Total Suppliers */}
                        <div className={`p-4 rounded-xl border transition-all ${isPremium
                            ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                            : 'bg-white border-gray-200 shadow-sm'
                            } flex items-center gap-4`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPremium ? 'bg-blue-500/10 text-blue-600 ring-4 ring-blue-500/10' : 'bg-blue-50 text-blue-600'}`}>
                                <FiUsers size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Total Suppliers</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
                            </div>
                        </div>

                        {/* Outstanding */}
                        <div className={`p-4 rounded-xl border transition-all ${isPremium
                            ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                            : 'bg-white border-gray-200 shadow-sm'
                            } flex items-center gap-4`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPremium ? 'bg-red-500/10 text-red-600 ring-4 ring-red-500/10' : 'bg-red-50 text-red-600'}`}>
                                <FiDollarSign size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Outstanding</div>
                                <div className="text-2xl font-bold text-gray-900">₹{(stats?.outstanding || 0).toLocaleString('en-IN')}</div>
                            </div>
                        </div>

                        {/* Expiring Licenses */}
                        <div className={`p-4 rounded-xl border transition-all ${isPremium
                            ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                            : 'bg-white border-gray-200 shadow-sm'
                            } flex items-center gap-4`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPremium ? 'bg-amber-500/10 text-amber-600 ring-4 ring-amber-500/10' : 'bg-yellow-50 text-yellow-600'}`}>
                                <FiAlertTriangle size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Expiring Licenses</div>
                                <div className="text-2xl font-bold text-gray-900">{stats?.expiringLicenses || 0}</div>
                            </div>
                        </div>

                        {/* Active Suppliers */}
                        <div className={`p-4 rounded-xl border transition-all ${isPremium
                            ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                            : 'bg-white border-gray-200 shadow-sm'
                            } flex items-center gap-4`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPremium ? 'bg-emerald-500/10 text-emerald-600 ring-4 ring-emerald-500/10' : 'bg-emerald-50 text-emerald-600'}`}>
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

            {/* Add Drawer */}
            <SupplierDrawer
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleSupplierSaved}
            />
        </div >
    );
}

'use client';

import React, { useState } from 'react';
import { Supplier } from '@/types/supplier';
import { FiPhone, FiMail, FiMapPin, FiEdit2, FiClock, FiDollarSign, FiPackage, FiAlertCircle } from 'react-icons/fi';

// Mock Data for a single supplier (would come from API)
const MOCK_SUPPLIER: Supplier = {
    id: 'sup_1',
    name: 'MediCore Distributors',
    category: 'Distributor',
    status: 'Active',
    gstin: '27AABCU9603R1ZM',
    dlNumber: 'MH-MZ1-123456',
    contact: {
        primaryName: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        email: 'orders@medicore.com',
        address: {
            line1: '123, Pharma Park',
            line2: 'Andheri East',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
        }
    },
    paymentTerms: 'Net 30',
    creditLimit: 500000,
    licenses: [
        {
            id: 'lic_1',
            type: 'Drug License',
            number: 'MH-MZ1-123456',
            validFrom: '2020-01-01',
            validTo: '2025-01-01',
            status: 'Active'
        },
        {
            id: 'lic_2',
            type: 'GST Certificate',
            number: '27AABCU9603R1ZM',
            validFrom: '2018-07-01',
            validTo: '2099-12-31',
            status: 'Active'
        }
    ],
    performance: {
        rating: 4.5,
        onTimeDeliveryRate: 95,
        returnRate: 2,
        qualityScore: 9,
        totalOrders: 150,
        totalSpent: 500000,
        outstandingBalance: 25000
    },
    tags: ['Critical', 'Fast Moving'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
};

export default function SupplierProfile({ id }: { id: string }) {
    const [activeTab, setActiveTab] = useState('overview');
    const supplier = MOCK_SUPPLIER; // In real app, fetch by ID

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-bold">
                            {supplier.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                                    {supplier.category}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FiMapPin size={14} />
                                    {supplier.contact.address.city}, {supplier.contact.address.state}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <FiPhone size={14} />
                                    {supplier.contact.phone}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <FiMail size={14} />
                                    {supplier.contact.email}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm">
                                <FiEdit2 size={14} />
                                Edit Profile
                            </button>
                            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
                                Create PO
                            </button>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-right">
                                <div className="text-gray-500 text-xs">Outstanding</div>
                                <div className="font-bold text-red-600">₹{supplier.performance.outstandingBalance.toLocaleString()}</div>
                            </div>
                            <div className="text-right border-l border-gray-200 pl-4">
                                <div className="text-gray-500 text-xs">Rating</div>
                                <div className="font-bold text-yellow-600 flex items-center gap-1">
                                    {supplier.performance.rating} ★
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-6">
                    {['Overview', 'Licenses', 'History', 'Payments', 'Returns'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.toLowerCase()
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Main Info) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                <FiPackage /> Total Orders
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{supplier.performance.totalOrders}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                <FiClock /> On-Time Delivery
                            </div>
                            <div className="text-2xl font-bold text-emerald-600">{supplier.performance.onTimeDeliveryRate}%</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                <FiAlertCircle /> Return Rate
                            </div>
                            <div className="text-2xl font-bold text-blue-600">{supplier.performance.returnRate}%</div>
                        </div>
                    </div>

                    {/* Licenses Section (Visible in Overview) */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Licenses & Documents</h3>
                            <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Manage</button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {supplier.licenses.map((lic) => (
                                <div key={lic.id} className="px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-gray-900">{lic.type}</div>
                                        <div className="text-sm text-gray-500">{lic.number}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-medium ${lic.status === 'Active' ? 'text-emerald-600' : 'text-red-600'
                                            }`}>
                                            {lic.status}
                                        </div>
                                        <div className="text-xs text-gray-500">Expires: {lic.validTo}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (Details) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Business Details</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Payment Terms</div>
                                <div className="font-medium text-gray-900 mt-1">{supplier.paymentTerms}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Credit Limit</div>
                                <div className="font-medium text-gray-900 mt-1">
                                    {supplier.creditLimit ? `₹${supplier.creditLimit.toLocaleString()}` : 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">GSTIN</div>
                                <div className="font-medium text-gray-900 mt-1">{supplier.gstin}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Address</div>
                                <div className="font-medium text-gray-900 mt-1 text-sm leading-relaxed">
                                    {supplier.contact.address.line1}<br />
                                    {supplier.contact.address.line2 && <>{supplier.contact.address.line2}<br /></>}
                                    {supplier.contact.address.city} - {supplier.contact.address.pincode}<br />
                                    {supplier.contact.address.state}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

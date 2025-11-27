'use client';

import React, { useState, useEffect } from 'react';
import { Supplier } from '@/types/supplier';
import { supplierApi } from '@/lib/api/supplier';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import SupplierForm from './SupplierForm';
import { FiPhone, FiMail, FiMapPin, FiEdit2, FiClock, FiDollarSign, FiPackage, FiAlertCircle } from 'react-icons/fi';

const ProfileSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                    <div>
                        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-32"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-1/2"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-white rounded-lg border border-gray-200"></div>
                    <div className="h-24 bg-white rounded-lg border border-gray-200"></div>
                    <div className="h-24 bg-white rounded-lg border border-gray-200"></div>
                </div>
                <div className="h-48 bg-white rounded-lg border border-gray-200"></div>
            </div>
            <div className="h-64 bg-white rounded-lg border border-gray-200"></div>
        </div>
    </div>
)


export default function SupplierProfile({ id }: { id: string }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchSupplier = async () => {
        setIsLoading(true);
        try {
            const response = await supplierApi.getSupplierById(id);

            if (response.success && response.data) {
                const apiData = response.data;

                // Transform API data to match Supplier interface
                const transformedSupplier: Supplier = {
                    id: apiData.id,
                    name: apiData.name,
                    category: apiData.category as any,
                    status: apiData.status as any,
                    gstin: apiData.gstin || '',
                    dlNumber: apiData.dlNumber,
                    pan: apiData.pan,
                    contact: {
                        primaryName: apiData.contactName,
                        phone: apiData.phoneNumber,
                        email: apiData.email || '',
                        whatsapp: apiData.whatsapp,
                        address: {
                            line1: apiData.addressLine1,
                            line2: apiData.addressLine2,
                            city: apiData.city,
                            state: apiData.state,
                            pincode: apiData.pinCode,
                            country: 'India' // Default
                        }
                    },
                    paymentTerms: (apiData.paymentTerms as any) || 'Net 30',
                    creditLimit: apiData.creditLimit,
                    licenses: (apiData.licenses || []).map((lic: any) => ({
                        id: lic.id,
                        type: lic.type,
                        number: lic.number,
                        validFrom: lic.validFrom,
                        validTo: lic.validTo,
                        documentUrl: lic.documentUrl,
                        status: new Date(lic.validTo) < new Date() ? 'Expired' : 'Active'
                    })),
                    performance: {
                        rating: 0,
                        onTimeDeliveryRate: 0,
                        returnRate: 0,
                        qualityScore: 0,
                        totalOrders: 0,
                        totalSpent: 0,
                        outstandingBalance: 0
                    },
                    tags: [],
                    createdAt: apiData.createdAt,
                    updatedAt: apiData.updatedAt,
                    purchaseOrders: apiData.purchaseOrders || [],
                    returns: apiData.returns || []
                };

                setSupplier(transformedSupplier);
            } else {
                console.error('Failed to fetch supplier:', response);
            }
        } catch (error) {
            console.error('Error fetching supplier:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchSupplier();
        }
    }, [id]);

    const handleSaveProfile = async (data: any) => {
        try {
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

            const response = await supplierApi.updateSupplier(id, supplierData);
            if (response.success) {
                setIsEditModalOpen(false);
                fetchSupplier(); // Refresh data
            }
        } catch (error) {
            console.error('Failed to update supplier:', error);
            alert('Failed to update supplier profile');
        }
    };

    const getInitialFormData = () => {
        if (!supplier) return undefined;
        return {
            name: supplier.name,
            category: supplier.category,
            status: supplier.status,
            gstin: supplier.gstin,
            dlNumber: supplier.dlNumber,
            pan: supplier.pan,
            contactName: supplier.contact.primaryName,
            phoneNumber: supplier.contact.phone,
            email: supplier.contact.email,
            whatsapp: supplier.contact.whatsapp,
            addressLine1: supplier.contact.address.line1,
            addressLine2: supplier.contact.address.line2,
            city: supplier.contact.address.city,
            state: supplier.contact.address.state,
            pinCode: supplier.contact.address.pincode,
            paymentTerms: supplier.paymentTerms,
            creditLimit: supplier.creditLimit,
        };
    };

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!supplier) {
        return <div className="text-center py-10">Supplier not found.</div>;
    }

    const renderOverview = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (Main Info) */}
            <div className="lg:col-span-2 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                            <FiPackage /> Total Orders
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{supplier?.performance.totalOrders}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                            <FiClock /> On-Time Delivery
                        </div>
                        <div className="text-2xl font-bold text-emerald-600">{supplier?.performance.onTimeDeliveryRate}%</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                            <FiAlertCircle /> Return Rate
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{supplier?.performance.returnRate}%</div>
                    </div>
                </div>

                {/* Licenses Section (Preview) */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Licenses & Documents</h3>
                        <button onClick={() => setActiveTab('licenses')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">View All</button>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {supplier?.licenses.slice(0, 3).map((lic) => (
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
                                    <div className="text-xs text-gray-500">Expires: {new Date(lic.validTo).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                        {(!supplier?.licenses || supplier.licenses.length === 0) && (
                            <div className="px-6 py-8 text-center text-gray-500 text-sm">No licenses found</div>
                        )}
                    </div>
                </div>

                {/* Recent Orders (Preview) */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                        <button onClick={() => setActiveTab('history')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">View All</button>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {supplier?.purchaseOrders?.slice(0, 3).map((po: any) => (
                            <div key={po.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-900">{po.poNumber}</div>
                                    <div className="text-sm text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-gray-900">₹{parseFloat(po.total).toLocaleString()}</div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${po.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                                        po.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {po.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!supplier?.purchaseOrders || supplier.purchaseOrders.length === 0) && (
                            <div className="px-6 py-8 text-center text-gray-500 text-sm">No recent orders</div>
                        )}
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
                            <div className="font-medium text-gray-900 mt-1">{supplier?.paymentTerms}</div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Credit Limit</span>
                                <span className="font-medium text-gray-900">
                                    {supplier?.creditLimit ? `₹${Number(supplier.creditLimit).toLocaleString()}` : 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">GSTIN</div>
                            <div className="font-medium text-gray-900 mt-1">{supplier?.gstin}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Address</div>
                            <div className="font-medium text-gray-900 mt-1 text-sm leading-relaxed">
                                {supplier?.contact.address.line1}<br />
                                {supplier?.contact.address.line2 && <>{supplier.contact.address.line2}<br /></>}
                                {supplier?.contact.address.city} - {supplier?.contact.address.pincode}<br />
                                {supplier?.contact.address.state}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderLicenses = () => (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">All Licenses</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {supplier?.licenses.map((lic) => (
                    <div key={lic.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <FiPackage size={20} />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{lic.type}</div>
                                <div className="text-sm text-gray-500">License #: {lic.number}</div>
                                <div className="text-xs text-gray-500 mt-1">Valid from {new Date(lic.validFrom).toLocaleDateString()} to {new Date(lic.validTo).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${lic.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {lic.status}
                            </div>
                            {lic.documentUrl && (
                                <a href={lic.documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                    View Document
                                </a>
                            )}
                        </div>
                    </div>
                ))}
                {(!supplier?.licenses || supplier.licenses.length === 0) && (
                    <div className="p-8 text-center text-gray-500">No licenses found for this supplier.</div>
                )}
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Order History</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">PO Number</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {supplier?.purchaseOrders?.map((po: any) => (
                            <tr key={po.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{po.poNumber}</td>
                                <td className="px-6 py-4 text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${po.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                                        po.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                                            po.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {po.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">₹{parseFloat(po.total).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => router.push(`/orders/${po.id}`)}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {(!supplier?.purchaseOrders || supplier.purchaseOrders.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No purchase orders found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderReturns = () => (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Returns History</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Return #</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Reason</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {supplier?.returns?.map((ret: any) => (
                            <tr key={ret.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{ret.returnNumber}</td>
                                <td className="px-6 py-4 text-gray-500">{new Date(ret.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-gray-600">{ret.reason}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ret.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        ret.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {ret.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">₹{parseFloat(ret.total).toLocaleString()}</td>
                            </tr>
                        ))}
                        {(!supplier?.returns || supplier.returns.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No returns found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

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
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm"
                            >
                                <FiEdit2 size={14} />
                                Edit Profile
                            </button>
                            <button
                                onClick={() => router.push(`/orders/new-po?supplierId=${id}`)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                            >
                                Create PO
                            </button>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                <div className="text-sm text-red-600 mb-1">Outstanding Balance</div>
                                <div className="text-xl font-bold text-red-700">₹{supplier.performance.outstandingBalance.toLocaleString('en-IN')}</div>
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
                    {['Overview', 'Licenses', 'History', 'Returns'].map((tab) => (
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
            <div>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'licenses' && renderLicenses()}
                {activeTab === 'history' && renderHistory()}
                {activeTab === 'returns' && renderReturns()}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && typeof window !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
                        <SupplierForm
                            initialData={getInitialFormData()}
                            onSave={handleSaveProfile}
                            onCancel={() => setIsEditModalOpen(false)}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

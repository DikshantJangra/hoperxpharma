'use client';

import React, { useState } from 'react';
import { Supplier, SupplierCategory, PaymentTerm } from '@/types/supplier';
import { FiSave, FiX, FiUploadCloud } from 'react-icons/fi';

interface SupplierFormProps {
    initialData?: Partial<Supplier>;
    onSave: (data: Partial<Supplier>) => void;
    onCancel: () => void;
}

export default function SupplierForm({ initialData, onSave, onCancel }: SupplierFormProps) {
    const [formData, setFormData] = useState<Partial<Supplier>>(initialData || {
        category: 'Distributor',
        status: 'Active',
        paymentTerms: 'Net 30',
        contact: {
            primaryName: '',
            phone: '',
            email: '',
            address: {
                line1: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            }
        }
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleContactChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            contact: { ...prev.contact!, [field]: value }
        }));
    };

    const handleAddressChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            contact: {
                ...prev.contact!,
                address: { ...prev.contact!.address, [field]: value }
            }
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                    {initialData ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <FiX size={24} />
                </button>
            </div>

            <div className="space-y-8">
                {/* Section 1: Basic Info */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                        Identity & Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.name || ''}
                                onChange={e => handleChange('name', e.target.value)}
                                placeholder="e.g. MediCore Distributors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.category}
                                onChange={e => handleChange('category', e.target.value)}
                            >
                                <option value="Distributor">Distributor</option>
                                <option value="Manufacturer">Manufacturer</option>
                                <option value="Wholesaler">Wholesaler</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.gstin || ''}
                                onChange={e => handleChange('gstin', e.target.value)}
                                placeholder="27AAAAA0000A1Z5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Drug License No.</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.dlNumber || ''}
                                onChange={e => handleChange('dlNumber', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: Contact Person */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.contact?.primaryName || ''}
                                onChange={e => handleContactChange('primaryName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.contact?.phone || ''}
                                onChange={e => handleContactChange('phone', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                onChange={e => handleContactChange('email', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 3: Business Details */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                        Business Terms
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.paymentTerms}
                                onChange={e => handleChange('paymentTerms', e.target.value)}
                            >
                                <option value="Net 0">Net 0 (Immediate)</option>
                                <option value="Net 7">Net 7 Days</option>
                                <option value="Net 15">Net 15 Days</option>
                                <option value="Net 30">Net 30 Days</option>
                                <option value="Net 45">Net 45 Days</option>
                                <option value="Net 60">Net 60 Days</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.creditLimit || ''}
                                onChange={e => handleChange('creditLimit', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 4: Documents */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                        Documents
                    </h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <FiUploadCloud size={32} className="text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Click to upload licenses or agreements</span>
                        <span className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</span>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                        <FiSave />
                        <span>Save Supplier</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

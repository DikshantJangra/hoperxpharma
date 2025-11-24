'use client';

import React, { useState } from 'react';
import { FiSave, FiX, FiUploadCloud } from 'react-icons/fi';

interface SupplierFormProps {
    initialData?: any;
    onSave: (data: any) => void;
    onCancel: () => void;
}

export default function SupplierForm({ initialData, onSave, onCancel }: SupplierFormProps) {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        category: 'Distributor',
        status: 'Active',
        gstin: '',
        dlNumber: '',
        pan: '',
        contactName: '',
        phoneNumber: '',
        email: '',
        whatsapp: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pinCode: '',
        paymentTerms: 'Net 30',
        creditLimit: 0,
    });

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        // Basic validation
        if (!formData.name || !formData.contactName || !formData.phoneNumber) {
            alert('Please fill in all required fields (Name, Contact Person, Phone)');
            return;
        }

        onSave(formData);
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
                                value={formData.name}
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
                                value={formData.gstin}
                                onChange={e => handleChange('gstin', e.target.value)}
                                placeholder="27AAAAA0000A1Z5"
                                maxLength={15}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Drug License No.</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.dlNumber}
                                onChange={e => handleChange('dlNumber', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.pan}
                                onChange={e => handleChange('pan', e.target.value)}
                                placeholder="AAAAA0000A"
                                maxLength={10}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: Contact Person */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                        Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.contactName}
                                onChange={e => handleChange('contactName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.phoneNumber}
                                onChange={e => handleChange('phoneNumber', e.target.value)}
                                placeholder="9876543210"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.whatsapp}
                                onChange={e => handleChange('whatsapp', e.target.value)}
                                placeholder="9876543210"
                            />
                        </div>
                    </div>
                </section>

                {/* Section 3: Address */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                        Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.addressLine1}
                                onChange={e => handleChange('addressLine1', e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.addressLine2}
                                onChange={e => handleChange('addressLine2', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.city}
                                onChange={e => handleChange('city', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.state}
                                onChange={e => handleChange('state', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.pinCode}
                                onChange={e => handleChange('pinCode', e.target.value)}
                                maxLength={6}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 4: Business Details */}
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
                                value={formData.creditLimit}
                                onChange={e => handleChange('creditLimit', parseFloat(e.target.value) || 0)}
                            />
                        </div>
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
                        onClick={handleSubmit}
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

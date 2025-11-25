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
        creditLimit: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Validation functions
    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone);
    };

    const validateEmail = (email: string): boolean => {
        if (!email) return true; // Email is optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateGSTIN = (gstin: string): boolean => {
        if (!gstin) return true; // GSTIN is optional
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstin.length === 15 && gstinRegex.test(gstin);
    };

    const validatePAN = (pan: string): boolean => {
        if (!pan) return true; // PAN is optional
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return pan.length === 10 && panRegex.test(pan);
    };

    const validatePinCode = (pinCode: string): boolean => {
        if (!pinCode) return true; // PIN is optional
        const pinRegex = /^[0-9]{6}$/;
        return pinRegex.test(pinCode);
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};

        // Required field validations
        if (!formData.name?.trim()) {
            newErrors.name = 'Supplier name is required';
        }

        if (!formData.contactName?.trim()) {
            newErrors.contactName = 'Contact person name is required';
        }

        if (!formData.phoneNumber?.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!validatePhone(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
        }

        // Optional field validations
        if (formData.whatsapp && !validatePhone(formData.whatsapp)) {
            newErrors.whatsapp = 'WhatsApp number must be exactly 10 digits';
        }

        if (formData.email && !validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.gstin && !validateGSTIN(formData.gstin)) {
            newErrors.gstin = 'Invalid GSTIN format (e.g., 27AAAAA0000A1Z5)';
        }

        if (formData.pan && !validatePAN(formData.pan)) {
            newErrors.pan = 'Invalid PAN format (e.g., ABCDE1234F)';
        }

        if (formData.pinCode && !validatePinCode(formData.pinCode)) {
            newErrors.pinCode = 'PIN code must be exactly 6 digits';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to first error
            const firstErrorField = Object.keys(newErrors)[0];
            const element = document.querySelector(`[name="${firstErrorField}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Convert creditLimit to number before saving
        const dataToSave = {
            ...formData,
            creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0
        };

        onSave(dataToSave);
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
                                name="name"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                                placeholder="e.g. MediCore Distributors"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
                                name="gstin"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${errors.gstin ? 'border-red-500' : 'border-gray-300'}`}
                                value={formData.gstin}
                                onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                                placeholder="27AAAAA0000A1Z5"
                                maxLength={15}
                            />
                            {errors.gstin && <p className="text-red-500 text-xs mt-1">{errors.gstin}</p>}
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
                                name="pan"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${errors.pan ? 'border-red-500' : 'border-gray-300'}`}
                                value={formData.pan}
                                onChange={e => handleChange('pan', e.target.value.toUpperCase())}
                                placeholder="AAAAA0000A"
                                maxLength={10}
                            />
                            {errors.pan && <p className="text-red-500 text-xs mt-1">{errors.pan}</p>}
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
                                name="contactName"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${errors.contactName ? 'border-red-500' : 'border-gray-300'}`}
                                value={formData.contactName}
                                onChange={e => handleChange('contactName', e.target.value)}
                            />
                            {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                            <input
                                type="text"
                                name="phoneNumber"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                                value={formData.phoneNumber}
                                onChange={e => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 10) handleChange('phoneNumber', value);
                                }}
                                placeholder="9876543210"
                                maxLength={10}
                            />
                            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value)}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                            <input
                                type="text"
                                name="whatsapp"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${errors.whatsapp ? 'border-red-500' : 'border-gray-300'}`}
                                value={formData.whatsapp}
                                onChange={e => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 10) handleChange('whatsapp', value);
                                }}
                                placeholder="9876543210"
                                maxLength={10}
                            />
                            {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
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
                                name="pinCode"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${errors.pinCode ? 'border-red-500' : 'border-gray-300'}`}
                                value={formData.pinCode}
                                onChange={e => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 6) handleChange('pinCode', value);
                                }}
                                maxLength={6}
                            />
                            {errors.pinCode && <p className="text-red-500 text-xs mt-1">{errors.pinCode}</p>}
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
                                name="creditLimit"
                                min="0"
                                step="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.creditLimit}
                                onChange={e => handleChange('creditLimit', e.target.value)}
                                placeholder="Enter credit limit (e.g., 50000)"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty for no credit limit</p>
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

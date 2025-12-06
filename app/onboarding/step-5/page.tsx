"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiTruck, FiPlus, FiUser, FiPhone, FiTag, FiFileText, FiEdit2, FiTrash2, FiMail, FiMapPin, FiCreditCard } from "react-icons/fi";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function Step5Page() {
    const { state, addSupplier, removeSupplier, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [showForm, setShowForm] = useState(state.data.suppliers.length === 0);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        contactName: "",
        phone: "",
        email: "",
        whatsapp: "",
        category: "Distributor",
        gstin: "",
        dlNumber: "",
        pan: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pinCode: "",
        deliveryArea: "",
        creditTerms: "Net 30",
        creditLimit: ""
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validation functions
    const validatePhone = (phone: string) => {
        if (!phone) return "Phone number is required";
        if (!/^\d{10}$/.test(phone)) {
            return "Phone number must be exactly 10 digits";
        }
        return "";
    };

    const validateEmail = (email: string) => {
        if (!email) return ""; // Email is optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) ? "" : "Please enter a valid email address";
    };

    const validateGSTIN = (gstin: string) => {
        if (!gstin) return ""; // GSTIN is optional
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstin.length === 15 && gstinRegex.test(gstin) ? "" : "Invalid GSTIN format (e.g., 27AAAAA0000A1Z5)";
    };

    const validatePAN = (pan: string) => {
        if (!pan) return ""; // PAN is optional
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return pan.length === 10 && panRegex.test(pan) ? "" : "Invalid PAN format (e.g., ABCDE1234F)";
    };

    const validatePinCode = (pinCode: string) => {
        if (!pinCode) return ""; // PIN is optional
        const pinRegex = /^[0-9]{6}$/;
        return pinRegex.test(pinCode) ? "" : "PIN code must be exactly 6 digits";
    };

    const validateWhatsApp = (whatsapp: string) => {
        if (!whatsapp) return ""; // WhatsApp is optional
        if (!/^\d{10}$/.test(whatsapp)) {
            return "WhatsApp number must be exactly 10 digits";
        }
        return "";
    };

    const handleFieldChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    useEffect(() => {
        setCurrentStep(5);
    }, [setCurrentStep]);

    const handleAdd = () => {
        const newErrors: Record<string, string> = {};

        // Required field validations
        if (!formData.name.trim()) {
            newErrors.name = "Supplier name is required";
        }
        if (!formData.contactName.trim()) {
            newErrors.contactName = "Contact person name is required";
        }
        const phoneError = validatePhone(formData.phone);
        if (phoneError) {
            newErrors.phone = phoneError;
        }

        // Optional field validations
        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;

        const whatsappError = validateWhatsApp(formData.whatsapp);
        if (whatsappError) newErrors.whatsapp = whatsappError;

        const gstinError = validateGSTIN(formData.gstin);
        if (gstinError) newErrors.gstin = gstinError;

        const panError = validatePAN(formData.pan);
        if (panError) newErrors.pan = panError;

        const pinCodeError = validatePinCode(formData.pinCode);
        if (pinCodeError) newErrors.pinCode = pinCodeError;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (editIndex !== null) {
            removeSupplier(editIndex);
            addSupplier(formData);
            setEditIndex(null);
        } else {
            addSupplier(formData);
        }

        // Reset form
        setFormData({
            name: "",
            contactName: "",
            phone: "",
            email: "",
            whatsapp: "",
            category: "Distributor",
            gstin: "",
            dlNumber: "",
            pan: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            pinCode: "",
            deliveryArea: "",
            creditTerms: "Net 30",
            creditLimit: ""
        });
        setErrors({});
        setShowForm(false);
    };

    const handleEdit = (index: number) => {
        const supplier = state.data.suppliers[index];
        setFormData({
            name: supplier.name,
            contactName: supplier.contactName || "",
            phone: supplier.phone,
            email: supplier.email || "",
            whatsapp: supplier.whatsapp || "",
            category: supplier.category || "Distributor",
            gstin: supplier.gstin || "",
            dlNumber: supplier.dlNumber || "",
            pan: supplier.pan || "",
            addressLine1: supplier.addressLine1 || "",
            addressLine2: supplier.addressLine2 || "",
            city: supplier.city || "",
            state: supplier.state || "",
            pinCode: supplier.pinCode || "",
            deliveryArea: supplier.deliveryArea || "",
            creditTerms: supplier.creditTerms || "Net 30",
            creditLimit: supplier.creditLimit || ""
        });
        setErrors({});
        setEditIndex(index);
        setShowForm(true);
    };

    const handleDelete = (index: number) => {
        if (confirm('Are you sure you want to remove this supplier?')) {
            removeSupplier(index);
        }
    };

    const handleSkip = () => {
        markStepComplete(5);
        router.push("/onboarding/step-6");
    };

    const handleNext = () => {
        markStepComplete(5);
        router.push("/onboarding/step-6");
    };

    const handleBack = () => {
        router.push("/onboarding/step-4");
    };

    return (
        <OnboardingCard
            title="Supplier Setup"
            description="Add your suppliers (optional - you can add more details later)"
            icon={<FiTruck size={28} />}
        >
            <div className="space-y-6">
                {/* Supplier List */}
                {state.data.suppliers.length > 0 && (
                    <div className="space-y-3 animate-fade-in-up">
                        {state.data.suppliers.map((supplier, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                                <div>
                                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                                        <FiUser className="text-emerald-500" size={16} />
                                        {supplier.name}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                                        <span className="flex items-center gap-1"><FiUser size={12} /> {supplier.contactName}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className="flex items-center gap-1"><FiPhone size={12} /> {supplier.phone}</span>
                                        {supplier.email && (
                                            <>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span className="flex items-center gap-1"><FiMail size={12} /> {supplier.email}</span>
                                            </>
                                        )}
                                        {supplier.city && supplier.state && (
                                            <>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span className="flex items-center gap-1"><FiMapPin size={12} /> {supplier.city}, {supplier.state}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(idx)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <FiEdit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(idx)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Supplier Form */}
                {showForm ? (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 animate-fade-in-up">
                        <div className="space-y-6">
                            {/* Section 1: Identity & Contact */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">
                                    Identity & Contact
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Supplier Name <span className="text-red-500">*</span></label>
                                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                                <FiTruck size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="e.g. MediCore Distributors"
                                            />
                                        </div>
                                        {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
                                    </div>

                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Category</label>
                                        <div className="relative">
                                            <select
                                                value={formData.category}
                                                onChange={(e) => handleFieldChange('category', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 appearance-none"
                                            >
                                                <option value="Distributor">Distributor</option>
                                                <option value="Manufacturer">Manufacturer</option>
                                                <option value="Wholesaler">Wholesaler</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">GSTIN</label>
                                        <input
                                            type="text"
                                            value={formData.gstin}
                                            onChange={(e) => handleFieldChange('gstin', e.target.value.toUpperCase())}
                                            className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 ${errors.gstin ? 'border-red-500' : 'border-gray-200'}`}
                                            placeholder="27AAAAA0000A1Z5"
                                            maxLength={15}
                                        />
                                        {errors.gstin && <p className="text-xs text-red-500 mt-1 ml-1">{errors.gstin}</p>}
                                    </div>

                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Drug License No.</label>
                                        <input
                                            type="text"
                                            value={formData.dlNumber}
                                            onChange={(e) => handleFieldChange('dlNumber', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900"
                                            placeholder="DL/ABC/12345"
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">PAN</label>
                                        <input
                                            type="text"
                                            value={formData.pan}
                                            onChange={(e) => handleFieldChange('pan', e.target.value.toUpperCase())}
                                            className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 ${errors.pan ? 'border-red-500' : 'border-gray-200'}`}
                                            placeholder="AAAAA0000A"
                                            maxLength={10}
                                        />
                                        {errors.pan && <p className="text-xs text-red-500 mt-1 ml-1">{errors.pan}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Contact Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Contact Person <span className="text-red-500">*</span></label>
                                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                                <FiUser size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.contactName}
                                                onChange={(e) => handleFieldChange('contactName', e.target.value)}
                                                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 ${errors.contactName ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="Contact person name"
                                            />
                                        </div>
                                        {errors.contactName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.contactName}</p>}
                                    </div>

                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Phone <span className="text-red-500">*</span></label>
                                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                                <FiPhone size={18} />
                                            </div>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                    if (value.length <= 10) handleFieldChange('phone', value);
                                                }}
                                                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:outline-none transition-all text-sm text-gray-900 ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
                                                placeholder="9876543210"
                                                maxLength={10}
                                            />
                                        </div>
                                        {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone}</p>}
                                    </div>

                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Email</label>
                                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                                <FiMail size={18} />
                                            </div>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="supplier@example.com"
                                            />
                                        </div>
                                        {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>}
                                    </div>

                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">WhatsApp</label>
                                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                                <FiPhone size={18} />
                                            </div>
                                            <input
                                                type="tel"
                                                value={formData.whatsapp}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                    if (value.length <= 10) handleFieldChange('whatsapp', value);
                                                }}
                                                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 ${errors.whatsapp ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="9876543210"
                                                maxLength={10}
                                            />
                                        </div>
                                        {errors.whatsapp && <p className="text-xs text-red-500 mt-1 ml-1">{errors.whatsapp}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Address */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">
                                    Address
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Address Line 1</label>
                                        <input
                                            type="text"
                                            value={formData.addressLine1}
                                            onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900"
                                            placeholder="Building, Street"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Address Line 2</label>
                                        <input
                                            type="text"
                                            value={formData.addressLine2}
                                            onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900"
                                            placeholder="Area, Landmark"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => handleFieldChange('city', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900"
                                            placeholder="Mumbai"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">State</label>
                                        <div className="relative">
                                            <select
                                                value={formData.state}
                                                onChange={(e) => handleFieldChange('state', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 appearance-none"
                                            >
                                                <option value="">Select state</option>
                                                {INDIAN_STATES.map((state) => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">PIN Code</label>
                                        <input
                                            type="text"
                                            value={formData.pinCode}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                if (value.length <= 6) handleFieldChange('pinCode', value);
                                            }}
                                            className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 ${errors.pinCode ? 'border-red-500' : 'border-gray-200'}`}
                                            placeholder="400001"
                                            maxLength={6}
                                        />
                                        {errors.pinCode && <p className="text-xs text-red-500 mt-1 ml-1">{errors.pinCode}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Business Terms */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">
                                    Business Terms
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Payment Terms</label>
                                        <div className="relative">
                                            <select
                                                value={formData.creditTerms}
                                                onChange={(e) => handleFieldChange('creditTerms', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 appearance-none"
                                            >
                                                <option value="Net 0">Net 0 (Immediate)</option>
                                                <option value="Net 7">Net 7 Days</option>
                                                <option value="Net 15">Net 15 Days</option>
                                                <option value="Net 30">Net 30 Days</option>
                                                <option value="Net 45">Net 45 Days</option>
                                                <option value="Net 60">Net 60 Days</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Credit Limit (₹)</label>
                                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                                <FiCreditCard size={18} />
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={formData.creditLimit}
                                                onChange={(e) => handleFieldChange('creditLimit', e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900"
                                                placeholder="50000"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 ml-1">Leave empty for no credit limit</p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Note */}
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                                <strong>Note:</strong> Only supplier name, contact person, and phone are required. You can add more details later from the Suppliers page.
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditIndex(null);
                                        setErrors({});
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    {editIndex !== null ? 'Update Supplier' : 'Add Supplier'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full px-4 py-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl font-medium hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50/10 transition-all flex items-center justify-center gap-2 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-500 transition-colors">
                            <FiPlus size={18} />
                        </div>
                        Add Another Supplier
                    </button>
                )}

                {/* Navigation */}
                <div className="pt-4 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        className="px-6 py-2.5 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="flex gap-3">
                        {state.data.suppliers.length === 0 && !showForm && (
                            <button
                                onClick={handleSkip}
                                className="px-6 py-3 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Skip for Now
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                        >
                            Continue to POS
                            <FiArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </OnboardingCard>
    );
}

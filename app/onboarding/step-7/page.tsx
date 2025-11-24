"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiUsers, FiPlus, FiUser, FiPhone, FiShield, FiLock, FiRefreshCw, FiEdit2, FiTrash2 } from "react-icons/fi";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

const ROLES = ["Pharmacist", "Manager", "Cashier", "Assistant"];

export default function Step7Page() {
    const { state, addUser, removeUser, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [showForm, setShowForm] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        role: "Pharmacist",
        pin: ""
    });
    const [phoneError, setPhoneError] = useState("");

    const validatePhone = (phone: string) => {
        if (!phone) return "";
        if (!/^\d{10}$/.test(phone)) {
            return "Phone number must be exactly 10 digits";
        }
        return "";
    };

    const handlePhoneChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 10);
        setFormData({ ...formData, phone: cleaned });
        setPhoneError(validatePhone(cleaned));
    };

    useEffect(() => {
        setCurrentStep(7);
    }, [setCurrentStep]);

    const generatePIN = () => {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        setFormData({ ...formData, pin });
    };

    const handleAdd = () => {
        const phoneValidation = validatePhone(formData.phone);
        if (phoneValidation) {
            setPhoneError(phoneValidation);
            return;
        }
        
        if (formData.name && formData.phone && formData.pin) {
            if (editIndex !== null) {
                removeUser(editIndex);
                addUser(formData);
                setEditIndex(null);
            } else {
                addUser(formData);
            }
            setFormData({ name: "", phone: "", role: "Pharmacist", pin: "" });
            setPhoneError("");
            setShowForm(false);
        }
    };

    const handleEdit = (index: number) => {
        const user = state.data.users[index];
        setFormData({
            name: user.name,
            phone: user.phone,
            role: user.role,
            pin: user.pin
        });
        setPhoneError("");
        setEditIndex(index);
        setShowForm(true);
    };

    const handleDelete = (index: number) => {
        if (confirm('Are you sure you want to remove this user?')) {
            removeUser(index);
        }
    };

    const handleSkip = () => {
        markStepComplete(7);
        router.push("/onboarding/step-8");
    };

    const handleNext = () => {
        markStepComplete(7);
        router.push("/onboarding/step-8");
    };

    const handleBack = () => {
        router.push("/onboarding/step-6");
    };

    return (
        <OnboardingCard
            title="Users & Roles"
            description="Add team members (optional - you can add more later)"
            icon={<FiUsers size={28} />}
        >
            <div className="space-y-6">
                {/* Admin Info */}
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <div className="mt-0.5 text-blue-500">
                        <FiShield size={18} />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-blue-900">You are automatically added as Admin</div>
                        <div className="text-xs text-blue-700 mt-0.5">Full access to all features and settings</div>
                    </div>
                </div>

                {/* User List */}
                {state.data.users.length > 0 && (
                    <div className="space-y-3 animate-fade-in-up">
                        {state.data.users.map((user, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                                        <FiUser className="text-emerald-500" size={16} />
                                        {user.name}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                                        <span className="flex items-center gap-1"><FiShield size={12} /> {user.role}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className="flex items-center gap-1"><FiPhone size={12} /> {user.phone}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                        <FiLock size={12} className="text-gray-400" />
                                        <span className="text-sm font-mono font-medium text-gray-700">{user.pin}</span>
                                    </div>
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

                {/* Add User Form */}
                {showForm ? (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 animate-fade-in-up">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Name <span className="text-red-500">*</span></label>
                                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                            <FiUser size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900"
                                            placeholder="Enter full name"
                                        />
                                    </div>
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
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:outline-none transition-all text-sm text-gray-900 ${
                                                phoneError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
                                            }`}
                                            placeholder="Enter 10-digit phone number"
                                            maxLength={10}
                                        />
                                    </div>
                                    {phoneError && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">{phoneError}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Role <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 appearance-none"
                                        >
                                            {ROLES.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">PIN <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                                <FiLock size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.pin}
                                                onChange={(e) => setFormData({ ...formData, pin: e.target.value.slice(0, 4) })}
                                                placeholder="4-digit PIN"
                                                maxLength={4}
                                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 font-mono"
                                            />
                                        </div>
                                        <button
                                            onClick={generatePIN}
                                            className="px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-2"
                                            title="Generate Random PIN"
                                        >
                                            <FiRefreshCw size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    disabled={!formData.name || !formData.phone || !formData.pin || !!phoneError}
                                    className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                                >
                                    {editIndex !== null ? 'Update User' : 'Add User'}
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
                        Add Team Member
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
                        {state.data.users.length === 0 && !showForm && (
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
                            Continue to Integrations
                            <FiArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </OnboardingCard>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiUsers, FiPlus } from "react-icons/fi";

const ROLES = ["Pharmacist", "Manager", "Cashier", "Assistant"];

export default function Step7Page() {
    const { state, addUser, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        role: "Pharmacist",
        pin: ""
    });

    useEffect(() => {
        setCurrentStep(7);
    }, [setCurrentStep]);

    const generatePIN = () => {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        setFormData({ ...formData, pin });
    };

    const handleAdd = () => {
        if (formData.name && formData.phone && formData.pin) {
            addUser(formData);
            setFormData({ name: "", phone: "", role: "Pharmacist", pin: "" });
            setShowForm(false);
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

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 mb-20">
            <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] flex items-center justify-center">
                    <FiUsers className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Users & Roles</h1>
                    <p className="text-[#64748b]">Add team members (optional - you can add more later)</p>
                </div>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-900 mb-1">You are automatically added as Admin</div>
                <div className="text-sm text-blue-700">Full access to all features and settings</div>
            </div>

            {state.data.users.length > 0 && (
                <div className="mb-6 space-y-3">
                    {state.data.users.map((user, idx) => (
                        <div key={idx} className="p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-[#0f172a]">{user.name}</div>
                                    <div className="text-sm text-[#64748b]">{user.role} • {user.phone}</div>
                                </div>
                                <div className="text-sm font-mono text-[#0ea5a3]">PIN: {user.pin}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Phone *</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Role *</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            >
                                {ROLES.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">PIN *</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.pin}
                                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.slice(0, 4) })}
                                    placeholder="4-digit PIN"
                                    maxLength={4}
                                    className="flex-1 px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                />
                                <button
                                    onClick={generatePIN}
                                    className="px-4 py-3 bg-[#f1f5f9] text-[#64748b] rounded-lg font-medium hover:bg-[#e2e8f0] transition-colors"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleAdd}
                        className="w-full px-4 py-3 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors"
                    >
                        Add User
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-[#cbd5e1] text-[#64748b] rounded-lg font-medium hover:border-[#0ea5a3] hover:text-[#0ea5a3] transition-colors flex items-center justify-center gap-2"
                >
                    <FiPlus className="w-5 h-5" />
                    Add Team Member
                </button>
            )}

            <div className="mt-8 flex justify-between">
                <button
                    onClick={() => router.push("/onboarding/step-6")}
                    className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <div className="flex gap-3">
                    {state.data.users.length === 0 && (
                        <button
                            onClick={handleSkip}
                            className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors"
                        >
                            Skip for Now
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="px-8 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                    >
                        Continue to Integrations
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

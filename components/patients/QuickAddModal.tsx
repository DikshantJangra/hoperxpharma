"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiX, FiUser, FiPhone, FiCheck, FiAlertCircle } from "react-icons/fi";
import { patientsApi } from "@/lib/api/patients";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (patientId: string) => void;
}

export default function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
    const router = useRouter();
    const { primaryStore } = useAuthStore();
    const firstInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Focus first input when modal opens
    useEffect(() => {
        if (isOpen && firstInputRef.current) {
            setTimeout(() => {
                firstInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Reset form when closed
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                firstName: "",
                lastName: "",
                phoneNumber: "",
            });
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName || !formData.phoneNumber) {
            setError("Name and Phone Number are required");
            return;
        }

        if (!primaryStore?.id) {
            setError("Store information missing. Please reload.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const newPatient = await patientsApi.createPatient({
                ...formData,
                storeId: primaryStore.id,
                // Default values for required fields
                gender: "Other",
                dateOfBirth: new Date().toISOString(), // Placeholder, can be updated later
            });

            if (onSuccess) {
                onSuccess(newPatient.id);
            } else {
                // Default behavior: go to profile
                router.push(`/patients/${newPatient.id}`);
            }

            onClose();
        } catch (err: any) {
            console.error("Failed to create patient:", err);
            // Handle duplicate phone error specifically if API returns 409
            if (err.message?.includes("duplicate") || err.status === 409) {
                setError("A patient with this phone number already exists.");
            } else {
                setError(err.message || "Failed to create patient. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="bg-teal-600 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FiUser className="w-5 h-5" />
                        Quick Add Patient
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-teal-100 hover:text-white hover:bg-teal-700/50 p-1 rounded-full transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                            <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={firstInputRef}
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                placeholder="John"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiPhone className="text-gray-400" />
                            </div>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                placeholder="9876543210"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Enter 10-digit mobile number
                        </p>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiCheck className="w-4 h-4" />
                                    Create Patient
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

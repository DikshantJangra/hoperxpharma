"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiClock } from "react-icons/fi";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Step3Page() {
    const { state, updateTimings, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [formData, setFormData] = useState({
        operatingDays: state.data.timings?.operatingDays || [],
        openTime: state.data.timings?.openTime || "09:00",
        closeTime: state.data.timings?.closeTime || "21:00",
        lunchBreak: state.data.timings?.lunchBreak || false,
        lunchStart: state.data.timings?.lunchStart || "13:00",
        lunchEnd: state.data.timings?.lunchEnd || "14:00",
        is24x7: state.data.timings?.is24x7 || false,
        deliveryAvailable: state.data.timings?.deliveryAvailable || false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setCurrentStep(3);
    }, [setCurrentStep]);

    useEffect(() => {
        const timer = setTimeout(() => {
            updateTimings(formData);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData]);

    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            operatingDays: prev.operatingDays.includes(day)
                ? prev.operatingDays.filter(d => d !== day)
                : [...prev.operatingDays, day]
        }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.is24x7 && formData.operatingDays.length === 0) {
            newErrors.operatingDays = "Please select at least one operating day";
        }

        if (!formData.is24x7 && formData.closeTime <= formData.openTime) {
            newErrors.closeTime = "Close time must be after open time";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validate()) {
            updateTimings(formData);
            markStepComplete(3);
            router.push("/onboarding/step-4");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 mb-20">
            <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] flex items-center justify-center">
                    <FiClock className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Store Timings & Operations</h1>
                    <p className="text-[#64748b]">Configure your store's operating hours</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-semibold text-[#0f172a]">24x7 Operation</label>
                        <button
                            onClick={() => setFormData({ ...formData, is24x7: !formData.is24x7 })}
                            className={`relative w-14 h-7 rounded-full transition-colors ${formData.is24x7 ? "bg-[#0ea5a3]" : "bg-[#cbd5e1]"
                                }`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${formData.is24x7 ? "translate-x-7" : ""
                                }`}></div>
                        </button>
                    </div>
                </div>

                {!formData.is24x7 && (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-3">
                                Operating Days <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {DAYS.map(day => (
                                    <button
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${formData.operatingDays.includes(day)
                                                ? "bg-[#0ea5a3] text-white"
                                                : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                            {errors.operatingDays && <p className="mt-2 text-sm text-red-600">{errors.operatingDays}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Open Time</label>
                                <input
                                    type="time"
                                    value={formData.openTime}
                                    onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Close Time</label>
                                <input
                                    type="time"
                                    value={formData.closeTime}
                                    onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.closeTime ? "border-red-500" : "border-[#cbd5e1]"
                                        }`}
                                />
                                {errors.closeTime && <p className="mt-2 text-sm text-red-600">{errors.closeTime}</p>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-semibold text-[#0f172a]">Lunch Break</label>
                                <button
                                    onClick={() => setFormData({ ...formData, lunchBreak: !formData.lunchBreak })}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${formData.lunchBreak ? "bg-[#0ea5a3]" : "bg-[#cbd5e1]"
                                        }`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${formData.lunchBreak ? "translate-x-7" : ""
                                        }`}></div>
                                </button>
                            </div>

                            {formData.lunchBreak && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#64748b] mb-2">Lunch Start</label>
                                        <input
                                            type="time"
                                            value={formData.lunchStart}
                                            onChange={(e) => setFormData({ ...formData, lunchStart: e.target.value })}
                                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#64748b] mb-2">Lunch End</label>
                                        <input
                                            type="time"
                                            value={formData.lunchEnd}
                                            onChange={(e) => setFormData({ ...formData, lunchEnd: e.target.value })}
                                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-[#0f172a]">Delivery Available</label>
                        <button
                            onClick={() => setFormData({ ...formData, deliveryAvailable: !formData.deliveryAvailable })}
                            className={`relative w-14 h-7 rounded-full transition-colors ${formData.deliveryAvailable ? "bg-[#0ea5a3]" : "bg-[#cbd5e1]"
                                }`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${formData.deliveryAvailable ? "translate-x-7" : ""
                                }`}></div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={() => router.push("/onboarding/step-2")}
                    className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                >
                    Continue to Inventory
                    <FiArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

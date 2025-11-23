"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiClock, FiSun, FiMoon } from "react-icons/fi";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

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

    const handleBack = () => {
        updateTimings(formData);
        router.push("/onboarding/step-2");
    };

    return (
        <OnboardingCard
            title="Store Timings & Operations"
            description="Configure your store's operating hours"
            icon={<FiClock size={28} />}
        >
            <div className="space-y-8">
                {/* 24x7 Toggle */}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                    <div>
                        <label className="text-sm font-bold text-gray-900 block mb-1">24x7 Operation</label>
                        <p className="text-xs text-gray-500">Is your pharmacy open 24 hours a day?</p>
                    </div>
                    <button
                        onClick={() => setFormData({ ...formData, is24x7: !formData.is24x7 })}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${formData.is24x7 ? "bg-emerald-500" : "bg-gray-300"}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${formData.is24x7 ? "translate-x-7" : ""}`}></div>
                    </button>
                </div>

                {!formData.is24x7 && (
                    <div className="space-y-6 animate-fade-in-up">
                        {/* Operating Days */}
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-3 ml-1">
                                Operating Days <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {DAYS.map(day => (
                                    <button
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${formData.operatingDays.includes(day)
                                            ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-emerald-500 hover:text-emerald-500"
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                            {errors.operatingDays && <p className="mt-2 text-xs text-red-500 ml-1">{errors.operatingDays}</p>}
                        </div>

                        {/* Time Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="group">
                                <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                                    Open Time
                                </label>
                                <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                        <FiSun size={18} />
                                    </div>
                                    <input
                                        type="time"
                                        value={formData.openTime}
                                        onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                                    Close Time
                                </label>
                                <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                        <FiMoon size={18} />
                                    </div>
                                    <input
                                        type="time"
                                        value={formData.closeTime}
                                        onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                                        className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 ${errors.closeTime ? "border-red-500" : "border-gray-200"}`}
                                    />
                                </div>
                                {errors.closeTime && <p className="mt-1 ml-1 text-xs text-red-500">{errors.closeTime}</p>}
                            </div>
                        </div>

                        {/* Lunch Break */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-900">Lunch Break</label>
                                <button
                                    onClick={() => setFormData({ ...formData, lunchBreak: !formData.lunchBreak })}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${formData.lunchBreak ? "bg-emerald-500" : "bg-gray-300"}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${formData.lunchBreak ? "translate-x-6" : ""}`}></div>
                                </button>
                            </div>

                            {formData.lunchBreak && (
                                <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                                    <div>
                                        <label className="block text-gray-500 text-xs font-medium mb-1.5 ml-1">Lunch Start</label>
                                        <input
                                            type="time"
                                            value={formData.lunchStart}
                                            onChange={(e) => setFormData({ ...formData, lunchStart: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-500 text-xs font-medium mb-1.5 ml-1">Lunch End</label>
                                        <input
                                            type="time"
                                            value={formData.lunchEnd}
                                            onChange={(e) => setFormData({ ...formData, lunchEnd: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Delivery Available */}
                <div className="bg-blue-50/50 rounded-xl p-4 flex items-center justify-between border border-blue-100">
                    <div>
                        <label className="text-sm font-bold text-gray-900 block mb-1">Home Delivery</label>
                        <p className="text-xs text-blue-600/80">Do you offer medicine delivery services?</p>
                    </div>
                    <button
                        onClick={() => setFormData({ ...formData, deliveryAvailable: !formData.deliveryAvailable })}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${formData.deliveryAvailable ? "bg-blue-500" : "bg-gray-300"}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${formData.deliveryAvailable ? "translate-x-7" : ""}`}></div>
                    </button>
                </div>

                {/* Navigation */}
                <div className="pt-4 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        className="px-6 py-2.5 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                        Continue to Inventory
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </OnboardingCard>
    );
}

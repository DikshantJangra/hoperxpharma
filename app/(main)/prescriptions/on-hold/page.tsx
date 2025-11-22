"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiPauseCircle, FiClock, FiAlertTriangle, FiPlay } from "react-icons/fi";
import StatusBadge from "@/components/prescriptions/StatusBadge";
import PrescriptionFilters from "@/components/prescriptions/PrescriptionFilters";

interface OnHoldPrescription {
    id: string;
    patientName: string;
    doctorName: string;
    date: Date;
    drugCount: number;
    holdReason: string;
    holdCategory: "signature" | "stock" | "clarification" | "insurance" | "price";
    priority: "normal" | "urgent";
    reminderTime?: Date;
    notes?: string;
}

const PrescriptionCardSkeleton = () => (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-8 bg-gray-100 rounded-lg w-full"></div>
            </div>
            <div className="flex flex-col gap-2 ml-6">
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
    </div>
)

const HOLD_CATEGORIES = {
    signature: { label: "Missing Signature", color: "red", icon: FiAlertTriangle },
    stock: { label: "Out of Stock", color: "amber", icon: FiPauseCircle },
    clarification: { label: "Needs Clarification", color: "blue", icon: FiAlertTriangle },
    insurance: { label: "Insurance Pending", color: "purple", icon: FiClock },
    price: { label: "Price Confirmation", color: "yellow", icon: FiAlertTriangle }
};

export default function OnHoldPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<OnHoldPrescription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setPrescriptions([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, []);

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMs < 0) return "Overdue";
        if (diffHours < 24) return `in ${diffHours}h`;
        return `in ${diffDays}d`;
    };

    const urgentCount = prescriptions.filter(p => p.priority === "urgent").length;
    const overdueCount = prescriptions.filter(p => p.reminderTime && p.reminderTime < new Date()).length;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <Link
                            href="/prescriptions"
                            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FiArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <FiPauseCircle className="text-amber-600" />
                                On Hold Prescriptions
                            </h1>
                            <p className="text-sm text-gray-500">Prescriptions requiring clarification or action</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            {urgentCount > 0 && (
                                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                                    <span className="text-sm text-gray-600">Urgent:</span>
                                    {isLoading ? (
                                        <span className="ml-2 font-bold text-red-700 animate-pulse w-4 h-4 bg-gray-200 rounded"></span>
                                    ) : (
                                        <span className="ml-2 font-bold text-red-700">{urgentCount}</span>
                                    )}
                                </div>
                            )}
                            {overdueCount > 0 && (
                                <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                    <span className="text-sm text-gray-600">Overdue:</span>
                                    {isLoading ? (
                                        <span className="ml-2 font-bold text-amber-700 animate-pulse w-4 h-4 bg-gray-200 rounded"></span>
                                    ) : (
                                        <span className="ml-2 font-bold text-amber-700">{overdueCount}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Filters */}
                <PrescriptionFilters />

                {/* Prescriptions List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <>
                            <PrescriptionCardSkeleton/>
                            <PrescriptionCardSkeleton/>
                        </>
                    ) : prescriptions.length > 0 ? (
                        prescriptions.map((prescription) => {
                            const category = HOLD_CATEGORIES[prescription.holdCategory];
                            const CategoryIcon = category.icon;
                            const isOverdue = prescription.reminderTime && prescription.reminderTime < new Date();

                            return (
                                <div
                                    key={prescription.id}
                                    className={`bg-white border-2 rounded-xl p-6 hover:shadow-md transition-all ${prescription.priority === "urgent"
                                            ? "border-red-200 bg-red-50/30"
                                            : "border-amber-200 bg-amber-50/20"
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-gray-900 text-xl">{prescription.patientName}</h3>
                                                <StatusBadge status="on-hold" />
                                                {prescription.priority === "urgent" && (
                                                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                                                        URGENT
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                                                <div>
                                                    <div className="text-gray-500 mb-1">Rx ID</div>
                                                    <div className="font-semibold text-gray-900">{prescription.id}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-500 mb-1">Doctor</div>
                                                    <div className="font-medium text-gray-900">{prescription.doctorName}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-500 mb-1">Drugs</div>
                                                    <div className="font-medium text-gray-900">{prescription.drugCount} items</div>
                                                </div>
                                            </div>

                                            {/* Hold Reason */}
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${category.color}-100 border border-${category.color}-200 rounded-lg mb-3`}>
                                                <CategoryIcon className={`h-5 w-5 text-${category.color}-700`} />
                                                <div>
                                                    <div className={`text-xs font-semibold text-${category.color}-900 uppercase`}>
                                                        {category.label}
                                                    </div>
                                                    <div className={`text-sm text-${category.color}-800 font-medium`}>
                                                        {prescription.holdReason}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reminder */}
                                            {prescription.reminderTime && (
                                                <div className={`flex items-center gap-2 text-sm ${isOverdue ? "text-red-700" : "text-gray-600"}`}>
                                                    <FiClock className="h-4 w-4" />
                                                    <span className="font-medium">
                                                        {isOverdue ? "Overdue" : `Reminder ${formatTime(prescription.reminderTime)}`}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {prescription.notes && (
                                                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                    <p className="text-sm text-gray-700">
                                                        <span className="font-semibold">Notes:</span> {prescription.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 ml-6">
                                            <Link
                                                href={`/prescriptions/on-hold/${prescription.id}`}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center whitespace-nowrap"
                                            >
                                                View Details
                                            </Link>
                                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap" disabled={isLoading}>
                                                <FiPlay className="h-4 w-4" />
                                                Resume
                                            </button>
                                            <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors whitespace-nowrap" disabled={isLoading}>
                                                Add Note
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {prescriptions.length === 0 && (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <FiPauseCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No prescriptions on hold</h3>
                            <p className="text-gray-600">All prescriptions are flowing smoothly through the pipeline</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

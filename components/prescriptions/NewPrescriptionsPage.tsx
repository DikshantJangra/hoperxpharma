"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiUpload, FiPlus } from "react-icons/fi";
import PrescriptionFilters from "@/components/prescriptions/PrescriptionFilters";
import type { PrescriptionStatus } from "@/components/prescriptions/StatusBadge";

interface Prescription {
    id: string;
    patientName: string;
    doctorName: string;
    date: Date;
    status: PrescriptionStatus;
    drugCount: number;
    priority: "normal" | "urgent";
    imageUrl?: string;
    needsVerification: boolean;
}

export default function NewPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const urgentCount = prescriptions.filter(p => p.priority === "urgent").length;
    const needsVerificationCount = prescriptions.filter(p => p.needsVerification).length;

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
                            <h1 className="text-2xl font-bold text-gray-900">New Prescriptions</h1>
                            <p className="text-sm text-gray-500">Intake center for all new prescriptions</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            {urgentCount > 0 && (
                                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                                    <span className="text-sm text-gray-600">Urgent:</span>
                                    <span className="ml-2 font-bold text-red-700">{urgentCount}</span>
                                </div>
                            )}
                            {needsVerificationCount > 0 && (
                                <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                    <span className="text-sm text-gray-600">Needs Verification:</span>
                                    <span className="ml-2 font-bold text-amber-700">{needsVerificationCount}</span>
                                </div>
                            )}
                        </div>

                        <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <FiUpload className="h-4 w-4" />
                            Upload Prescription
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Filters */}
                <PrescriptionFilters />

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">Fetching new prescriptions...</p>
                        <p className="text-sm text-gray-400 mt-1">Checking for incoming Rx</p>
                    </div>
                ) : (
                    <>
                        {/* Prescriptions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {prescriptions.map((prescription) => (
                                <div
                                    key={prescription.id}
                                    className={`bg-white border-2 rounded-xl p-5 hover:shadow-lg transition-all group ${prescription.priority === "urgent"
                                        ? "border-red-200 bg-red-50/30"
                                        : "border-gray-200"
                                        }`}
                                >
                                    {/* Image Preview */}
                                    <div className="relative bg-gray-100 rounded-lg aspect-[4/3] flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors cursor-pointer">
                                        <FiUpload className="h-12 w-12 text-gray-400" />
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            {prescription.priority === "urgent" && (
                                                <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                                                    URGENT
                                                </span>
                                            )}
                                            {prescription.needsVerification && (
                                                <span className="px-2 py-1 bg-amber-600 text-white text-xs font-bold rounded-full">
                                                    VERIFY
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="mb-4">
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                                            {prescription.patientName}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">Rx #{prescription.id}</p>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Dr. {prescription.doctorName}</span>
                                            <span className="text-gray-500">{formatDate(prescription.date)}</span>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-700">
                                            <span className="font-medium">{prescription.drugCount}</span> {prescription.drugCount === 1 ? "drug" : "drugs"}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/prescriptions/new/${prescription.id}`}
                                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                                        >
                                            View Details
                                        </Link>
                                        <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                                            Quick Verify
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {prescriptions.length === 0 && (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                    <FiPlus className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No new prescriptions</h3>
                                <p className="text-gray-600 mb-6">Upload a prescription to get started</p>
                                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                                    <FiUpload className="h-5 w-5" />
                                    Upload Prescription
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

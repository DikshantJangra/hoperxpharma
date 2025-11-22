"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiSmartphone, FiShield, FiCheckCircle, FiZap } from "react-icons/fi";
import StatusBadge from "@/components/prescriptions/StatusBadge";
import PrescriptionFilters from "@/components/prescriptions/PrescriptionFilters";

interface ERxPrescription {
    id: string;
    patientName: string;
    doctorName: string;
    doctorLicense: string;
    date: Date;
    drugCount: number;
    verified: boolean;
    digitalSignature: boolean;
    source: string;
    priority: "normal" | "urgent";
}

// Mock data
const MOCK_ERX: ERxPrescription[] = [
    {
        id: "ERX001",
        patientName: "Rohit Malhotra",
        doctorName: "Dr. Kavita Iyer",
        doctorLicense: "MCI-12345",
        date: new Date(Date.now() - 1000 * 60 * 30),
        drugCount: 2,
        verified: true,
        digitalSignature: true,
        source: "Practo API",
        priority: "normal"
    },
    {
        id: "ERX002",
        patientName: "Sneha Kapoor",
        doctorName: "Dr. Arun Mehta",
        doctorLicense: "MCI-67890",
        date: new Date(Date.now() - 1000 * 60 * 90),
        drugCount: 3,
        verified: true,
        digitalSignature: true,
        source: "1mg API",
        priority: "urgent"
    },
    {
        id: "ERX003",
        patientName: "Manish Gupta",
        doctorName: "Dr. Ritu Sharma",
        doctorLicense: "MCI-54321",
        date: new Date(Date.now() - 1000 * 60 * 180),
        drugCount: 1,
        verified: true,
        digitalSignature: true,
        source: "PharmEasy API",
        priority: "normal"
    }
];

export default function ERxPrescriptionsPage() {
    const [prescriptions] = useState<ERxPrescription[]>(MOCK_ERX);

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const verifiedCount = prescriptions.filter(p => p.verified).length;
    const urgentCount = prescriptions.filter(p => p.priority === "urgent").length;

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
                                <FiSmartphone className="text-cyan-600" />
                                e-Rx Prescriptions
                            </h1>
                            <p className="text-sm text-gray-500">Digital prescriptions imported automatically via API</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                                <span className="text-sm text-gray-600">Verified:</span>
                                <span className="ml-2 font-bold text-green-700">{verifiedCount}/{prescriptions.length}</span>
                            </div>
                            {urgentCount > 0 && (
                                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                                    <span className="text-sm text-gray-600">Urgent:</span>
                                    <span className="ml-2 font-bold text-red-700">{urgentCount}</span>
                                </div>
                            )}
                        </div>

                        <button className="px-4 py-2.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors flex items-center gap-2">
                            <FiZap className="h-4 w-4" />
                            Sync Now
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Filters */}
                <PrescriptionFilters />

                {/* Info Banner */}
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <FiShield className="h-5 w-5 text-cyan-600 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-semibold text-cyan-900 mb-1">Digital Prescription Security</h3>
                        <p className="text-sm text-cyan-800">
                            All e-Rx prescriptions are automatically verified for authenticity using digital signatures and doctor license validation.
                        </p>
                    </div>
                </div>

                {/* Prescriptions List */}
                <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                        <div
                            key={prescription.id}
                            className={`bg-white border-2 rounded-xl p-6 hover:shadow-md transition-all ${prescription.priority === "urgent"
                                    ? "border-red-200 bg-red-50/30"
                                    : "border-cyan-200 bg-cyan-50/20"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                {/* Left: Details */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="font-bold text-gray-900 text-xl">{prescription.patientName}</h3>
                                        <StatusBadge status="e-rx" />
                                        {prescription.verified && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                <FiCheckCircle className="h-3 w-3" />
                                                Verified
                                            </span>
                                        )}
                                        {prescription.digitalSignature && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                <FiShield className="h-3 w-3" />
                                                Signed
                                            </span>
                                        )}
                                        {prescription.priority === "urgent" && (
                                            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                                                URGENT
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                        <div>
                                            <div className="text-gray-500 mb-1">e-Rx ID</div>
                                            <div className="font-semibold text-gray-900">{prescription.id}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 mb-1">Doctor</div>
                                            <div className="font-medium text-gray-900">{prescription.doctorName}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 mb-1">License</div>
                                            <div className="font-medium text-gray-900 font-mono text-xs">{prescription.doctorLicense}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 mb-1">Received</div>
                                            <div className="font-medium text-gray-900">{formatTime(prescription.date)}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Drugs:</span>
                                            <span className="ml-2 font-semibold text-gray-900">{prescription.drugCount} items</span>
                                        </div>
                                        <div className="h-4 w-px bg-gray-300"></div>
                                        <div>
                                            <span className="text-gray-600">Source:</span>
                                            <span className="ml-2 font-medium text-cyan-700">{prescription.source}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex flex-col gap-2 ml-6">
                                    <Link
                                        href={`/prescriptions/e-rx/${prescription.id}`}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center whitespace-nowrap"
                                    >
                                        View Details
                                    </Link>
                                    <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors flex items-center gap-2 whitespace-nowrap">
                                        <FiZap className="h-4 w-4" />
                                        Direct Fill
                                    </button>
                                    <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors whitespace-nowrap">
                                        Verify License
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {prescriptions.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-100 rounded-full mb-4">
                            <FiSmartphone className="h-8 w-8 text-cyan-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No e-Rx prescriptions</h3>
                        <p className="text-gray-600 mb-6">Digital prescriptions will appear here automatically when received via API</p>
                        <button className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors inline-flex items-center gap-2">
                            <FiZap className="h-5 w-5" />
                            Configure API Integration
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiPackage, FiPrinter, FiSend, FiCheckCircle } from "react-icons/fi";
import StatusBadge from "@/components/prescriptions/StatusBadge";
import PrescriptionFilters from "@/components/prescriptions/PrescriptionFilters";

interface ReadyPrescription {
    id: string;
    patientName: string;
    patientPhone: string;
    doctorName: string;
    date: Date;
    drugCount: number;
    readyTime: Date;
    notified: boolean;
    billingReady: boolean;
}

const PrescriptionCardSkeleton = () => (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="h-4 bg-gray-100 rounded"></div>
                    <div className="h-4 bg-gray-100 rounded"></div>
                    <div className="h-4 bg-gray-100 rounded"></div>
                    <div className="h-4 bg-gray-100 rounded"></div>
                </div>
            </div>
            <div className="flex flex-col gap-2 ml-6">
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
    </div>
)

export default function ReadyPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<ReadyPrescription[]>([]);
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
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const notifiedCount = prescriptions.filter(p => p.notified).length;
    const pendingNotification = prescriptions.filter(p => !p.notified).length;

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
                                <FiPackage className="text-purple-600" />
                                Ready for Pickup
                            </h1>
                            <p className="text-sm text-gray-500">Filled prescriptions awaiting customer pickup</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                                <span className="text-sm text-gray-600">Notified:</span>
                                {isLoading ? (
                                    <span className="ml-2 font-bold text-green-700 animate-pulse w-4 h-4 bg-gray-200 rounded"></span>
                                ) : (
                                    <span className="ml-2 font-bold text-green-700">{notifiedCount}</span>
                                )}
                            </div>
                            {pendingNotification > 0 && (
                                <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                    <span className="text-sm text-gray-600">Pending:</span>
                                    {isLoading ? (
                                        <span className="ml-2 font-bold text-amber-700 animate-pulse w-4 h-4 bg-gray-200 rounded"></span>
                                    ) : (
                                        <span className="ml-2 font-bold text-amber-700">{pendingNotification}</span>
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
                        prescriptions.map((prescription) => (
                            <div
                                key={prescription.id}
                                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    {/* Left: Details */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="font-bold text-gray-900 text-xl">{prescription.patientName}</h3>
                                            <StatusBadge status="ready" />
                                            {prescription.billingReady && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                                    Billing Ready
                                                </span>
                                            )}
                                            {prescription.notified && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                                    Patient Notified
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                                            <div>
                                                <div className="text-gray-500 mb-1">Ready Since</div>
                                                <div className="font-medium text-gray-900">{formatTime(prescription.readyTime)}</div>
                                            </div>
                                        </div>

                                        <div className="mt-3 text-sm text-gray-600">
                                            <span className="font-medium">Phone:</span> {prescription.patientPhone}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-col gap-2 ml-6">
                                        <Link
                                            href={`/prescriptions/ready/${prescription.id}`}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center whitespace-nowrap"
                                        >
                                            View Details
                                        </Link>
                                        <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-2 whitespace-nowrap">
                                            <FiPrinter className="h-4 w-4" />
                                            Print Label
                                        </button>
                                        {!prescription.notified && (
                                            <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2 whitespace-nowrap">
                                                <FiSend className="h-4 w-4" />
                                                Notify Patient
                                            </button>
                                        )}
                                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap">
                                            <FiCheckCircle className="h-4 w-4" />
                                            Complete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                                <FiPackage className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No prescriptions ready</h3>
                            <p className="text-gray-600">Prescriptions will appear here once they're filled and ready for pickup</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

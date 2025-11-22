"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiArchive, FiDownload, FiRefreshCw, FiCalendar } from "react-icons/fi";
import StatusBadge from "@/components/prescriptions/StatusBadge";
import PrescriptionFilters from "@/components/prescriptions/PrescriptionFilters";

interface CompletedPrescription {
    id: string;
    patientName: string;
    doctorName: string;
    date: Date;
    completedDate: Date;
    drugCount: number;
    totalAmount: number;
    deliveryProof?: boolean;
}

const PrescriptionRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
        <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-200 rounded-lg ml-auto"></div></td>
    </tr>
)

export default function CompletedPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<CompletedPrescription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setPrescriptions([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, []);

    const totalRevenue = prescriptions.reduce((sum, p) => sum + p.totalAmount, 0);
    const withDeliveryProof = prescriptions.filter(p => p.deliveryProof).length;

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
                                <FiArchive className="text-gray-600" />
                                Completed Prescriptions
                            </h1>
                            <p className="text-sm text-gray-500">Historical archive and analytics</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <span className="text-sm text-gray-600">Total:</span>
                                {isLoading ? (
                                    <span className="ml-2 font-bold text-blue-700 animate-pulse w-4 h-4 bg-gray-200 rounded"></span>
                                ) : (
                                    <span className="ml-2 font-bold text-blue-700">{prescriptions.length}</span>
                                )}
                            </div>
                            <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                                <span className="text-sm text-gray-600">Revenue:</span>
                                {isLoading ? (
                                    <span className="ml-2 font-bold text-green-700 animate-pulse w-8 h-4 bg-gray-200 rounded"></span>
                                ) : (
                                    <span className="ml-2 font-bold text-green-700">₹{totalRevenue.toLocaleString()}</span>
                                )}
                            </div>
                        </div>

                        <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2" disabled={isLoading}>
                            <FiDownload className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Filters */}
                <PrescriptionFilters />

                {/* Prescriptions Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Rx ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Patient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Doctor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Drugs
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Completed
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <>
                                    <PrescriptionRowSkeleton/>
                                    <PrescriptionRowSkeleton/>
                                    <PrescriptionRowSkeleton/>
                                </>
                            ) : prescriptions.length > 0 ? (
                                prescriptions.map((prescription) => (
                                    <tr key={prescription.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900">{prescription.id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{prescription.patientName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">{prescription.doctorName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">{prescription.drugCount} items</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                {prescription.completedDate.toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900">₹{prescription.totalAmount}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status="completed" size="sm" />
                                                {prescription.deliveryProof && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                        Proof
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/prescriptions/completed/${prescription.id}`}
                                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                                                >
                                                    View
                                                </Link>
                                                <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors flex items-center gap-1">
                                                    <FiRefreshCw className="h-3 w-3" />
                                                    Refill
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <div className="text-center py-16">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                        <FiArchive className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed prescriptions</h3>
                                    <p className="text-gray-600">Completed prescriptions will appear here</p>
                                </div>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

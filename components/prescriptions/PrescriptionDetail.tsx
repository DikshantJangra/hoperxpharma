"use client";

import React from "react";
import Link from "next/link";
import StatusBadge, { PrescriptionStatus } from "./StatusBadge";
import DrugList from "./DrugList";
import {
    FiUser,
    FiCalendar,
    FiFileText,
    FiX,
    FiPrinter,
    FiShare2,
    FiCheckCircle,
    FiPackage,
    FiPauseCircle
} from "react-icons/fi";

interface Drug {
    id: string;
    name: string;
    dosage: string;
    quantity: number;
    instructions: string;
    stockAvailable: boolean;
    stockLevel?: "high" | "low" | "out";
}

interface PrescriptionDetailProps {
    id: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    patientPhone: string;
    doctorName: string;
    doctorSpecialty: string;
    doctorLicense: string;
    date: Date;
    status: PrescriptionStatus;
    drugs: Drug[];
    notes?: string;
    imageUrl?: string;
    priority?: "normal" | "urgent";
    holdReason?: string;
    onStatusChange?: (newStatus: PrescriptionStatus) => void;
    onClose?: () => void;
}

export default function PrescriptionDetail({
    id,
    patientName,
    patientAge,
    patientGender,
    patientPhone,
    doctorName,
    doctorSpecialty,
    doctorLicense,
    date,
    status,
    drugs,
    notes,
    imageUrl,
    priority = "normal",
    holdReason,
    onStatusChange,
    onClose
}: PrescriptionDetailProps) {
    const getActionButtons = () => {
        switch (status) {
            case "new":
                return (
                    <button
                        onClick={() => onStatusChange?.("verified")}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <FiCheckCircle className="h-5 w-5" />
                        Verify Prescription
                    </button>
                );
            case "verified":
                return (
                    <button
                        onClick={() => onStatusChange?.("ready")}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                        <FiPackage className="h-5 w-5" />
                        Mark as Ready
                    </button>
                );
            case "ready":
                return (
                    <button
                        onClick={() => onStatusChange?.("completed")}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <FiCheckCircle className="h-5 w-5" />
                        Complete Prescription
                    </button>
                );
            case "on-hold":
                return (
                    <button
                        onClick={() => onStatusChange?.("verified")}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                        Resume to Verified
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FiX className="h-5 w-5" />
                                </button>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    Prescription #{id}
                                    <StatusBadge status={status} size="md" />
                                    {priority === "urgent" && (
                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                                            URGENT
                                        </span>
                                    )}
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                                <FiPrinter className="h-4 w-4" />
                                Print
                            </button>
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                                <FiShare2 className="h-4 w-4" />
                                Share
                            </button>
                            {status !== "completed" && (
                                <button
                                    onClick={() => onStatusChange?.("on-hold")}
                                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors flex items-center gap-2"
                                >
                                    <FiPauseCircle className="h-4 w-4" />
                                    Hold
                                </button>
                            )}
                            {getActionButtons()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Hold Reason Alert */}
                        {holdReason && (
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
                                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                                    <FiPauseCircle className="h-5 w-5" />
                                    Prescription On Hold
                                </h3>
                                <p className="text-amber-800">{holdReason}</p>
                            </div>
                        )}

                        {/* Drugs Section */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FiFileText className="h-5 w-5 text-blue-600" />
                                Prescribed Medications ({drugs.length})
                            </h2>
                            <DrugList drugs={drugs} showStock={status !== "completed"} />
                        </div>

                        {/* Notes */}
                        {notes && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-3">Additional Notes</h2>
                                <p className="text-gray-700 leading-relaxed">{notes}</p>
                            </div>
                        )}

                        {/* Prescription Image */}
                        {imageUrl && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Prescription Image</h2>
                                <img
                                    src={imageUrl}
                                    alt="Prescription"
                                    className="w-full rounded-lg border border-gray-200"
                                />
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Patient Info */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FiUser className="h-5 w-5 text-blue-600" />
                                Patient Information
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Name</div>
                                    <div className="font-semibold text-gray-900">{patientName}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Age</div>
                                        <div className="font-medium text-gray-900">{patientAge} years</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Gender</div>
                                        <div className="font-medium text-gray-900">{patientGender}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Phone</div>
                                    <div className="font-medium text-gray-900">{patientPhone}</div>
                                </div>
                            </div>
                        </div>

                        {/* Doctor Info */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FiUser className="h-5 w-5 text-green-600" />
                                Prescriber Information
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Name</div>
                                    <div className="font-semibold text-gray-900">{doctorName}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Specialty</div>
                                    <div className="font-medium text-gray-900">{doctorSpecialty}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">License</div>
                                    <div className="font-medium text-gray-900 font-mono text-sm">{doctorLicense}</div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FiCalendar className="h-5 w-5 text-purple-600" />
                                Timeline
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">Prescription Created</div>
                                        <div className="text-xs text-gray-500">{date.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

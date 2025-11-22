"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiMessageSquare, FiDollarSign } from "react-icons/fi";
import StepIndicator from "@/components/dispense/StepIndicator";
import ChecklistPanel, { ChecklistItem } from "@/components/dispense/ChecklistPanel";

const INITIAL_CHECKLIST: ChecklistItem[] = [
    {
        id: "patient_identity",
        label: "Patient identity confirmed",
        required: true,
        completed: false,
        description: "Verify name and DOB before handover"
    },
    {
        id: "medication_explained",
        label: "Medication name and purpose explained",
        required: true,
        completed: false
    },
    {
        id: "dosage_instructions",
        label: "Dosage and timing instructions given",
        required: true,
        completed: false
    },
    {
        id: "side_effects",
        label: "Side effects discussed",
        required: true,
        completed: false
    },
    {
        id: "storage",
        label: "Storage instructions provided",
        required: true,
        completed: false
    },
    {
        id: "questions_answered",
        label: "Questions answered",
        required: true,
        completed: false
    },
    {
        id: "understanding_confirmed",
        label: "Patient understanding confirmed",
        required: true,
        completed: false
    },
    {
        id: "signature_obtained",
        label: "Patient signature obtained",
        required: true,
        completed: false
    }
];

export default function ReleasePage() {
    const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
    const [signatureCaptured, setSignatureCaptured] = useState(false);

    const handleChecklistToggle = (itemId: string) => {
        setChecklist(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
            )
        );
    };

    const handleCaptureSignature = () => {
        setSignatureCaptured(true);
        setChecklist(prev =>
            prev.map(item =>
                item.id === "signature_obtained" ? { ...item, completed: true } : item
            )
        );
    };

    const handleComplete = () => {
        alert("Prescription dispensed successfully! 🎉\nPatient counseling documented.");
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <Link
                            href="/dispense"
                            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FiArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">Dispense - Release</h1>
                            <p className="text-sm text-gray-500">Patient counseling and final handover</p>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <StepIndicator currentStep="release" completedSteps={["intake", "verify", "fill", "label", "check"]} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Patient Identification */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Patient Identification</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Patient Name
                                    </label>
                                    <div className="text-lg font-semibold text-gray-900">-</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date of Birth
                                    </label>
                                    <div className="text-lg font-semibold text-gray-900">-</div>
                                </div>
                            </div>
                            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                Confirm Patient Identity
                            </button>
                        </div>

                        {/* Counseling Points */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FiMessageSquare className="h-5 w-5 text-emerald-600" />
                                Patient Counseling Points
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="font-semibold text-blue-900 mb-2">Medication Information</h4>
                                    <p className="text-sm text-blue-800">
                                        No medication information available
                                    </p>
                                </div>

                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="font-semibold text-green-900 mb-2">Dosage Instructions</h4>
                                    <p className="text-sm text-green-800">
                                        No dosage instructions available
                                    </p>
                                </div>

                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <h4 className="font-semibold text-amber-900 mb-2">Important Warnings</h4>
                                    <p className="text-sm text-amber-800">
                                        No warnings available
                                    </p>
                                </div>

                                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <h4 className="font-semibold text-purple-900 mb-2">Storage</h4>
                                    <p className="text-sm text-purple-800">
                                        No storage instructions available
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Signature Capture */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Patient Signature</h3>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 bg-gray-50 text-center">
                                {signatureCaptured ? (
                                    <div className="text-green-700 flex flex-col items-center gap-2">
                                        <FiCheckCircle className="h-12 w-12" />
                                        <p className="font-semibold">Signature Captured</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Signature pad area</p>
                                )}
                            </div>
                            <button
                                onClick={handleCaptureSignature}
                                disabled={signatureCaptured}
                                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {signatureCaptured ? "Signature Captured" : "Capture Signature"}
                            </button>
                        </div>

                        {/* Payment & Notification */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Payment & Notification</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Link
                                    href="/billing"
                                    className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiDollarSign className="h-4 w-4" />
                                    Process Payment
                                </Link>
                                <button className="px-4 py-3 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors">
                                    Send WhatsApp Receipt
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Checklist */}
                    <div>
                        <ChecklistPanel
                            title="Patient Counseling Checklist"
                            items={checklist}
                            onItemToggle={handleChecklistToggle}
                            onComplete={handleComplete}
                            canComplete={signatureCaptured}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

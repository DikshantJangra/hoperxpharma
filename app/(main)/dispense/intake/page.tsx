"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiUpload, FiUser, FiShield } from "react-icons/fi";
import StepIndicator from "@/components/dispense/StepIndicator";
import ChecklistPanel, { ChecklistItem } from "@/components/dispense/ChecklistPanel";
import BarcodeScanner from "@/components/dispense/BarcodeScanner";

const INITIAL_CHECKLIST: ChecklistItem[] = [
    {
        id: "legibility",
        label: "Prescription legibility confirmed",
        required: true,
        completed: false,
        description: "Verify all text is clear and readable"
    },
    {
        id: "patient",
        label: "Patient identity verified",
        required: true,
        completed: false,
        description: "Confirm patient name, DOB, and contact information"
    },
    {
        id: "insurance",
        label: "Insurance coverage checked",
        required: true,
        completed: false,
        description: "Verify active coverage and benefits"
    },
    {
        id: "completeness",
        label: "Prescription completeness validated",
        required: true,
        completed: false,
        description: "All required fields present (drug, dose, quantity, prescriber)"
    },
    {
        id: "assigned",
        label: "Assigned to pharmacist for verification",
        required: true,
        completed: false
    }
];

export default function IntakePage() {
    const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
    const [prescriptionScanned, setPrescriptionScanned] = useState(false);

    const handleChecklistToggle = (itemId: string) => {
        setChecklist(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
            )
        );
    };

    const handleBarcodeScanned = (value: string, isMatch: boolean) => {
        setPrescriptionScanned(isMatch);
    };

    const handleComplete = () => {
        // Move to verify step
        alert("Prescription moved to Verification queue");
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
                            <h1 className="text-2xl font-bold text-gray-900">Dispense - Intake</h1>
                            <p className="text-sm text-gray-500">Receive and register prescriptions</p>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <StepIndicator currentStep="intake" completedSteps={[]} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Prescription Scan */}
                        <BarcodeScanner
                            label="Scan Prescription Barcode"
                            placeholder="Scan or enter prescription ID..."
                            onScan={handleBarcodeScanned}
                        />

                        {/* Patient Information */}
                        {prescriptionScanned && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FiUser className="h-5 w-5 text-blue-600" />
                                    Patient Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Patient Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter patient name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="Enter phone number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Insurance ID
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter insurance ID"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Priority Selection */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priority Level
                                    </label>
                                    <div className="flex gap-3">
                                        <label className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                                            <input type="radio" name="priority" value="normal" defaultChecked />
                                            <span className="font-medium">Normal</span>
                                        </label>
                                        <label className="flex items-center gap-2 px-4 py-2 border-2 border-red-300 rounded-lg cursor-pointer hover:border-red-500">
                                            <input type="radio" name="priority" value="urgent" />
                                            <span className="font-medium text-red-700">Urgent</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Controlled Substance Flag */}
                                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-purple-600 rounded" />
                                        <div className="flex items-center gap-2">
                                            <FiShield className="h-5 w-5 text-purple-600" />
                                            <span className="font-semibold text-purple-900">
                                                Controlled Substance
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Checklist */}
                    <div>
                        <ChecklistPanel
                            title="Intake Checklist"
                            items={checklist}
                            onItemToggle={handleChecklistToggle}
                            onComplete={handleComplete}
                            canComplete={prescriptionScanned}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

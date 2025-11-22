"use client";

import React from "react";
import { FiUser, FiFileText, FiPackage } from "react-icons/fi";
import { DispenseStep } from "./QueueTabs";
import BarcodeScanner from "./BarcodeScanner";
import SafetyAlerts, { SafetyAlert } from "./SafetyAlerts";

interface Prescription {
    id: string;
    rxId: string;
    patientName: string;
    patientDOB: string;
    patientPhone: string;
    doctorName: string;
    drugs: Array<{
        name: string;
        dosage: string;
        quantity: string;
        instructions: string;
    }>;
    priority: "normal" | "urgent";
    isControlled?: boolean;
}

interface DispenseDetailPanelProps {
    step: DispenseStep;
    prescription: Prescription | null;
    onAction: (action: string, data?: any) => void;
}

export default function DispenseDetailPanel({ step, prescription, onAction }: DispenseDetailPanelProps) {
    if (!prescription) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <FiFileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No prescription selected</p>
                    <p className="text-sm mt-2">Select a prescription from the queue to begin</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-white">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{prescription.patientName}</h2>
                        <p className="text-sm text-gray-600 mt-1">Rx #{prescription.rxId}</p>
                    </div>
                    <div className="flex gap-2">
                        {prescription.priority === "urgent" && (
                            <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-lg">
                                URGENT
                            </span>
                        )}
                        {prescription.isControlled && (
                            <span className="px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-lg">
                                CONTROLLED
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
                {/* Patient Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUser className="h-5 w-5 text-blue-600" />
                        Patient Information
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <div className="text-gray-500 mb-1">Date of Birth</div>
                            <div className="font-semibold text-gray-900">{prescription.patientDOB}</div>
                        </div>
                        <div>
                            <div className="text-gray-500 mb-1">Phone</div>
                            <div className="font-medium text-gray-900">{prescription.patientPhone}</div>
                        </div>
                        <div>
                            <div className="text-gray-500 mb-1">Prescriber</div>
                            <div className="font-medium text-gray-900">{prescription.doctorName}</div>
                        </div>
                    </div>
                </div>

                {/* Medications */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FiPackage className="h-5 w-5 text-cyan-600" />
                        Medications ({prescription.drugs.length})
                    </h3>
                    <div className="space-y-3">
                        {prescription.drugs.map((drug, index) => (
                            <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="font-semibold text-gray-900 mb-1">{drug.name}</div>
                                <div className="text-sm text-gray-700 mb-2">{drug.instructions}</div>
                                <div className="text-sm text-gray-600">Quantity: {drug.quantity}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step-Specific Content */}
                {renderStepContent(step, prescription, onAction)}
            </div>

            {/* Action Bar */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                {renderActionBar(step, onAction)}
            </div>
        </div>
    );
}

function renderStepContent(step: DispenseStep, prescription: Prescription, onAction: (action: string, data?: any) => void) {
    switch (step) {
        case "intake":
            return (
                <BarcodeScanner
                    label="Scan Prescription Barcode"
                    placeholder="Scan or enter prescription ID..."
                    onScan={(value, isMatch) => onAction("barcode_scanned", { value, isMatch })}
                />
            );

        case "verify":
            const mockAlerts: SafetyAlert[] = [
                {
                    id: "alert1",
                    type: "interaction",
                    severity: "warning",
                    title: "Potential Drug Interaction",
                    message: "Warfarin + Aspirin: Increased risk of bleeding. Monitor INR levels closely.",
                    recommendation: "Consider alternative antiplatelet therapy or adjust Warfarin dosage.",
                    canOverride: true
                }
            ];
            return <SafetyAlerts alerts={mockAlerts} />;

        case "fill":
            return (
                <BarcodeScanner
                    label="Scan Drug Barcode"
                    placeholder="Scan drug package barcode..."
                    expectedValue="DRUG-12345"
                    onScan={(value, isMatch) => onAction("drug_scanned", { value, isMatch })}
                />
            );

        case "label":
            return (
                <div className="bg-white border-2 border-gray-300 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Label Preview</h3>
                    <div className="border-4 border-black p-6 bg-white font-mono text-sm space-y-3">
                        <div className="text-center border-b-2 border-black pb-2 mb-3">
                            <div className="font-bold text-lg">HOPE RX PHARMACY</div>
                        </div>
                        <div><span className="font-bold">Patient:</span> {prescription.patientName}</div>
                        <div><span className="font-bold">Rx #:</span> {prescription.rxId}</div>
                        <div className="border-t-2 border-black pt-3 mt-3">
                            <div className="font-bold text-base mb-2">{prescription.drugs[0].name}</div>
                            <div className="bg-yellow-100 border-2 border-yellow-600 p-2">
                                <div className="font-bold">DIRECTIONS:</div>
                                <div>{prescription.drugs[0].instructions}</div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case "check":
            return (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-4">Final Verification</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase">Original Prescription</h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <div className="text-gray-500">Drug</div>
                                    <div className="font-semibold">{prescription.drugs[0].name}</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase">Dispensed Medication</h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <div className="text-gray-500">Drug</div>
                                    <div className="font-semibold text-green-700">{prescription.drugs[0].name} ✓</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case "release":
            return (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-bold text-blue-900 mb-4">Patient Counseling</h3>
                    <div className="space-y-3 text-sm">
                        <div className="p-3 bg-white border border-blue-200 rounded-lg">
                            <div className="font-semibold text-blue-900 mb-1">Medication Information</div>
                            <p className="text-blue-800">Explain medication name and purpose to patient</p>
                        </div>
                        <div className="p-3 bg-white border border-blue-200 rounded-lg">
                            <div className="font-semibold text-blue-900 mb-1">Dosage Instructions</div>
                            <p className="text-blue-800">Review timing and frequency with patient</p>
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
    }
}

function renderActionBar(step: DispenseStep, onAction: (action: string) => void) {
    const actionConfig: Record<DispenseStep, { primary: string; secondary?: string }> = {
        intake: { primary: "Assign to Verify", secondary: "Reject" },
        verify: { primary: "Approve & Move to Fill", secondary: "Reject" },
        fill: { primary: "Complete Fill & Move to Label", secondary: "Out of Stock" },
        label: { primary: "Print & Move to Check", secondary: "Edit Label" },
        check: { primary: "Approve & Move to Release", secondary: "Reject & Return" },
        release: { primary: "Complete & Dispense", secondary: "Send Notification" }
    };

    const config = actionConfig[step];

    return (
        <div className="flex gap-3">
            {config.secondary && (
                <button
                    onClick={() => onAction("secondary")}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                    {config.secondary}
                </button>
            )}
            <button
                onClick={() => onAction("primary")}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
                {config.primary}
                <kbd className="px-2 py-1 bg-blue-700 rounded text-xs">⌘↵</kbd>
            </button>
        </div>
    );
}

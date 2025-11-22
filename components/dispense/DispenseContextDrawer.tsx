"use client";

import React, { useState } from "react";
import { FiX, FiCheck, FiSquare, FiCheckSquare, FiClock, FiUser } from "react-icons/fi";
import { DispenseStep } from "./QueueTabs";

interface ChecklistItem {
    id: string;
    label: string;
    completed: boolean;
}

interface DispenseContextDrawerProps {
    prescription: any;
    step: DispenseStep;
    isOpen: boolean;
    onClose: () => void;
}

const STEP_CHECKLISTS: Record<DispenseStep, ChecklistItem[]> = {
    intake: [
        { id: "legibility", label: "Prescription legibility confirmed", completed: false },
        { id: "patient", label: "Patient identity verified", completed: false },
        { id: "insurance", label: "Insurance coverage checked", completed: false },
        { id: "completeness", label: "Prescription completeness validated", completed: false }
    ],
    verify: [
        { id: "right_patient", label: "Right Patient - Identity confirmed", completed: false },
        { id: "right_medicine", label: "Right Medicine - Drug verified", completed: false },
        { id: "right_dose", label: "Right Dose - Dosage appropriate", completed: false },
        { id: "right_route", label: "Right Route - Administration correct", completed: false },
        { id: "right_time", label: "Right Time - Frequency validated", completed: false },
        { id: "interactions", label: "No contraindications or interactions", completed: false },
        { id: "allergies", label: "Allergies checked", completed: false }
    ],
    fill: [
        { id: "drug_selected", label: "Correct drug selected (barcode verified)", completed: false },
        { id: "batch_selected", label: "Correct batch selected (expiry checked)", completed: false },
        { id: "quantity_counted", label: "Correct quantity counted", completed: false },
        { id: "stock_updated", label: "Stock updated", completed: false }
    ],
    label: [
        { id: "patient_name", label: "Patient name correct", completed: false },
        { id: "drug_name", label: "Drug name and strength correct", completed: false },
        { id: "dosage_instructions", label: "Dosage instructions clear", completed: false },
        { id: "warnings", label: "Warnings applied", completed: false },
        { id: "label_printed", label: "Label printed and applied", completed: false }
    ],
    check: [
        { id: "medication_matches", label: "Medication matches prescription", completed: false },
        { id: "quantity_correct", label: "Quantity correct", completed: false },
        { id: "label_accurate", label: "Label accurate and legible", completed: false },
        { id: "physical_appearance", label: "Physical appearance normal", completed: false },
        { id: "barcode_verified", label: "Barcode verification passed", completed: false }
    ],
    release: [
        { id: "patient_identity", label: "Patient identity confirmed", completed: false },
        { id: "medication_explained", label: "Medication name and purpose explained", completed: false },
        { id: "dosage_instructions", label: "Dosage and timing instructions given", completed: false },
        { id: "side_effects", label: "Side effects discussed", completed: false },
        { id: "storage", label: "Storage instructions provided", completed: false },
        { id: "signature_obtained", label: "Patient signature obtained", completed: false }
    ]
};

export default function DispenseContextDrawer({ prescription, step, isOpen, onClose }: DispenseContextDrawerProps) {
    const [checklist, setChecklist] = useState(STEP_CHECKLISTS[step]);

    const toggleItem = (id: string) => {
        setChecklist(prev =>
            prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
        );
    };

    const completedCount = checklist.filter(item => item.completed).length;
    const totalCount = checklist.length;

    if (!isOpen) return null;

    return (
        <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Context</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FiX className="h-5 w-5 text-gray-600" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Checklist */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm uppercase">Checklist</h4>
                        <span className="text-sm">
                            <span className="font-bold text-blue-700">{completedCount}</span>
                            <span className="text-gray-500">/{totalCount}</span>
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all"
                                style={{ width: `${(completedCount / totalCount) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Checklist Items */}
                    <div className="space-y-2">
                        {checklist.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${item.completed
                                        ? "bg-green-50 border-green-200"
                                        : "bg-white border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <div className="mt-0.5">
                                    {item.completed ? (
                                        <FiCheckSquare className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <FiSquare className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                                <span
                                    className={`text-sm ${item.completed ? "text-green-900 line-through" : "text-gray-900"
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Patient History */}
                {prescription && (
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm uppercase mb-3">
                            Patient History
                        </h4>
                        <div className="space-y-3">
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <FiClock className="h-4 w-4" />
                                    <span>Last Visit: 2 weeks ago</span>
                                </div>
                                <div className="text-sm text-gray-900">
                                    Previous Rx: Metformin 500mg, Lisinopril 10mg
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="text-sm font-semibold text-blue-900 mb-1">Known Allergies</div>
                                <div className="text-sm text-blue-800">Penicillin, Sulfa drugs</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <h4 className="font-semibold text-gray-900 text-sm uppercase mb-3">Notes</h4>
                    <textarea
                        placeholder="Add notes about this prescription..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={4}
                    />
                </div>
            </div>
        </div>
    );
}

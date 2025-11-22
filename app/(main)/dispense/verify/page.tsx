"use client";

import { useState } from "react";
import { FiAlertTriangle, FiCheck, FiX, FiArrowRight } from "react-icons/fi";

export default function VerifyPage() {
    const [checklist, setChecklist] = useState({
        identity: false,
        validity: false,
        dosage: false,
        interactions: false,
        allergies: false,
        quantity: false,
        refills: false,
        insurance: false
    });

    const allChecked = Object.values(checklist).every(v => v);

    const interactions: any[] = [];

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Prescription Verification</h1>
                <p className="text-sm text-[#64748b]">Verify prescription accuracy and patient safety</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Prescription Details (50%) */}
                <div className="w-1/2 border-r border-[#e2e8f0] overflow-y-auto p-6">
                    <div className="max-w-2xl space-y-6">
                        {/* Patient Allergies Alert */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <FiAlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-red-900 mb-1">Patient Allergies</h3>
                                    <p className="text-red-700">None</p>
                                </div>
                            </div>
                        </div>

                        {/* Patient Info */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Patient Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-[#64748b]">Name</div>
                                    <div className="font-medium text-[#0f172a]">-</div>
                                </div>
                                <div>
                                    <div className="text-sm text-[#64748b]">DOB</div>
                                    <div className="font-medium text-[#0f172a]">-</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-sm text-[#64748b] mb-2">Current Medications</div>
                                    <div className="text-sm text-[#64748b]">None</div>
                                </div>
                            </div>
                        </div>

                        {/* Prescription */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Prescription Details</h2>
                            <div className="p-4 bg-[#f8fafc] rounded-lg">
                                <div className="text-center py-4 text-gray-500">No prescription details available</div>
                            </div>
                        </div>

                        {/* Drug Interactions */}
                        {interactions.length > 0 && (
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                                <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                    <FiAlertTriangle className="w-5 h-5" />
                                    Drug Interactions Detected
                                </h3>
                                {interactions.map((interaction, idx) => (
                                    <div key={idx} className="p-3 bg-white rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-[#0f172a]">{interaction.drug}</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${interaction.severity === "critical" ? "bg-red-100 text-red-700" :
                                                    interaction.severity === "moderate" ? "bg-amber-100 text-amber-700" :
                                                        "bg-blue-100 text-blue-700"
                                                }`}>
                                                {interaction.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#64748b]">{interaction.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Verification Checklist (50%) */}
                <div className="w-1/2 overflow-y-auto p-6">
                    <div className="max-w-2xl space-y-6">
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Verification Checklist</h2>
                            <div className="space-y-3">
                                {[
                                    { key: "identity", label: "Patient identity confirmed" },
                                    { key: "validity", label: "Prescription is valid (not expired)" },
                                    { key: "dosage", label: "Dosage is appropriate for patient" },
                                    { key: "interactions", label: "No critical drug-drug interactions" },
                                    { key: "allergies", label: "No drug-allergy interactions" },
                                    { key: "quantity", label: "Quantity is reasonable" },
                                    { key: "refills", label: "Refills are valid" },
                                    { key: "insurance", label: "Insurance approved (if applicable)" }
                                ].map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-lg cursor-pointer hover:bg-[#f1f5f9] transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={checklist[key as keyof typeof checklist]}
                                            onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                                            className="w-5 h-5 rounded border-[#cbd5e1] text-[#0ea5a3] focus:ring-[#0ea5a3]"
                                        />
                                        <span className="text-[#0f172a]">{label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-blue-900">Progress</span>
                                    <span className="text-sm font-bold text-blue-900">
                                        {Object.values(checklist).filter(v => v).length}/8
                                    </span>
                                </div>
                                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${(Object.values(checklist).filter(v => v).length / 8) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                disabled={!allChecked}
                                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${allChecked
                                        ? "bg-[#0ea5a3] text-white hover:bg-[#0d9391]"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                <FiCheck className="w-5 h-5" />
                                Approve & Move to Fill
                                <FiArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex-1 px-6 py-3 border-2 border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                                <FiX className="w-5 h-5" />
                                Reject & Return to Doctor
                            </button>
                            <button className="flex-1 px-6 py-3 border-2 border-amber-300 text-amber-700 rounded-lg font-semibold hover:bg-amber-50 transition-colors">
                                Hold for Clarification
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

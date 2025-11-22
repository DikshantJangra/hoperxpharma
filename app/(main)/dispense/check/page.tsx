"use client";

import { useState } from "react";
import { FiCheck, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import { IoBarcodeOutline } from "react-icons/io5";

export default function CheckPage() {
    const [checklist, setChecklist] = useState({
        medication: false,
        strength: false,
        quantity: false,
        labelAccurate: false,
        labelLegible: false,
        auxiliaryLabels: false,
        container: false,
        counselingNoted: false
    });

    const [barcodeVerified, setBarcodeVerified] = useState(false);
    const allChecked = Object.values(checklist).every(v => v) && barcodeVerified;

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Final Verification</h1>
                <p className="text-sm text-[#64748b]">Pharmacist final check before dispensing</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: What Was Filled (50%) */}
                <div className="w-1/2 border-r border-[#e2e8f0] overflow-y-auto p-6">
                    <div className="max-w-2xl space-y-6">
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Medication Filled</h2>

                            <div className="flex items-center justify-center p-6 bg-[#f8fafc] rounded-lg mb-4">
                                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-400 text-sm">Medication Image</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-sm text-[#64748b]">Drug Name</div>
                                        <div className="font-semibold text-[#0f172a]">Warfarin 5mg</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">NDC</div>
                                        <div className="font-mono text-[#0f172a]">00093-0058-01</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Lot Number</div>
                                        <div className="font-mono text-[#0f172a]">LOT12345</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Expiry Date</div>
                                        <div className="font-medium text-[#0f172a]">12/31/2025</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Quantity Filled</div>
                                        <div className="font-semibold text-[#0ea5a3]">30 tablets</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Manufacturer</div>
                                        <div className="text-[#0f172a]">Teva Pharmaceuticals</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Barcode Re-verification</h2>

                            <div className="relative mb-4">
                                <IoBarcodeOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-[#64748b]" />
                                <input
                                    type="text"
                                    placeholder="Scan medication barcode to verify..."
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            setBarcodeVerified(true);
                                        }
                                    }}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-[#0ea5a3] rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                />
                            </div>

                            {barcodeVerified && (
                                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-center gap-3">
                                    <FiCheck className="w-6 h-6 text-green-600" />
                                    <div>
                                        <div className="font-semibold text-green-900">Barcode Verified</div>
                                        <div className="text-sm text-green-700">Medication matches prescription</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="font-semibold text-blue-900 mb-3">Counseling Points</h3>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li>• Monitor INR levels regularly</li>
                                <li>• Avoid foods high in vitamin K</li>
                                <li>• Report any unusual bleeding or bruising</li>
                                <li>• Take at the same time each day</li>
                                <li>• Do not stop without consulting doctor</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right: Final Checklist (50%) */}
                <div className="w-1/2 overflow-y-auto p-6">
                    <div className="max-w-2xl space-y-6">
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Final Checklist</h2>

                            <div className="space-y-3">
                                {[
                                    { key: "medication", label: "Correct medication (visual + NDC match)" },
                                    { key: "strength", label: "Correct strength" },
                                    { key: "quantity", label: "Correct quantity" },
                                    { key: "labelAccurate", label: "Label is accurate" },
                                    { key: "labelLegible", label: "Label is legible" },
                                    { key: "auxiliaryLabels", label: "Auxiliary labels applied" },
                                    { key: "container", label: "Container is appropriate" },
                                    { key: "counselingNoted", label: "Patient counseling points noted" }
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

                        {!barcodeVerified && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                                <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-800">
                                    <div className="font-semibold mb-1">Barcode verification required</div>
                                    <div>Please scan the medication barcode to verify before proceeding</div>
                                </div>
                            </div>
                        )}

                        <button
                            disabled={!allChecked}
                            className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${allChecked
                                    ? "bg-[#0ea5a3] text-white hover:bg-[#0d9391]"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            <FiCheck className="w-5 h-5" />
                            Approve & Move to Dispense
                            <FiArrowRight className="w-5 h-5" />
                        </button>

                        <button className="w-full px-6 py-3 border-2 border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors">
                            Return to Fill (Error Found)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

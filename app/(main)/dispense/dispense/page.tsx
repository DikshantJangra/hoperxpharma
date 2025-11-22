"use client";

import { useState } from "react";
import { FiCheck, FiDollarSign, FiPrinter, FiSend } from "react-icons/fi";

export default function DispensePage() {
    const [workflow, setWorkflow] = useState({
        identityVerified: false,
        counselingProvided: false,
        paymentCollected: false,
        medicationHanded: false,
        acknowledgment: false
    });

    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [signature, setSignature] = useState(false);

    const allComplete = Object.values(workflow).every(v => v);
    const copayAmount = 150;

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Dispense to Patient</h1>
                <p className="text-sm text-[#64748b]">Final handoff and patient counseling</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Patient Verification (40%) */}
                <div className="w-2/5 border-r border-[#e2e8f0] overflow-y-auto p-6 bg-white">
                    <div className="space-y-6">
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Patient Information</h2>

                            <div className="flex items-center justify-center p-6 bg-[#f8fafc] rounded-lg mb-4">
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-gray-400 text-sm">Photo</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm text-[#64748b]">Name</div>
                                    <div className="font-semibold text-[#0f172a] text-lg">-</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-sm text-[#64748b]">DOB</div>
                                        <div className="font-medium text-[#0f172a]">-</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Age</div>
                                        <div className="font-medium text-[#0f172a]">-</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-[#64748b]">Phone</div>
                                    <div className="font-medium text-[#0f172a]">-</div>
                                </div>
                                <div>
                                    <div className="text-sm text-[#64748b]">Address</div>
                                    <div className="text-[#0f172a]">-</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                            <h3 className="font-semibold text-red-900 mb-2">Allergies</h3>
                            <div className="text-red-700">No allergies recorded</div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">Current Medications</h3>
                            <div className="text-sm text-blue-800">No current medications</div>
                        </div>
                    </div>
                </div>

                {/* Right: Dispensing Workflow (60%) */}
                <div className="w-3/5 overflow-y-auto p-6">
                    <div className="max-w-3xl space-y-6">
                        {/* Step 1: Verify Identity */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Step 1: Verify Patient Identity</h2>
                            <p className="text-sm text-[#64748b] mb-4">Ask for government-issued ID and confirm name and date of birth</p>
                            <label className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-lg cursor-pointer hover:bg-[#f1f5f9] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={workflow.identityVerified}
                                    onChange={(e) => setWorkflow({ ...workflow, identityVerified: e.target.checked })}
                                    className="w-6 h-6 rounded border-[#cbd5e1] text-[#0ea5a3] focus:ring-[#0ea5a3]"
                                />
                                <span className="font-medium text-[#0f172a]">Identity verified (ID checked)</span>
                            </label>
                        </div>

                        {/* Step 2: Medication Counseling */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Step 2: Medication Counseling</h2>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                <h3 className="font-semibold text-blue-900 mb-3">Key Counseling Points</h3>
                                <div className="text-sm text-blue-800">No counseling points available</div>
                            </div>

                            <label className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-lg cursor-pointer hover:bg-[#f1f5f9] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={workflow.counselingProvided}
                                    onChange={(e) => setWorkflow({ ...workflow, counselingProvided: e.target.checked })}
                                    className="w-6 h-6 rounded border-[#cbd5e1] text-[#0ea5a3] focus:ring-[#0ea5a3]"
                                />
                                <span className="font-medium text-[#0f172a]">Counseling provided to patient</span>
                            </label>
                        </div>

                        {/* Step 3: Payment */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Step 3: Payment</h2>

                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-emerald-900 font-medium">Copay Amount</span>
                                    <span className="text-2xl font-bold text-emerald-700">₹{copayAmount}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-[#64748b] mb-2">Payment Method</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["cash", "card", "insurance"].map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`px-4 py-3 rounded-lg font-medium transition-all ${paymentMethod === method
                                                    ? "bg-[#0ea5a3] text-white"
                                                    : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                                }`}
                                        >
                                            {method.charAt(0).toUpperCase() + method.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-lg cursor-pointer hover:bg-[#f1f5f9] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={workflow.paymentCollected}
                                    onChange={(e) => setWorkflow({ ...workflow, paymentCollected: e.target.checked })}
                                    className="w-6 h-6 rounded border-[#cbd5e1] text-[#0ea5a3] focus:ring-[#0ea5a3]"
                                />
                                <span className="font-medium text-[#0f172a]">Payment collected (₹{copayAmount})</span>
                            </label>
                        </div>

                        {/* Step 4: Handoff */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Step 4: Medication Handoff</h2>

                            <div className="space-y-3 mb-4">
                                <label className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-lg cursor-pointer hover:bg-[#f1f5f9] transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={workflow.medicationHanded}
                                        onChange={(e) => setWorkflow({ ...workflow, medicationHanded: e.target.checked })}
                                        className="w-6 h-6 rounded border-[#cbd5e1] text-[#0ea5a3] focus:ring-[#0ea5a3]"
                                    />
                                    <span className="font-medium text-[#0f172a]">Medication handed to patient</span>
                                </label>

                                <label className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-lg cursor-pointer hover:bg-[#f1f5f9] transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={workflow.acknowledgment}
                                        onChange={(e) => setWorkflow({ ...workflow, acknowledgment: e.target.checked })}
                                        className="w-6 h-6 rounded border-[#cbd5e1] text-[#0ea5a3] focus:ring-[#0ea5a3]"
                                    />
                                    <span className="font-medium text-[#0f172a]">Patient acknowledged receipt</span>
                                </label>
                            </div>

                            <div className="p-4 bg-[#f8fafc] border-2 border-dashed border-[#cbd5e1] rounded-lg">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={signature}
                                        onChange={(e) => setSignature(e.target.checked)}
                                        className="w-6 h-6 rounded border-[#cbd5e1] text-[#0ea5a3] focus:ring-[#0ea5a3]"
                                    />
                                    <span className="text-[#64748b]">Patient signature obtained</span>
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                disabled={!allComplete}
                                className={`flex-1 px-6 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${allComplete
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                <FiCheck className="w-6 h-6" />
                                Complete Dispensing
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="px-6 py-3 border-2 border-[#0ea5a3] text-[#0ea5a3] rounded-lg font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
                                <FiPrinter className="w-5 h-5" />
                                Print Receipt
                            </button>
                            <button className="px-6 py-3 border-2 border-blue-300 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                                <FiSend className="w-5 h-5" />
                                Send SMS Confirmation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

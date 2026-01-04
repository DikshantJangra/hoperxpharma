"use client";

import { useState } from "react";
import { FiPrinter, FiCheck, FiArrowRight } from "react-icons/fi";

export default function LabelPage() {
    const [labelApplied, setLabelApplied] = useState(false);
    const [auxiliaryLabels, setAuxiliaryLabels] = useState({
        takeWithFood: false,
        drowsiness: false,
        refrigerate: false,
        shakeWell: false
    });

    return (
        <div className="h-full flex flex-col bg-[#f8fafc]">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Print & Apply Label</h1>
                <p className="text-sm text-[#64748b]">Generate medication label for patient</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Label Preview (60%) */}
                <div className="w-3/5 border-r border-[#e2e8f0] overflow-y-auto p-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-white border-2 border-[#e2e8f0] rounded-xl p-8">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-6">Label Preview</h2>

                            {/* Label Design */}
                            <div className="border-4 border-black p-6 bg-white font-mono text-sm space-y-3">
                                <div className="border-b-2 border-black pb-3">
                                    <div className="text-xl font-bold">HopeRx Pharma</div>
                                    <div>-</div>
                                    <div>Phone: -</div>
                                </div>

                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><strong>Rx #:</strong> -</div>
                                        <div><strong>Date:</strong> -</div>
                                    </div>
                                    <div><strong>Patient:</strong> -</div>
                                    <div><strong>Dr.:</strong> -</div>
                                </div>

                                <div className="border-t-2 border-b-2 border-black py-3 my-3">
                                    <div className="text-lg font-bold mb-2">-</div>
                                    <div><strong>Qty:</strong> -</div>
                                    <div><strong>Refills:</strong> -</div>
                                </div>

                                <div className="bg-yellow-100 border-2 border-yellow-400 p-3">
                                    <div className="font-bold mb-1">DIRECTIONS:</div>
                                    <div>-</div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><strong>Lot:</strong> -</div>
                                    <div><strong>Exp:</strong> -</div>
                                </div>

                                <div className="flex justify-center pt-2">
                                    <div className="border border-black px-4 py-1">
                                        <div className="text-xs">||||| ||||| |||||</div>
                                        <div className="text-center text-xs">-</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Print Options (40%) */}
                <div className="w-2/5 overflow-y-auto p-6">
                    <div className="space-y-6">
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Print Options</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-2">Printer</label>
                                    <select className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]">
                                        <option>Label Printer - Main Counter</option>
                                        <option>Label Printer - Back Office</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-2">Label Size</label>
                                    <select className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]">
                                        <option>Standard (4" x 2")</option>
                                        <option>Large Print (4" x 3")</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-2">Number of Labels</label>
                                    <input
                                        type="number"
                                        defaultValue={1}
                                        min={1}
                                        max={5}
                                        className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#64748b] mb-2">Language</label>
                                    <select className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]">
                                        <option>English</option>
                                        <option>Hindi</option>
                                        <option>Marathi</option>
                                    </select>
                                </div>
                            </div>

                            <button className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                <FiPrinter className="w-5 h-5" />
                                Print Label
                            </button>
                        </div>

                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Auxiliary Labels</h2>

                            <div className="space-y-3">
                                {[
                                    { key: "takeWithFood", label: "Take with food", color: "bg-green-100 text-green-700" },
                                    { key: "drowsiness", label: "May cause drowsiness", color: "bg-amber-100 text-amber-700" },
                                    { key: "refrigerate", label: "Refrigerate", color: "bg-blue-100 text-blue-700" },
                                    { key: "shakeWell", label: "Shake well", color: "bg-purple-100 text-purple-700" }
                                ].map(({ key, label, color }) => (
                                    <label key={key} className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-lg cursor-pointer hover:bg-[#f1f5f9] transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={auxiliaryLabels[key as keyof typeof auxiliaryLabels]}
                                            onChange={(e) => setAuxiliaryLabels({ ...auxiliaryLabels, [key]: e.target.checked })}
                                            className="w-5 h-5 rounded border-[#cbd5e1] text-[#0ea5a3] focus:ring-[#0ea5a3]"
                                        />
                                        <span className={`flex-1 px-3 py-1 rounded font-medium text-sm ${color}`}>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <label className="flex items-center gap-3 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={labelApplied}
                                    onChange={(e) => setLabelApplied(e.target.checked)}
                                    className="w-6 h-6 rounded border-[#cbd5e1] text-[#0ea5a3] focus:ring-[#0ea5a3]"
                                />
                                <span className="font-semibold text-emerald-900">Label applied to container</span>
                            </label>
                        </div>

                        <button
                            disabled={!labelApplied}
                            className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${labelApplied
                                    ? "bg-[#0ea5a3] text-white hover:bg-[#0d9391]"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            <FiCheck className="w-5 h-5" />
                            Move to Final Check
                            <FiArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { FiSearch, FiPlus, FiMinus, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import { IoBarcodeOutline } from "react-icons/io5";

export default function FillPage() {
    const [barcodeInput, setBarcodeInput] = useState("");
    const [count, setCount] = useState(0);
    const [selectedBatch, setSelectedBatch] = useState("batch1");

    const targetQty = 30;
    const isComplete = count === targetQty;

    const batches: any[] = [];

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Fill Prescription</h1>
                <p className="text-sm text-[#64748b]">Select medication and count tablets</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Prescription (30%) */}
                <div className="w-[30%] border-r border-[#e2e8f0] overflow-y-auto p-6 bg-white">
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <h3 className="font-semibold text-blue-900 mb-3">Prescription</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-blue-700">Patient:</span>
                                    <span className="ml-2 font-medium text-blue-900">-</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">Drug:</span>
                                    <span className="ml-2 font-medium text-blue-900">-</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">Quantity:</span>
                                    <span className="ml-2 font-medium text-blue-900">{targetQty} tablets</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">Sig:</span>
                                    <span className="ml-2 text-blue-900">-</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-2">
                                <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-amber-900 mb-1">Special Instructions</h4>
                                    <p className="text-sm text-amber-700">No special instructions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle: Inventory Selection (40%) */}
                <div className="w-[40%] border-r border-[#e2e8f0] overflow-y-auto p-6">
                    <div className="space-y-6">
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Barcode Scanner</h2>
                            <div className="relative">
                                <IoBarcodeOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-[#64748b]" />
                                <input
                                    type="text"
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    placeholder="Scan medication barcode..."
                                    className="w-full pl-12 pr-4 py-3 border-2 border-[#0ea5a3] rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    autoFocus
                                />
                            </div>
                            <p className="text-sm text-[#64748b] mt-2">Or search manually below</p>
                        </div>

                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Available Batches</h2>
                            <div className="space-y-3">
                                {batches.length > 0 ? batches.map((batch) => (
                                    <label
                                        key={batch.id}
                                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedBatch === batch.id
                                                ? "border-[#0ea5a3] bg-emerald-50"
                                                : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="batch"
                                            value={batch.id}
                                            checked={selectedBatch === batch.id}
                                            onChange={(e) => setSelectedBatch(e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-[#0f172a]">{batch.manufacturer}</span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${new Date(batch.expiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-green-100 text-green-700"
                                                    }`}>
                                                    Exp: {batch.expiry}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-[#64748b]">
                                                <div>NDC: {batch.ndc}</div>
                                                <div>Lot: {batch.lot}</div>
                                                <div className="col-span-2">Stock: {batch.stock} tablets</div>
                                            </div>
                                        </div>
                                    </label>
                                ))) : (
                                    <div className="text-center py-6 text-gray-500">No batches available</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Counting (30%) */}
                <div className="w-[30%] overflow-y-auto p-6">
                    <div className="space-y-6">
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Count Tablets</h2>

                            <div className="text-center mb-6">
                                <div className="text-sm text-[#64748b] mb-2">Target Quantity</div>
                                <div className="text-6xl font-bold text-[#0f172a] mb-2">{count}</div>
                                <div className="text-2xl text-[#64748b]">/ {targetQty}</div>
                            </div>

                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={() => setCount(Math.max(0, count - 1))}
                                    className="flex-1 p-4 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiMinus className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => setCount(count + 1)}
                                    className="flex-1 p-4 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiPlus className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                <div
                                    className={`h-3 rounded-full transition-all ${isComplete ? "bg-green-600" : "bg-[#0ea5a3]"
                                        }`}
                                    style={{ width: `${Math.min((count / targetQty) * 100, 100)}%` }}
                                ></div>
                            </div>

                            {isComplete && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                                    <span className="text-green-700 font-medium">✓ Count Complete!</span>
                                </div>
                            )}
                        </div>

                        <button
                            disabled={!isComplete}
                            className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${isComplete
                                    ? "bg-[#0ea5a3] text-white hover:bg-[#0d9391]"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            Complete Fill & Move to Label
                            <FiArrowRight className="w-5 h-5" />
                        </button>

                        <button className="w-full px-6 py-3 border-2 border-amber-300 text-amber-700 rounded-lg font-semibold hover:bg-amber-50 transition-colors">
                            Partial Fill (Out of Stock)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

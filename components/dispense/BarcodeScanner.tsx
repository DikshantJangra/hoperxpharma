"use client";

import React, { useState } from "react";
import { FiCamera, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";

interface BarcodeScannerProps {
    expectedValue?: string;
    onScan: (value: string, isMatch: boolean) => void;
    label?: string;
    placeholder?: string;
}

export default function BarcodeScanner({
    expectedValue,
    onScan,
    label = "Scan Barcode",
    placeholder = "Enter or scan barcode..."
}: BarcodeScannerProps) {
    const [value, setValue] = useState("");
    const [status, setStatus] = useState<"idle" | "match" | "mismatch">("idle");

    const handleScan = () => {
        if (!value.trim()) return;

        const isMatch = expectedValue ? value.trim() === expectedValue : true;
        setStatus(isMatch ? "match" : "mismatch");
        onScan(value.trim(), isMatch);

        // Reset after 2 seconds
        setTimeout(() => {
            setValue("");
            setStatus("idle");
        }, 2000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleScan();
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <FiCamera className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">{label}</h3>
            </div>

            {expectedValue && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                        <span className="font-semibold">Expected:</span>{" "}
                        <span className="font-mono">{expectedValue}</span>
                    </p>
                </div>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    autoFocus
                    className={`w-full px-4 py-3 border-2 rounded-lg font-mono text-lg focus:outline-none transition-all ${status === "match"
                            ? "border-green-500 bg-green-50"
                            : status === "mismatch"
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300 focus:border-blue-500"
                        }`}
                />
                {status === "match" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <FiCheck className="h-6 w-6 text-green-600" />
                    </div>
                )}
                {status === "mismatch" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <FiX className="h-6 w-6 text-red-600" />
                    </div>
                )}
            </div>

            {status === "mismatch" && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <FiAlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-red-900">Barcode Mismatch</p>
                        <p className="text-sm text-red-700 mt-1">
                            The scanned barcode does not match the expected value. Please verify and try again.
                        </p>
                    </div>
                </div>
            )}

            {status === "match" && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                    <FiCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-green-900">Verified</p>
                        <p className="text-sm text-green-700 mt-1">Barcode successfully verified</p>
                    </div>
                </div>
            )}

            <button
                onClick={handleScan}
                disabled={!value.trim()}
                className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
                Verify Barcode
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
                Use a barcode scanner or manually enter the code
            </p>
        </div>
    );
}

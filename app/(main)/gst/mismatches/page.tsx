"use client";

import React, { useState, useEffect } from "react";
import MismatchAlert, { Mismatch } from "@/components/gst/MismatchAlert";
import { FiFilter, FiCheckCircle } from "react-icons/fi";

const MismatchSkeleton = () => (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1">
                <div className="h-6 w-6 bg-gray-200 rounded-full mt-0.5 shrink-0"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
            <div className="h-16 bg-gray-50 rounded-lg"></div>
            <div className="h-16 bg-gray-50 rounded-lg"></div>
        </div>
        <div className="h-16 bg-gray-50 rounded-lg"></div>
    </div>
)

export default function MismatchCorrectionPage() {
    const [mismatches, setMismatches] = useState<Mismatch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning" | "info">("all");
    const [filterType, setFilterType] = useState<"all" | "gstr1_vs_3b" | "itc_vs_2b" | "tax_rate" | "einvoice">("all");

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setMismatches([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [filterSeverity, filterType])

    const filteredMismatches = mismatches.filter(m => {
        const matchesSeverity = filterSeverity === "all" || m.severity === filterSeverity;
        const matchesType = filterType === "all" || m.type === filterType;
        return matchesSeverity && matchesType;
    });

    const handleFix = (id: string) => {
        alert(`Auto-fixing mismatch ${id}...`);
        setMismatches(prev => prev.filter(m => m.id !== id));
    };

    const handleDismiss = (id: string) => {
        setMismatches(prev => prev.filter(m => m.id !== id));
    };

    const criticalCount = mismatches.filter(m => m.severity === "critical").length;
    const warningCount = mismatches.filter(m => m.severity === "warning").length;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Mismatch & Error Correction</h1>
                            <p className="text-sm text-gray-500">Detect and correct GST-related errors before filing</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                                <span className="text-sm text-gray-600">Critical:</span>
                                {isLoading ? <span className="ml-2 font-bold text-red-700 animate-pulse">...</span> : <span className="ml-2 font-bold text-red-700">{criticalCount}</span>}
                            </div>
                            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <span className="text-sm text-gray-600">Warnings:</span>
                                {isLoading ? <span className="ml-2 font-bold text-amber-700 animate-pulse">...</span> : <span className="ml-2 font-bold text-amber-700">{warningCount}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-4">
                        <FiFilter className="h-5 w-5 text-gray-400" />
                        <select
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        >
                            <option value="all">All Severities</option>
                            <option value="critical">Critical Only</option>
                            <option value="warning">Warnings Only</option>
                            <option value="info">Info Only</option>
                        </select>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        >
                            <option value="all">All Types</option>
                            <option value="gstr1_vs_3b">GSTR-1 vs 3B</option>
                            <option value="itc_vs_2b">ITC vs 2B</option>
                            <option value="tax_rate">Tax Rate Errors</option>
                            <option value="einvoice">E-Invoice Failures</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="space-y-6">
                        <MismatchSkeleton/>
                        <MismatchSkeleton/>
                    </div>
                ) : filteredMismatches.length === 0 ? (
                    <div className="bg-white border-2 border-green-200 rounded-xl p-12 text-center">
                        <FiCheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-green-900 mb-2">All Clear!</h3>
                        <p className="text-gray-600">No mismatches found. Your GST data is ready for filing.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredMismatches.map((mismatch) => (
                            <MismatchAlert
                                key={mismatch.id}
                                mismatch={mismatch}
                                onFix={handleFix}
                                onDismiss={handleDismiss}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

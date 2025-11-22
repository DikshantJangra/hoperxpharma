"use client";

import React, { useState } from "react";
import MismatchAlert, { Mismatch } from "@/components/gst/MismatchAlert";
import { FiFilter, FiCheckCircle } from "react-icons/fi";

const MOCK_MISMATCHES: Mismatch[] = [
    {
        id: "m1",
        type: "gstr1_vs_3b",
        severity: "critical",
        title: "GSTR-1 and GSTR-3B Mismatch",
        description: "Outward supply value in GSTR-1 doesn't match GSTR-3B summary for January 2024",
        expected: 1250000,
        actual: 1248500,
        suggestion: "Review invoices dated 28-31 Jan. Likely missing 2 invoices worth ₹1,500. Check invoice numbers INV-2024-045 and INV-2024-046.",
        canAutoFix: false
    },
    {
        id: "m2",
        type: "tax_rate",
        severity: "warning",
        title: "Incorrect Tax Rate Applied",
        description: "Medicine 'Paracetamol 500mg' has wrong HSN code leading to incorrect GST rate",
        expected: "5% (HSN 3004)",
        actual: "12% (HSN 3003)",
        suggestion: "Update HSN code to 3004 for essential medicines. This will reduce tax liability by ₹350.",
        canAutoFix: true
    },
    {
        id: "m3",
        type: "itc_vs_2b",
        severity: "warning",
        title: "ITC Claim Mismatch",
        description: "Input Tax Credit claimed in GSTR-3B exceeds ITC available in GSTR-2B",
        expected: 45000,
        actual: 47500,
        suggestion: "Reconcile purchase invoices. Supplier 'ABC Pharma' may not have filed GSTR-1 yet.",
        canAutoFix: false
    },
    {
        id: "m4",
        type: "einvoice",
        severity: "critical",
        title: "E-Invoice Generation Failed",
        description: "IRN generation failed for invoice INV-2024-050 due to invalid GSTIN format",
        expected: "Valid GSTIN",
        actual: "27AAAAA0000A1Z",
        suggestion: "Correct customer GSTIN to 15 characters. Current GSTIN is missing last digit.",
        canAutoFix: true
    },
    {
        id: "m5",
        type: "tax_rate",
        severity: "info",
        title: "Potential Tax Optimization",
        description: "Medicine 'Insulin Glargine' can be classified under HSN 300431 for 5% GST instead of current 12%",
        expected: "5% (HSN 300431)",
        actual: "12% (HSN 3004)",
        suggestion: "Reclassify insulin products under HSN 300431 to reduce tax burden and remain compliant.",
        canAutoFix: true
    }
];

export default function MismatchCorrectionPage() {
    const [mismatches, setMismatches] = useState<Mismatch[]>(MOCK_MISMATCHES);
    const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning" | "info">("all");
    const [filterType, setFilterType] = useState<"all" | "gstr1_vs_3b" | "itc_vs_2b" | "tax_rate" | "einvoice">("all");

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
                                <span className="ml-2 font-bold text-red-700">{criticalCount}</span>
                            </div>
                            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <span className="text-sm text-gray-600">Warnings:</span>
                                <span className="ml-2 font-bold text-amber-700">{warningCount}</span>
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
                {filteredMismatches.length === 0 ? (
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

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    FiFileText,
    FiAlertCircle,
    FiDownload,
    FiPlus,
    FiTrendingUp,
    FiDollarSign,
    FiCreditCard,
    FiCheckCircle
} from "react-icons/fi";
import GSTSummaryCard from "@/components/gst/GSTSummaryCard";
import TaxBreakdown from "@/components/gst/TaxBreakdown";
import MismatchAlert, { Mismatch } from "@/components/gst/MismatchAlert";

// Mock data
const MOCK_SUMMARY = {
    currentPeriod: "January 2024",
    totalSales: 1250000,
    taxCollected: 150000,
    itcAvailable: 45000,
    netTaxLiability: 105000,
    cgst: 52500,
    sgst: 52500,
    igst: 45000,
    taxableValue: 1100000
};

const MOCK_MISMATCHES: Mismatch[] = [
    {
        id: "m1",
        type: "gstr1_vs_3b",
        severity: "critical",
        title: "GSTR-1 and GSTR-3B Mismatch",
        description: "Outward supply value in GSTR-1 doesn't match GSTR-3B summary",
        expected: 1250000,
        actual: 1248500,
        suggestion: "Review invoices dated 28-31 Jan. Likely missing 2 invoices worth ₹1,500.",
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
        suggestion: "Update HSN code to 3004 for essential medicines. This will reduce tax liability.",
        canAutoFix: true
    }
];

const PENDING_RETURNS = [
    { name: "GSTR-1", period: "Jan 2024", dueDate: "2024-02-11", status: "pending" as const },
    { name: "GSTR-3B", period: "Jan 2024", dueDate: "2024-02-20", status: "pending" as const }
];

export default function GSTDashboard() {
    const [mismatches, setMismatches] = useState<Mismatch[]>(MOCK_MISMATCHES);

    const handleFixMismatch = (id: string) => {
        alert(`Auto-fixing mismatch ${id}...`);
        setMismatches(prev => prev.filter(m => m.id !== id));
    };

    const handleDismissMismatch = (id: string) => {
        setMismatches(prev => prev.filter(m => m.id !== id));
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">GST & Tax Compliance</h1>
                            <p className="text-sm text-gray-500">
                                Period: <span className="font-semibold">{MOCK_SUMMARY.currentPeriod}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/gst/invoices/new"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <FiPlus className="h-4 w-4" />
                                New GST Invoice
                            </Link>
                            <Link
                                href="/gst/exports"
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <FiDownload className="h-4 w-4" />
                                Export
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <GSTSummaryCard
                        title="Total Sales"
                        value={MOCK_SUMMARY.totalSales}
                        subtitle="Taxable value"
                        status="info"
                        icon={<FiTrendingUp className="h-6 w-6" />}
                        trend={{ value: 12.5, isPositive: true }}
                    />
                    <GSTSummaryCard
                        title="Tax Collected"
                        value={MOCK_SUMMARY.taxCollected}
                        subtitle="CGST + SGST + IGST"
                        status="success"
                        icon={<FiDollarSign className="h-6 w-6" />}
                    />
                    <GSTSummaryCard
                        title="ITC Available"
                        value={MOCK_SUMMARY.itcAvailable}
                        subtitle="Input Tax Credit"
                        status="info"
                        icon={<FiCreditCard className="h-6 w-6" />}
                    />
                    <GSTSummaryCard
                        title="Net Tax Liability"
                        value={MOCK_SUMMARY.netTaxLiability}
                        subtitle="Tax - ITC"
                        status={mismatches.length > 0 ? "warning" : "success"}
                        icon={<FiCheckCircle className="h-6 w-6" />}
                    />
                </div>

                {/* Alerts Section */}
                {mismatches.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <FiAlertCircle className="h-6 w-6 text-red-600" />
                            <h2 className="text-xl font-bold text-gray-900">
                                Action Required ({mismatches.length})
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {mismatches.map((mismatch) => (
                                <MismatchAlert
                                    key={mismatch.id}
                                    mismatch={mismatch}
                                    onFix={handleFixMismatch}
                                    onDismiss={handleDismissMismatch}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Tax Breakdown */}
                    <div className="lg:col-span-2">
                        <TaxBreakdown
                            data={{
                                cgst: MOCK_SUMMARY.cgst,
                                sgst: MOCK_SUMMARY.sgst,
                                igst: MOCK_SUMMARY.igst,
                                taxableValue: MOCK_SUMMARY.taxableValue
                            }}
                        />
                    </div>

                    {/* Pending Returns */}
                    <div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FiFileText className="h-5 w-5 text-blue-600" />
                                Pending Returns
                            </h3>
                            <div className="space-y-3">
                                {PENDING_RETURNS.map((ret, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="font-bold text-amber-900">{ret.name}</div>
                                                <div className="text-sm text-amber-700">{ret.period}</div>
                                            </div>
                                            <span className="px-2 py-1 bg-amber-600 text-white text-xs font-bold rounded">
                                                PENDING
                                            </span>
                                        </div>
                                        <div className="text-sm text-amber-700 mb-3">
                                            Due: <span className="font-semibold">{ret.dueDate}</span>
                                        </div>
                                        <Link
                                            href={`/gst/returns?type=${ret.name.toLowerCase()}`}
                                            className="block w-full px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors text-center"
                                        >
                                            File Now
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
                            <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link
                                    href="/gst/invoices"
                                    className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                                >
                                    View All Invoices
                                </Link>
                                <Link
                                    href="/gst/hsn-codes"
                                    className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                                >
                                    HSN Code Directory
                                </Link>
                                <Link
                                    href="/gst/tax-slabs"
                                    className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                                >
                                    Manage Tax Slabs
                                </Link>
                                <Link
                                    href="/gst/mismatches"
                                    className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                                >
                                    View All Mismatches
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

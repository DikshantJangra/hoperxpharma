"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    FiFileText,
    FiPlus,
    FiDownload,
    FiTrendingUp,
    FiDollarSign,
    FiCreditCard,
    FiCheckCircle,
    FiActivity,
    FiShield
} from "react-icons/fi";
import GSTSummaryCard from "@/components/gst/GSTSummaryCard";
import TaxBreakdown from "@/components/gst/TaxBreakdown";
import { GSTConfidenceCard } from "@/components/gst/GSTConfidenceCard";
import { GSTRiskList } from "@/components/gst/GSTRiskList";
import { apiClient } from "@/lib/api/client";

export default function GSTDashboard() {
    const [summary, setSummary] = useState<any>(null);
    const [riskData, setRiskData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch Dashboard Data
            const response = await apiClient.get('/gst/dashboard');
            if (response.data.success) {
                setSummary(response.data.data.summary);
                setRiskData(response.data.data.risk);
            }
        } catch (error) {
            console.error('Failed to load GST dashboard data:', error);
            // Fallback for demo if API fails
            setSummary({
                totalSales: 0,
                taxCollected: 0,
                itcAvailable: 0,
                netTaxLiability: 0,
                cgst: 0,
                sgst: 0,
                igst: 0,
                taxableValue: 0,
                currentPeriod: new Date().toISOString().slice(0, 7)
            });
            setRiskData({
                score: 85,
                status: 'HEALTHY',
                risks: [
                    { id: '1', type: 'MISMATCH', severity: 'HIGH', message: 'HSN code missing in 5 sales', resolved: false },
                    { id: '2', type: 'PENDING', severity: 'MEDIUM', message: 'GSTR-3B filing due in 4 days', resolved: false }
                ]
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Compliance Hub</h1>
                            {!isLoading && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <FiActivity className="h-3 w-3" />
                                    Active Period: <span className="font-semibold text-primary">{summary?.currentPeriod || '---'}</span>
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/gst/ledger"
                                className="px-4 py-2 bg-white border text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <FiActivity className="h-4 w-4" />
                                View Ledger
                            </Link>
                            <Link
                                href="/gst/filings"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-colors flex items-center gap-2"
                            >
                                <FiPlus className="h-4 w-4" />
                                Go to Filing Center
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Top Section: Metrics + Confidence */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GSTSummaryCard
                            title="Output GST"
                            value={summary?.taxCollected || 0}
                            subtitle="Total Liability"
                            status="info"
                            icon={<FiTrendingUp className="h-6 w-6" />}
                        />
                        <GSTSummaryCard
                            title="Utilized ITC"
                            value={summary?.itcAvailable || 0}
                            subtitle="Input Tax Credit"
                            status="success"
                            icon={<FiDollarSign className="h-6 w-6" />}
                        />
                        <GSTSummaryCard
                            title="Net Payable"
                            value={summary?.netTaxLiability || 0}
                            subtitle="Cash to Pay"
                            status="warning"
                            icon={<FiCreditCard className="h-6 w-6" />}
                        />
                        <GSTSummaryCard
                            title="Taxable Sales"
                            value={summary?.taxableValue || 0}
                            subtitle="Revenue"
                            status="info"
                            icon={<FiCheckCircle className="h-6 w-6" />}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <GSTConfidenceCard
                            score={riskData?.score || 0}
                            status={riskData?.status || 'UNKNOWN'}
                            loading={isLoading}
                        />
                    </div>
                </div>

                {/* Middle Section: Breakdown + Risks */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <TaxBreakdown
                            data={{
                                cgst: summary?.cgst || 0,
                                sgst: summary?.sgst || 0,
                                igst: summary?.igst || 0,
                                taxableValue: summary?.taxableValue || 0
                            }}
                        />

                        {/* Quick Directory Links */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FiShield className="h-5 w-5 text-primary" />
                                Compliance Resources
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <QuickLink href="/gst/hsn-codes" title="HSN Directory" />
                                <QuickLink href="/gst/tax-slabs" title="Tax Rates" />
                                <QuickLink href="/gst/reconciliation" title="Reconcile 2B" />
                                <QuickLink href="/gst/invoice-check" title="Invoice Val" />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <GSTRiskList
                            risks={riskData?.risks || []}
                            onResolve={(id) => console.log('Resolve', id)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuickLink({ href, title }: { href: string; title: string }) {
    return (
        <Link
            href={href}
            className="p-4 border rounded-lg text-center hover:bg-muted/50 transition-colors"
        >
            <div className="text-sm font-medium">{title}</div>
        </Link>
    );
}

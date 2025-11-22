"use client";

import React, { useState, useEffect } from "react";
import { FiDownload, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

type ReturnType = "GSTR1" | "GSTR3B" | "GSTR9";

const SummaryCardSkeleton = () => (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-7 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2 mt-1"></div>
    </div>
)

export default function GSTRFilingPage() {
    const [activeTab, setActiveTab] = useState<ReturnType>("GSTR1");
    const [period, setPeriod] = useState("2024-01");
    const [isLoading, setIsLoading] = useState(true);
    const [gstr1Summary, setGstr1Summary] = useState<any>(null);
    const [gstr3bSummary, setGstr3bSummary] = useState<any>(null);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            if (activeTab === 'GSTR1') {
                setGstr1Summary(null);
            } else if (activeTab === 'GSTR3B') {
                setGstr3bSummary(null);
            }
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, [activeTab, period]);


    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">GST Return Filing</h1>
                    <p className="text-sm text-gray-500">File GSTR-1, GSTR-3B, and GSTR-9 returns</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {(["GSTR1", "GSTR3B", "GSTR9"] as ReturnType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === tab
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                }`}
                            disabled={isLoading}
                        >
                            {tab === "GSTR1" && "GSTR-1 (Outward Supplies)"}
                            {tab === "GSTR3B" && "GSTR-3B (Summary Return)"}
                            {tab === "GSTR9" && "GSTR-9 (Annual Return)"}
                        </button>
                    ))}
                </div>

                {/* Period Selection */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Period
                    </label>
                    <input
                        type="month"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                </div>

                {/* GSTR-1 Content */}
                {activeTab === "GSTR1" && (
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Outward Supplies Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {isLoading ? (
                                    <><SummaryCardSkeleton/><SummaryCardSkeleton/><SummaryCardSkeleton/></>
                                ) : gstr1Summary ? (
                                    <>
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="text-sm text-gray-600 mb-1">B2B Invoices</div>
                                            <div className="text-2xl font-bold text-blue-900">{gstr1Summary.b2bInvoices}</div>
                                            <div className="text-sm text-gray-600 mt-1">₹{gstr1Summary.b2bValue.toLocaleString()}</div>
                                        </div>
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="text-sm text-gray-600 mb-1">B2C Large (&gt;₹2.5L)</div>
                                            <div className="text-2xl font-bold text-green-900">{gstr1Summary.b2cLargeInvoices}</div>
                                            <div className="text-sm text-gray-600 mt-1">₹{gstr1Summary.b2cLargeValue.toLocaleString()}</div>
                                        </div>
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="text-sm text-gray-600 mb-1">B2C Others</div>
                                            <div className="text-2xl font-bold text-amber-900">₹{gstr1Summary.b2cOthersValue.toLocaleString()}</div>
                                            <div className="text-sm text-gray-600 mt-1">Consolidated</div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-3 text-center py-4 text-gray-500">No GSTR-1 data for this period.</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">Actions</h3>
                                {!isLoading && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <FiCheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-green-700 font-medium">Data validated</span>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2" disabled={isLoading}>
                                    <FiDownload className="h-4 w-4" />
                                    Download JSON
                                </button>
                                <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2" disabled={isLoading}>
                                    <FiDownload className="h-4 w-4" />
                                    Download CSV
                                </button>
                            </div>
                            <button className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors" disabled={isLoading}>
                                Mark as Filed
                            </button>
                        </div>
                    </div>
                )}

                {/* GSTR-3B Content */}
                {activeTab === "GSTR3B" && (
                     <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Tax Liability Summary</h3>
                             {isLoading ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-24 bg-gray-50 rounded-lg"></div>
                                    <div className="h-12 bg-blue-50 rounded-lg"></div>
                                    <div className="h-16 bg-green-50 rounded-lg"></div>
                                </div>
                             ) : gstr3bSummary ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-900">Outward Taxable Supplies</span>
                                            <span className="font-bold text-gray-900">₹{gstr3bSummary.outwardSupplies.toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <div className="text-gray-600">CGST</div>
                                                <div className="font-semibold text-blue-900">₹{gstr3bSummary.cgst.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600">SGST</div>
                                                <div className="font-semibold text-green-900">₹{gstr3bSummary.sgst.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600">IGST</div>
                                                <div className="font-semibold text-amber-900">₹{gstr3bSummary.igst.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-blue-900">ITC Available</span>
                                            <span className="font-bold text-blue-900">₹{gstr3bSummary.itcAvailable.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-green-900">Net Tax Payable</span>
                                            <span className="text-2xl font-bold text-green-900">₹{gstr3bSummary.netPayable.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="col-span-full text-center py-4 text-gray-500">No GSTR-3B data for this period.</div>
                            )}
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Actions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors" disabled={isLoading}>
                                    Auto-fill from GSTR-1
                                </button>
                                <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2" disabled={isLoading}>
                                    <FiDownload className="h-4 w-4" />
                                    Export JSON
                                </button>
                            </div>
                            <button className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors" disabled={isLoading}>
                                Mark as Filed
                            </button>
                        </div>
                    </div>
                )}

                {/* GSTR-9 Content */}
                {activeTab === "GSTR9" && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Annual Return (GSTR-9)</h3>
                        <div className="text-center py-12">
                            <p className="text-gray-600 mb-4">Select financial year for annual return</p>
                            <select className="px-4 py-2 border border-gray-300 rounded-lg">
                                <option>FY 2023-24</option>
                                <option>FY 2024-25</option>
                            </select>
                            <button className="block w-full max-w-md mx-auto mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                Generate GSTR-9
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

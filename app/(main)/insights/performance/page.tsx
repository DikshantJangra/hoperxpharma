"use client";

import { FiActivity, FiTarget, FiAward } from "react-icons/fi";

export default function PerformancePage() {
    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-xl font-bold text-[#0f172a]">Performance Metrics</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                    <FiActivity className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#0f172a] mb-2">Performance Dashboard Coming Soon</h3>
                    <p className="text-[#64748b]">Staff performance, operational efficiency, and KPI tracking</p>
                </div>
            </div>
        </div>
    );
}

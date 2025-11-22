"use client";

import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { MdShowChart } from "react-icons/md";

export default function TrendsReportPage() {
    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Trend Analysis</h1>
                    <p className="text-sm text-[#64748b]">Business trends and predictive insights</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                    <MdShowChart className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#0f172a] mb-2">Trend Analysis Coming Soon</h3>
                    <p className="text-[#64748b]">AI-powered trend analysis and predictions will be available here</p>
                </div>
            </div>
        </div>
    );
}

"use client"
import Link from "next/link";
import { FiBookOpen, FiAlertCircle, FiFileText, FiArrowRight, FiTrendingUp, FiClock } from "react-icons/fi";
import { TbPill } from "react-icons/tb";
import DrugSearch from "@/components/knowledge/DrugSearch";

export default function KnowledgePage() {
    const trendingDrugs = [
        { name: "Azithromycin 500", searches: "2.4k" },
        { name: "Pantoprazole 40", searches: "1.8k" },
        { name: "Metformin 500", searches: "1.5k" },
        { name: "Telmisartan 40", searches: "1.2k" }
    ];

    const updates = [
        { title: "New Diabetes Guidelines 2024", desc: "Updated dosage protocols for SGLT2 inhibitors", type: "info", time: "2h ago" },
        { title: "Recall Alert: Batch #X992", desc: "Cough syrup batch recalled - contamination risk", type: "alert", time: "5h ago" },
        { title: "Antibiotic Stewardship Update", desc: "New resistance patterns for fluoroquinolones", type: "info", time: "1d ago" }
    ];

    return (
        <div className="min-h-screen bg-[#f7fafc]">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <TbPill className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-800">Clinical Knowledge Hub</h1>
                    </div>
                    <p className="text-sm text-gray-600 ml-[52px]">
                        Intelligent medical companion for safer, faster pharmacy decisions
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <DrugSearch />

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* Quick Access Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/knowledge/drug-info" className="group">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="h-11 w-11 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <FiBookOpen className="h-5 w-5" />
                                </div>
                                <FiArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">Drug Information</h3>
                            <p className="text-sm text-gray-600">
                                100,000+ medicines with dosages & safety data
                            </p>
                        </div>
                    </Link>

                    <Link href="/knowledge/interactions" className="group">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="h-11 w-11 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                    <FiAlertCircle className="h-5 w-5" />
                                </div>
                                <FiArrowRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-amber-600 transition-colors">Interaction Checker</h3>
                            <p className="text-sm text-gray-600">
                                Multi-drug, food & condition safety checks
                            </p>
                        </div>
                    </Link>

                    <Link href="/knowledge/guides" className="group">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="h-11 w-11 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                    <FiFileText className="h-5 w-5" />
                                </div>
                                <FiArrowRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-emerald-600 transition-colors">Clinical Guides</h3>
                            <p className="text-sm text-gray-600">
                                SOPs, compliance & training materials
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Trending & Updates Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Trending Medicines */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FiTrendingUp className="h-5 w-5 text-blue-600" />
                                <h3 className="text-base font-semibold text-gray-800">Trending Medicines</h3>
                            </div>
                            <span className="text-xs text-gray-500">Last 24h</span>
                        </div>
                        <div className="space-y-2">
                            {trendingDrugs.map((drug, i) => (
                                <Link key={i} href={`/knowledge/drug-info/${drug.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-semibold text-gray-400 w-6">#{i + 1}</span>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{drug.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{drug.searches}</span>
                                            <FiArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent Updates */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <FiClock className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-base font-semibold text-gray-800">Recent Updates</h3>
                        </div>
                        <div className="space-y-3">
                            {updates.map((update, i) => (
                                <div key={i} className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                                        update.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 mb-0.5">{update.title}</p>
                                        <p className="text-xs text-gray-600 mb-1">{update.desc}</p>
                                        <span className="text-xs text-gray-400">{update.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

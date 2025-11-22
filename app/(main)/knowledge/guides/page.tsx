"use client";

import { FiBook, FiDownload } from "react-icons/fi";

const guides = [
    { category: "Disease Management", title: "Diabetes Care Protocol", description: "Comprehensive guide for diabetes management" },
    { category: "Emergency", title: "Anaphylaxis Response", description: "Emergency protocol for allergic reactions" },
    { category: "Therapy", title: "Antibiotic Stewardship", description: "Guidelines for appropriate antibiotic use" }
];

export default function KnowledgeGuidesPage() {
    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Clinical Guides</h1>
                    <p className="text-sm text-[#64748b]">Evidence-based clinical reference guides</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {guides.map((guide, idx) => (
                        <div key={idx} className="bg-white border border-[#e2e8f0] rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <FiBook className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                    {guide.category}
                                </span>
                            </div>
                            <h3 className="font-semibold text-[#0f172a] mb-2">{guide.title}</h3>
                            <p className="text-sm text-[#64748b] mb-4">{guide.description}</p>
                            <button className="w-full px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center justify-center gap-2">
                                <FiDownload className="w-4 h-4" />
                                Download PDF
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

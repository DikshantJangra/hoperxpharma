"use client";

import { useState } from "react";
import { FiCheck, FiAlertCircle, FiShield, FiFileText } from "react-icons/fi";
import { TbPrescription } from "react-icons/tb";
import { MdVerifiedUser } from "react-icons/md";

const eRxGuidelines = [
    {
        category: "Prescription Format",
        rules: [
            { id: 1, rule: "Digital signature required", status: "compliant", description: "All e-prescriptions digitally signed by licensed prescriber" },
            { id: 2, rule: "Unique prescription ID", status: "compliant", description: "Auto-generated unique identifier for each prescription" },
            { id: 3, rule: "Timestamp validation", status: "compliant", description: "Date and time of prescription issuance recorded" },
            { id: 4, rule: "Prescriber details", status: "compliant", description: "Name, registration number, and contact information included" }
        ]
    },
    {
        category: "Controlled Substances",
        rules: [
            { id: 5, rule: "Schedule H/H1 verification", status: "compliant", description: "Additional verification for controlled drugs" },
            { id: 6, rule: "Narcotic prescription limits", status: "compliant", description: "Maximum 7-day supply for Schedule X drugs" },
            { id: 7, rule: "Refill restrictions", status: "compliant", description: "No refills allowed for Schedule H1/X without new prescription" },
            { id: 8, rule: "Audit trail", status: "compliant", description: "Complete dispensing history maintained" }
        ]
    },
    {
        category: "Patient Safety",
        rules: [
            { id: 9, rule: "Drug interaction check", status: "compliant", description: "Automated interaction screening enabled" },
            { id: 10, rule: "Allergy verification", status: "compliant", description: "Patient allergy history checked before dispensing" },
            { id: 11, rule: "Dosage validation", status: "action-needed", description: "Implement age/weight-based dosage alerts" },
            { id: 12, rule: "Duplicate therapy check", status: "compliant", description: "Alert for duplicate active ingredients" }
        ]
    },
    {
        category: "Data Retention",
        rules: [
            { id: 13, rule: "5-year retention", status: "compliant", description: "All e-prescriptions stored for minimum 5 years" },
            { id: 14, rule: "Backup & recovery", status: "compliant", description: "Daily automated backups with disaster recovery plan" },
            { id: 15, rule: "Tamper-proof storage", status: "compliant", description: "Blockchain-based immutable record keeping" }
        ]
    }
];

const stateRequirements = [
    { state: "Maharashtra", requirement: "e-Rx mandatory for Schedule H1 drugs", status: "compliant" },
    { state: "Karnataka", requirement: "Digital signature certificate required", status: "compliant" },
    { state: "Delhi", requirement: "Integration with state health portal", status: "pending" },
    { state: "Tamil Nadu", requirement: "Bilingual prescription support", status: "compliant" }
];

export default function ERxRulesPage() {
    const [activeCategory, setActiveCategory] = useState("all");

    const allRules = eRxGuidelines.flatMap(cat => cat.rules);
    const complianceRate = Math.round((allRules.filter(r => r.status === "compliant").length / allRules.length) * 100);

    const filteredGuidelines = activeCategory === "all"
        ? eRxGuidelines
        : eRxGuidelines.filter(cat => cat.category.toLowerCase().includes(activeCategory.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">e-Prescription Compliance</h1>
                    <p className="text-sm text-[#64748b]">Electronic prescription regulatory guidelines and validation rules</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Compliance Score */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold mb-2 opacity-90">e-Rx Compliance Rate</h2>
                            <div className="text-6xl font-bold mb-4">{complianceRate}%</div>
                            <p className="text-sm opacity-90">
                                {allRules.filter(r => r.status === "compliant").length} of {allRules.length} rules compliant
                            </p>
                        </div>
                        <div className="w-32 h-32 rounded-full border-8 border-white border-opacity-30 flex items-center justify-center">
                            <TbPrescription className="w-16 h-16" />
                        </div>
                    </div>
                </div>

                {/* Regulatory Framework */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-[#0f172a] mb-6">Applicable Regulations</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-[#e2e8f0] rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <FiFileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <h4 className="font-semibold text-[#0f172a]">Drugs & Cosmetics Act</h4>
                            </div>
                            <p className="text-sm text-[#64748b]">Schedule H, H1, and X drug dispensing rules</p>
                        </div>

                        <div className="p-4 border border-[#e2e8f0] rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <MdVerifiedUser className="w-5 h-5 text-green-600" />
                                </div>
                                <h4 className="font-semibold text-[#0f172a]">IT Act 2000</h4>
                            </div>
                            <p className="text-sm text-[#64748b]">Digital signature and electronic record validity</p>
                        </div>

                        <div className="p-4 border border-[#e2e8f0] rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <FiShield className="w-5 h-5 text-purple-600" />
                                </div>
                                <h4 className="font-semibold text-[#0f172a]">Telemedicine Guidelines</h4>
                            </div>
                            <p className="text-sm text-[#64748b]">MCI telemedicine practice guidelines 2020</p>
                        </div>
                    </div>
                </div>

                {/* Category Filters */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveCategory("all")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeCategory === "all" ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                        >
                            All Rules
                        </button>
                        <button
                            onClick={() => setActiveCategory("prescription")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeCategory === "prescription" ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                        >
                            Prescription Format
                        </button>
                        <button
                            onClick={() => setActiveCategory("controlled")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeCategory === "controlled" ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                        >
                            Controlled Substances
                        </button>
                        <button
                            onClick={() => setActiveCategory("safety")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeCategory === "safety" ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                        >
                            Patient Safety
                        </button>
                        <button
                            onClick={() => setActiveCategory("retention")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeCategory === "retention" ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                        >
                            Data Retention
                        </button>
                    </div>
                </div>

                {/* Guidelines */}
                <div className="space-y-6 mb-8">
                    {filteredGuidelines.map((category) => (
                        <div key={category.category} className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h3 className="font-semibold text-[#0f172a] mb-4">{category.category}</h3>

                            <div className="space-y-3">
                                {category.rules.map((rule) => (
                                    <div key={rule.id} className="flex items-start gap-4 p-4 border border-[#e2e8f0] rounded-lg hover:shadow-sm transition-shadow">
                                        <div className="flex-shrink-0 mt-1">
                                            {rule.status === "compliant" ? (
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                    <FiCheck className="w-5 h-5 text-green-600" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                                    <FiAlertCircle className="w-5 h-5 text-amber-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-[#0f172a]">{rule.rule}</h4>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${rule.status === "compliant"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {rule.status === "compliant" ? "Compliant" : "Action Needed"}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#64748b]">{rule.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* State-Specific Requirements */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <h3 className="font-semibold text-[#0f172a] mb-6">State-Specific Requirements</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#e2e8f0]">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">State</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Requirement</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stateRequirements.map((req, idx) => (
                                    <tr key={idx} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                                        <td className="py-4 px-4 font-medium text-[#0f172a]">{req.state}</td>
                                        <td className="py-4 px-4 text-[#64748b]">{req.requirement}</td>
                                        <td className="py-4 px-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.status === "compliant"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-amber-100 text-amber-700"
                                                }`}>
                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

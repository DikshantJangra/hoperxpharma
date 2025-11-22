"use client";

import { useState } from "react";
import { FiShield, FiCheck, FiAlertCircle, FiDownload, FiFileText, FiGlobe } from "react-icons/fi";
import { MdSecurity, MdVerifiedUser } from "react-icons/md";

const complianceChecklist = [
    { id: 1, item: "Privacy Notice (HIPAA)", status: "compliant", description: "Notice of Privacy Practices provided to all patients" },
    { id: 2, item: "Patient Consent (GDPR)", status: "compliant", description: "Explicit consent obtained for data processing" },
    { id: 3, item: "Data Encryption", status: "compliant", description: "PHI encrypted at rest and in transit (AES-256)" },
    { id: 4, item: "Access Controls", status: "compliant", description: "Role-based access control implemented" },
    { id: 5, item: "Audit Logs", status: "compliant", description: "Comprehensive activity logging enabled" },
    { id: 6, item: "Breach Notification", status: "compliant", description: "72-hour notification protocol in place" },
    { id: 7, item: "Business Associate Agreements", status: "action-needed", description: "3 vendor agreements pending signature" },
    { id: 8, item: "Data Portability (GDPR)", status: "compliant", description: "Patient data export functionality active" },
    { id: 9, item: "Right to be Forgotten", status: "action-needed", description: "Automated deletion workflow pending" },
    { id: 10, item: "Cross-Border Transfers", status: "compliant", description: "Standard Contractual Clauses in place" }
];

const dataCategories = [
    { category: "Protected Health Information (PHI)", regulation: "HIPAA", retention: "6 years", volume: "15,230 records" },
    { category: "Personal Identifiable Information", regulation: "GDPR", retention: "As per consent", volume: "12,450 records" },
    { category: "Treatment Records", regulation: "HIPAA/GDPR", retention: "Lifetime", volume: "8,320 records" },
    { category: "Billing Information", regulation: "HIPAA", retention: "7 years", volume: "38,900 records" }
];

export default function HIPAAGDPRPage() {
    const [activeTab, setActiveTab] = useState("overview");

    const complianceScore = Math.round((complianceChecklist.filter(item => item.status === "compliant").length / complianceChecklist.length) * 100);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-[#0f172a] mb-1">HIPAA / GDPR Compliance</h1>
                            <p className="text-sm text-[#64748b]">International healthcare privacy regulations dashboard</p>
                        </div>
                        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2">
                            <FiDownload className="w-4 h-4" />
                            Compliance Report
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Compliance Score */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-8 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <FiGlobe className="w-5 h-5" />
                                <h2 className="text-lg font-semibold opacity-90">Overall Compliance Score</h2>
                            </div>
                            <div className="text-6xl font-bold mb-4">{complianceScore}%</div>
                            <p className="text-sm opacity-90">
                                {complianceChecklist.filter(i => i.status === "compliant").length} of {complianceChecklist.length} requirements met
                            </p>
                        </div>
                        <div className="w-32 h-32 rounded-full border-8 border-white border-opacity-30 flex items-center justify-center">
                            <MdVerifiedUser className="w-16 h-16" />
                        </div>
                    </div>
                </div>

                {/* Regulation Badges */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FiShield className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#0f172a]">HIPAA</h3>
                                <p className="text-xs text-[#64748b]">Health Insurance Portability and Accountability Act</p>
                            </div>
                        </div>
                        <p className="text-sm text-[#64748b]">
                            US federal law protecting sensitive patient health information from disclosure
                        </p>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                <FiGlobe className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#0f172a]">GDPR</h3>
                                <p className="text-xs text-[#64748b]">General Data Protection Regulation</p>
                            </div>
                        </div>
                        <p className="text-sm text-[#64748b]">
                            EU regulation on data protection and privacy for individuals within the European Union
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl mb-6">
                    <div className="flex border-b border-[#e2e8f0]">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "overview" ? "text-[#0ea5a3] border-b-2 border-[#0ea5a3]" : "text-[#64748b] hover:text-[#0f172a]"
                                }`}
                        >
                            Compliance Checklist
                        </button>
                        <button
                            onClick={() => setActiveTab("data")}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "data" ? "text-[#0ea5a3] border-b-2 border-[#0ea5a3]" : "text-[#64748b] hover:text-[#0f172a]"
                                }`}
                        >
                            Data Categories
                        </button>
                        <button
                            onClick={() => setActiveTab("rights")}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "rights" ? "text-[#0ea5a3] border-b-2 border-[#0ea5a3]" : "text-[#64748b] hover:text-[#0f172a]"
                                }`}
                        >
                            Patient Rights
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === "overview" && (
                            <div className="space-y-4">
                                {complianceChecklist.map((item) => (
                                    <div key={item.id} className="flex items-start gap-4 p-4 border border-[#e2e8f0] rounded-lg hover:shadow-sm transition-shadow">
                                        <div className="flex-shrink-0 mt-1">
                                            {item.status === "compliant" ? (
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
                                                <h4 className="font-semibold text-[#0f172a]">{item.item}</h4>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === "compliant"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {item.status === "compliant" ? "Compliant" : "Action Needed"}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#64748b]">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === "data" && (
                            <div>
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <FiFileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700">
                                            <strong>Data Inventory:</strong> Maintain comprehensive records of all PHI and personal data processing activities as required by HIPAA Privacy Rule and GDPR Article 30.
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#e2e8f0]">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Data Category</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Regulation</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Retention Period</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Volume</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dataCategories.map((record, idx) => (
                                                <tr key={idx} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                                                    <td className="py-4 px-4 font-medium text-[#0f172a]">{record.category}</td>
                                                    <td className="py-4 px-4">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                            {record.regulation}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-[#64748b]">{record.retention}</td>
                                                    <td className="py-4 px-4 text-right font-medium text-[#0f172a]">{record.volume}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === "rights" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 border border-[#e2e8f0] rounded-lg">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <FiFileText className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <h4 className="font-semibold text-[#0f172a]">Right to Access (HIPAA/GDPR)</h4>
                                        </div>
                                        <p className="text-sm text-[#64748b] mb-4">
                                            Patients can request and receive copies of their health records within 30 days (HIPAA) or 1 month (GDPR).
                                        </p>
                                        <div className="text-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-[#64748b]">Requests this month:</span>
                                                <span className="font-medium text-[#0f172a]">18</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#64748b]">Avg. response time:</span>
                                                <span className="font-medium text-green-600">12 days</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border border-[#e2e8f0] rounded-lg">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                <MdSecurity className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <h4 className="font-semibold text-[#0f172a]">Right to Rectification (GDPR)</h4>
                                        </div>
                                        <p className="text-sm text-[#64748b] mb-4">
                                            Patients can request correction of inaccurate or incomplete personal data.
                                        </p>
                                        <div className="text-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-[#64748b]">Requests this month:</span>
                                                <span className="font-medium text-[#0f172a]">9</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#64748b]">Avg. resolution:</span>
                                                <span className="font-medium text-green-600">5 days</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border border-[#e2e8f0] rounded-lg">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                                <FiAlertCircle className="w-5 h-5 text-red-600" />
                                            </div>
                                            <h4 className="font-semibold text-[#0f172a]">Right to Erasure (GDPR)</h4>
                                        </div>
                                        <p className="text-sm text-[#64748b] mb-4">
                                            Patients can request deletion of their data, subject to legal retention requirements.
                                        </p>
                                        <div className="text-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-[#64748b]">Requests this month:</span>
                                                <span className="font-medium text-[#0f172a]">4</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#64748b]">Processed:</span>
                                                <span className="font-medium text-green-600">3 completed</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border border-[#e2e8f0] rounded-lg">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                <FiShield className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h4 className="font-semibold text-[#0f172a]">Data Portability (GDPR)</h4>
                                        </div>
                                        <p className="text-sm text-[#64748b] mb-4">
                                            Patients can receive their data in a structured, machine-readable format.
                                        </p>
                                        <div className="text-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-[#64748b]">Requests this month:</span>
                                                <span className="font-medium text-[#0f172a]">6</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#64748b]">Format:</span>
                                                <span className="font-medium text-green-600">JSON/PDF</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Key Provisions */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <h3 className="font-semibold text-[#0f172a] mb-6">Key Regulatory Provisions</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <FiShield className="w-4 h-4 text-blue-600" />
                                <h4 className="font-medium text-blue-900">HIPAA Privacy Rule</h4>
                            </div>
                            <p className="text-sm text-blue-700">Protects PHI and establishes patient rights to access health information</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <MdSecurity className="w-4 h-4 text-blue-600" />
                                <h4 className="font-medium text-blue-900">HIPAA Security Rule</h4>
                            </div>
                            <p className="text-sm text-blue-700">Requires administrative, physical, and technical safeguards for ePHI</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                                <FiGlobe className="w-4 h-4 text-purple-600" />
                                <h4 className="font-medium text-purple-900">GDPR Article 5</h4>
                            </div>
                            <p className="text-sm text-purple-700">Principles of lawfulness, fairness, transparency, and data minimization</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                                <FiAlertCircle className="w-4 h-4 text-purple-600" />
                                <h4 className="font-medium text-purple-900">GDPR Article 33</h4>
                            </div>
                            <p className="text-sm text-purple-700">Breach notification to supervisory authority within 72 hours</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

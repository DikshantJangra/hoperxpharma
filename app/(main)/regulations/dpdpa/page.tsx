"use client";

import { useState } from "react";
import { FiShield, FiCheck, FiAlertCircle, FiDownload, FiFileText } from "react-icons/fi";
import { MdSecurity, MdVerifiedUser } from "react-icons/md";

const complianceChecklist = [
    { id: 1, item: "Data Processing Notice", status: "compliant", description: "Clear notice provided to all patients" },
    { id: 2, item: "Consent Management", status: "compliant", description: "Digital consent records maintained" },
    { id: 3, item: "Data Minimization", status: "compliant", description: "Only necessary data collected" },
    { id: 4, item: "Right to Access", status: "compliant", description: "Patient data access portal active" },
    { id: 5, item: "Right to Erasure", status: "action-needed", description: "Implement automated deletion workflow" },
    { id: 6, item: "Data Breach Protocol", status: "compliant", description: "72-hour notification process in place" },
    { id: 7, item: "Data Protection Officer", status: "compliant", description: "DPO appointed and contactable" },
    { id: 8, item: "Third-Party Agreements", status: "action-needed", description: "2 vendor agreements pending review" },
    { id: 9, item: "Audit Logs", status: "compliant", description: "Comprehensive activity logging enabled" },
    { id: 10, item: "Encryption", status: "compliant", description: "AES-256 encryption for data at rest" }
];

const dataProcessingRecords = [
    { category: "Patient Demographics", purpose: "Healthcare Service Delivery", retention: "10 years", volume: "12,450 records" },
    { category: "Medical History", purpose: "Treatment & Prescription", retention: "Lifetime", volume: "8,320 records" },
    { category: "Prescription Data", purpose: "Dispensing & Compliance", retention: "5 years", volume: "45,230 records" },
    { category: "Payment Information", purpose: "Billing & Accounting", retention: "7 years", volume: "38,900 records" }
];

export default function DPDPACompliancePage() {
    const [activeTab, setActiveTab] = useState("overview");

    const complianceScore = Math.round((complianceChecklist.filter(item => item.status === "compliant").length / complianceChecklist.length) * 100);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">DPDPA 2023 Compliance</h1>
                            <p className="text-sm text-[#64748b]">Digital Personal Data Protection Act compliance dashboard</p>
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
                <div className="bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] rounded-xl p-8 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold mb-2 opacity-90">Overall Compliance Score</h2>
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
                            onClick={() => setActiveTab("processing")}
                            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "processing" ? "text-[#0ea5a3] border-b-2 border-[#0ea5a3]" : "text-[#64748b] hover:text-[#0f172a]"
                                }`}
                        >
                            Data Processing
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

                        {activeTab === "processing" && (
                            <div>
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <FiFileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700">
                                            <strong>Record of Processing Activities:</strong> As per DPDPA Section 8, maintain detailed records of all data processing activities including purpose, categories, and retention periods.
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#e2e8f0]">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Data Category</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Processing Purpose</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Retention Period</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Volume</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dataProcessingRecords.map((record, idx) => (
                                                <tr key={idx} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                                                    <td className="py-4 px-4 font-medium text-[#0f172a]">{record.category}</td>
                                                    <td className="py-4 px-4 text-[#64748b]">{record.purpose}</td>
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
                                            <h4 className="font-semibold text-[#0f172a]">Right to Access</h4>
                                        </div>
                                        <p className="text-sm text-[#64748b] mb-4">
                                            Patients can request and receive a copy of their personal data within 30 days.
                                        </p>
                                        <div className="text-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-[#64748b]">Requests this month:</span>
                                                <span className="font-medium text-[#0f172a]">12</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#64748b]">Avg. response time:</span>
                                                <span className="font-medium text-green-600">8 days</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border border-[#e2e8f0] rounded-lg">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                                <FiAlertCircle className="w-5 h-5 text-red-600" />
                                            </div>
                                            <h4 className="font-semibold text-[#0f172a]">Right to Erasure</h4>
                                        </div>
                                        <p className="text-sm text-[#64748b] mb-4">
                                            Patients can request deletion of their data, subject to legal retention requirements.
                                        </p>
                                        <div className="text-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-[#64748b]">Requests this month:</span>
                                                <span className="font-medium text-[#0f172a]">3</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#64748b]">Processed:</span>
                                                <span className="font-medium text-green-600">2 completed</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border border-[#e2e8f0] rounded-lg">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                <MdSecurity className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <h4 className="font-semibold text-[#0f172a]">Right to Correction</h4>
                                        </div>
                                        <p className="text-sm text-[#64748b] mb-4">
                                            Patients can request correction of inaccurate or incomplete data.
                                        </p>
                                        <div className="text-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-[#64748b]">Requests this month:</span>
                                                <span className="font-medium text-[#0f172a]">7</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#64748b]">Avg. resolution:</span>
                                                <span className="font-medium text-green-600">3 days</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border border-[#e2e8f0] rounded-lg">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                <FiShield className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h4 className="font-semibold text-[#0f172a]">Consent Withdrawal</h4>
                                        </div>
                                        <p className="text-sm text-[#64748b] mb-4">
                                            Patients can withdraw consent for data processing at any time.
                                        </p>
                                        <div className="text-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-[#64748b]">Withdrawals this month:</span>
                                                <span className="font-medium text-[#0f172a]">5</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#64748b]">Processing time:</span>
                                                <span className="font-medium text-green-600">Immediate</span>
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
                    <h3 className="font-semibold text-[#0f172a] mb-6">Key DPDPA 2023 Provisions</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#f8fafc] rounded-lg">
                            <h4 className="font-medium text-[#0f172a] mb-2">Section 6: Notice & Consent</h4>
                            <p className="text-sm text-[#64748b]">Clear, specific consent required before processing personal data</p>
                        </div>
                        <div className="p-4 bg-[#f8fafc] rounded-lg">
                            <h4 className="font-medium text-[#0f172a] mb-2">Section 8: Data Accuracy</h4>
                            <p className="text-sm text-[#64748b]">Ensure data is complete, accurate, and up-to-date</p>
                        </div>
                        <div className="p-4 bg-[#f8fafc] rounded-lg">
                            <h4 className="font-medium text-[#0f172a] mb-2">Section 10: Data Security</h4>
                            <p className="text-sm text-[#64748b]">Implement reasonable security safeguards</p>
                        </div>
                        <div className="p-4 bg-[#f8fafc] rounded-lg">
                            <h4 className="font-medium text-[#0f172a] mb-2">Section 12: Breach Notification</h4>
                            <p className="text-sm text-[#64748b]">Report breaches to Data Protection Board within 72 hours</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

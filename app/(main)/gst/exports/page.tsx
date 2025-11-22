"use client";

import React, { useState, useEffect } from "react";
import { FiDownload, FiCalendar, FiFileText } from "react-icons/fi";

type ExportType = "invoices" | "gstr1" | "gstr3b" | "itc" | "summary";
type ExportFormat = "csv" | "json" | "pdf" | "excel";

const TableRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-12"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-6 py-4 text-center"><div className="h-8 bg-gray-200 rounded-md w-24 mx-auto"></div></td>
    </tr>
)

export default function AuditExportsPage() {
    const [exportType, setExportType] = useState<ExportType>("invoices");
    const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
    const [startDate, setStartDate] = useState("2024-01-01");
    const [endDate, setEndDate] = useState("2024-01-31");
    const [recentExports, setRecentExports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setRecentExports([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [])

    const handleExport = () => {
        alert(`Exporting ${exportType} as ${exportFormat.toUpperCase()} for ${startDate} to ${endDate}`);
    };

    const exportOptions = [
        {
            id: "invoices" as ExportType,
            title: "All Invoices",
            description: "Complete invoice register with all transactions",
            formats: ["csv", "pdf", "excel"] as ExportFormat[]
        },
        {
            id: "gstr1" as ExportType,
            title: "GSTR-1 Data",
            description: "Outward supplies data for GST portal upload",
            formats: ["json", "csv"] as ExportFormat[]
        },
        {
            id: "gstr3b" as ExportType,
            title: "GSTR-3B Data",
            description: "Summary return data with tax liability",
            formats: ["json", "csv"] as ExportFormat[]
        },
        {
            id: "itc" as ExportType,
            title: "ITC Register",
            description: "Input Tax Credit register with all purchases",
            formats: ["excel", "csv"] as ExportFormat[]
        },
        {
            id: "summary" as ExportType,
            title: "Tax Liability Summary",
            description: "Comprehensive tax summary for accountant",
            formats: ["pdf", "excel"] as ExportFormat[]
        }
    ];

    const selectedOption = exportOptions.find(opt => opt.id === exportType);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <FiFileText className="h-8 w-8 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Audit-Ready Exports</h1>
                            <p className="text-sm text-gray-500">Generate exports for tax accountants and auditors</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Export Type Selection */}
                    <div className="lg:col-span-2">
                        <h3 className="font-bold text-gray-900 mb-4">Select Export Type</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {exportOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setExportType(option.id)}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${exportType === option.id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 mb-1">{option.title}</h4>
                                            <p className="text-sm text-gray-600">{option.description}</p>
                                            <div className="flex gap-2 mt-3">
                                                {option.formats.map((format) => (
                                                    <span
                                                        key={format}
                                                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded uppercase"
                                                    >
                                                        {format}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {exportType === option.id && (
                                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 ml-4">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Export Configuration */}
                    <div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-4">Export Configuration</h3>

                            {/* Date Range */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FiCalendar className="h-4 w-4" />
                                    Date Range
                                </label>
                                <div className="space-y-2">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Format Selection */}
                            {selectedOption && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Export Format
                                    </label>
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {selectedOption.formats.map((format) => (
                                            <option key={format} value={format}>
                                                {format.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Export Button */}
                            <button
                                onClick={handleExport}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <FiDownload className="h-5 w-5" />
                                Generate Export
                            </button>

                            {/* Info */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-semibold text-blue-900 text-sm mb-2">Export Details</h4>
                                <ul className="text-xs text-blue-800 space-y-1">
                                    <li>• All exports include timestamps</li>
                                    <li>• Data is audit-ready and compliant</li>
                                    <li>• JSON format for GST portal upload</li>
                                    <li>• Excel includes formulas and summaries</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Exports */}
                <div className="mt-8">
                    <h3 className="font-bold text-gray-900 mb-4">Recent Exports</h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Export Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Format</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Generated</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? (
                                    <>
                                        <TableRowSkeleton/>
                                        <TableRowSkeleton/>
                                    </>
                                ) : recentExports.length > 0 ? (
                                    recentExports.map(exp => (
                                        <tr key={exp.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{exp.type}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{exp.period}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded uppercase">{exp.format}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{exp.generated}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                                                    Download
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-500">No recent exports found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

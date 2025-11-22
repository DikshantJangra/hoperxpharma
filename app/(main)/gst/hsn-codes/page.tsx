"use client";

import React, { useState } from "react";
import { FiSearch, FiBook } from "react-icons/fi";

interface HSNCode {
    code: string;
    description: string;
    gstRate: number;
    category: string;
    examples: string[];
}

const HSN_DIRECTORY: HSNCode[] = [
    {
        code: "3002",
        description: "Human blood; animal blood for therapeutic, prophylactic or diagnostic uses; antisera, other blood fractions and immunological products",
        gstRate: 5,
        category: "Vaccines & Sera",
        examples: ["Vaccines", "Immunoglobulins", "Blood products", "Antisera"]
    },
    {
        code: "3003",
        description: "Medicaments (excluding goods of heading 3002, 3005 or 3006) consisting of two or more constituents mixed together for therapeutic or prophylactic uses, not put up in measured doses or in forms or packings for retail sale",
        gstRate: 12,
        category: "Generic Medicines",
        examples: ["Bulk medicines", "Generic formulations", "Unbranded medicines"]
    },
    {
        code: "3004",
        description: "Medicaments (excluding goods of heading 3002, 3005 or 3006) consisting of mixed or unmixed products for therapeutic or prophylactic uses, put up in measured doses or in forms or packings for retail sale",
        gstRate: 12,
        category: "Medicaments",
        examples: ["Tablets", "Capsules", "Syrups", "Ointments", "Injections"]
    },
    {
        code: "300410",
        description: "Medicaments containing penicillins or derivatives thereof, with a penicillanic acid structure, or streptomycins or their derivatives",
        gstRate: 12,
        category: "Antibiotics",
        examples: ["Penicillin", "Amoxicillin", "Ampicillin", "Streptomycin"]
    },
    {
        code: "300420",
        description: "Medicaments containing other antibiotics",
        gstRate: 12,
        category: "Antibiotics",
        examples: ["Azithromycin", "Ciprofloxacin", "Cephalosporins"]
    },
    {
        code: "300431",
        description: "Medicaments containing insulin",
        gstRate: 5,
        category: "Essential Medicines",
        examples: ["Insulin injections", "Insulin analogs"]
    },
    {
        code: "300432",
        description: "Medicaments containing corticosteroid hormones, their derivatives or structural analogues",
        gstRate: 12,
        category: "Hormones",
        examples: ["Prednisolone", "Dexamethasone", "Hydrocortisone"]
    },
    {
        code: "300490",
        description: "Other medicaments",
        gstRate: 12,
        category: "Other Medicines",
        examples: ["Analgesics", "Antipyretics", "Antihistamines"]
    },
    {
        code: "9018",
        description: "Instruments and appliances used in medical, surgical, dental or veterinary sciences",
        gstRate: 18,
        category: "Medical Devices",
        examples: ["Thermometers", "Blood pressure monitors", "Surgical instruments", "Diagnostic equipment"]
    }
];

export default function HSNCodeDirectoryPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCodes = HSN_DIRECTORY.filter(hsn =>
        hsn.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hsn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hsn.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hsn.examples.some(ex => ex.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        <FiBook className="h-8 w-8 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">HSN Code Directory</h1>
                            <p className="text-sm text-gray-500">Searchable directory of HSN codes for pharmaceutical products</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by HSN code, description, category, or medicine name..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                    Showing <span className="font-semibold">{filteredCodes.length}</span> HSN codes
                </div>

                {/* HSN Code Cards */}
                <div className="space-y-4">
                    {filteredCodes.map((hsn) => (
                        <div key={hsn.code} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="px-4 py-2 bg-blue-100 rounded-lg">
                                        <span className="text-2xl font-bold text-blue-900 font-mono">{hsn.code}</span>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 text-lg">{hsn.category}</div>
                                        <div className="text-sm text-gray-600">Chapter 30 - Pharmaceutical Products</div>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-full font-bold ${hsn.gstRate === 0 ? "bg-gray-100 text-gray-700" :
                                        hsn.gstRate === 5 ? "bg-green-100 text-green-700" :
                                            hsn.gstRate === 12 ? "bg-blue-100 text-blue-700" :
                                                "bg-amber-100 text-amber-700"
                                    }`}>
                                    {hsn.gstRate}% GST
                                </div>
                            </div>

                            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                                {hsn.description}
                            </p>

                            <div>
                                <div className="text-sm font-semibold text-gray-700 mb-2">Examples:</div>
                                <div className="flex flex-wrap gap-2">
                                    {hsn.examples.map((example, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                        >
                                            {example}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredCodes.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No HSN codes found for "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}

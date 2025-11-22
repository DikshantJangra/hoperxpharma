"use client";

import React, { useState } from "react";
import { FiSearch, FiCheck } from "react-icons/fi";

interface HSNCode {
    code: string;
    description: string;
    gstRate: number;
    category: string;
}

const COMMON_HSN_CODES: HSNCode[] = [
    { code: "3004", description: "Medicaments (tablets, syrups, ointments)", gstRate: 12, category: "Standard Medicines" },
    { code: "3003", description: "Generic and branded medicines", gstRate: 12, category: "Standard Medicines" },
    { code: "3002", description: "Vaccines and sera", gstRate: 5, category: "Essential Medicines" },
    { code: "300410", description: "Antibiotics", gstRate: 12, category: "Standard Medicines" },
    { code: "300420", description: "Hormones and derivatives", gstRate: 12, category: "Standard Medicines" },
    { code: "300431", description: "Insulin", gstRate: 5, category: "Essential Medicines" },
    { code: "300432", description: "Corticosteroid hormones", gstRate: 12, category: "Standard Medicines" },
    { code: "300490", description: "Other medicaments", gstRate: 12, category: "Standard Medicines" }
];

interface HSNCodeSelectorProps {
    value?: string;
    onChange: (hsnCode: HSNCode) => void;
    placeholder?: string;
}

export default function HSNCodeSelector({ value, onChange, placeholder = "Search HSN code or description..." }: HSNCodeSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedHSN, setSelectedHSN] = useState<HSNCode | null>(
        value ? COMMON_HSN_CODES.find(h => h.code === value) || null : null
    );

    const filteredCodes = COMMON_HSN_CODES.filter(
        (hsn) =>
            hsn.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hsn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hsn.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (hsn: HSNCode) => {
        setSelectedHSN(hsn);
        onChange(hsn);
        setIsOpen(false);
        setSearchQuery("");
    };

    return (
        <div className="relative">
            {/* Input */}
            <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    value={selectedHSN ? `${selectedHSN.code} - ${selectedHSN.description}` : searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsOpen(true);
                        if (selectedHSN) setSelectedHSN(null);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {selectedHSN && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                            {selectedHSN.gstRate}% GST
                        </span>
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && filteredCodes.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto">
                    {filteredCodes.map((hsn) => (
                        <button
                            key={hsn.code}
                            onClick={() => handleSelect(hsn)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-900">{hsn.code}</span>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                            {hsn.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{hsn.description}</p>
                                </div>
                                <div className="ml-4 shrink-0">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                                        {hsn.gstRate}%
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results */}
            {isOpen && searchQuery && filteredCodes.length === 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
                    No HSN codes found for "{searchQuery}"
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}

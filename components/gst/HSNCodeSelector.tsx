"use client";

import React, { useState, useEffect } from "react";
import { FiSearch, FiCheck } from "react-icons/fi";

interface HSNCode {
    code: string;
    description: string;
    gstRate: number;
    category: string;
}

interface HSNCodeSelectorProps {
    value?: string;
    onChange: (hsnCode: HSNCode) => void;
    placeholder?: string;
}

const HSNCodeSkeleton = () => (
    <div className="w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 animate-pulse">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="ml-4 shrink-0 h-6 w-12 bg-gray-200 rounded-full"></div>
        </div>
    </div>
)

export default function HSNCodeSelector({ value, onChange, placeholder = "Search HSN code or description..." }: HSNCodeSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [hsnCodes, setHsnCodes] = useState<HSNCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedHSN, setSelectedHSN] = useState<HSNCode | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setHsnCodes([]); // No HSN codes initially
            setSelectedHSN(value ? hsnCodes.find(h => h.code === value) || null : null);
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, [value]);

    const filteredCodes = hsnCodes.filter(
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
                    disabled={isLoading}
                />
                {selectedHSN && !isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                            {selectedHSN.gstRate}% GST
                        </span>
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (isLoading || filteredCodes.length > 0) && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <>
                            <HSNCodeSkeleton/>
                            <HSNCodeSkeleton/>
                            <HSNCodeSkeleton/>
                        </>
                    ) : (
                        filteredCodes.map((hsn) => (
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
                        ))
                    )}
                </div>
            )}

            {/* No results */}
            {isOpen && !isLoading && searchQuery && filteredCodes.length === 0 && (
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

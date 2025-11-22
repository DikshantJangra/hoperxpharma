"use client";

import React, { useState, useEffect } from "react";
import { FiSearch, FiBook } from "react-icons/fi";

interface HSNCode {
    code: string;
    description: string;
    gstRate: number;
    category: string;
    examples: string[];
}

const HSNCardSkeleton = () => (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gray-100 rounded-lg h-12 w-24"></div>
                <div>
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-32"></div>
                </div>
            </div>
            <div className="h-8 w-20 bg-gray-100 rounded-full"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-4 bg-gray-100 rounded w-1/4 mb-2"></div>
        <div className="flex flex-wrap gap-2">
            <div className="h-8 bg-gray-100 rounded-full w-24"></div>
            <div className="h-8 bg-gray-100 rounded-full w-32"></div>
            <div className="h-8 bg-gray-100 rounded-full w-20"></div>
        </div>
    </div>
)

export default function HSNCodeDirectoryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [hsnDirectory, setHsnDirectory] = useState<HSNCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setHsnDirectory([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [])

    const filteredCodes = hsnDirectory.filter(hsn =>
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
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                    {isLoading ? (
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    ) : (
                        `Showing ${filteredCodes.length} HSN codes`
                    )}
                </div>

                {/* HSN Code Cards */}
                <div className="space-y-4">
                    {isLoading ? (
                        <>
                            <HSNCardSkeleton/>
                            <HSNCardSkeleton/>
                            <HSNCardSkeleton/>
                        </>
                    ) : filteredCodes.length > 0 ? (
                        filteredCodes.map((hsn) => (
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
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No HSN codes found for "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

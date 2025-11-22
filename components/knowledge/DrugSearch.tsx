"use client";

import { useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { TbPill } from "react-icons/tb";

interface DrugSearchProps {
    onSearch?: (query: string) => void;
}

export default function DrugSearch({ onSearch = () => {} }: DrugSearchProps) {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    };

    const clearSearch = () => {
        setQuery("");
        onSearch("");
    };

    const suggestions = [
        { name: "Dolo 650", type: "Brand" },
        { name: "Paracetamol", type: "Generic" },
        { name: "Pan D", type: "Brand" },
        { name: "Azithromycin", type: "Generic" }
    ];

    return (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiSearch className={`h-5 w-5 transition-colors ${
                            isFocused ? "text-blue-600" : "text-gray-400"
                        }`} />
                    </div>
                    <input
                        type="text"
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="Search by drug name, generic salt, brand, or condition..."
                        value={query}
                        onChange={handleSearch}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    />
                    {query && (
                        <button
                            onClick={clearSearch}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <FiX className="h-5 w-5" />
                        </button>
                    )}

                    {/* Autocomplete Dropdown */}
                    {isFocused && query.length > 1 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                                Suggestions
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {suggestions.map((item, i) => (
                                    <button
                                        key={i}
                                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center justify-between gap-3 transition-colors"
                                        onClick={() => {
                                            setQuery(item.name);
                                            onSearch(item.name);
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <TbPill className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-700">{item.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {item.type}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

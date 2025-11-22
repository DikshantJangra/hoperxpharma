"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiSearch, FiPlus, FiX } from "react-icons/fi";

interface DrugMultiSearchProps {
    onAdd: (item: string) => void;
    placeholder?: string;
}

export default function DrugMultiSearch({ onAdd, placeholder = "Add drug or condition..." }: DrugMultiSearchProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Mock suggestions
    const suggestions = [
        "Aspirin",
        "Warfarin",
        "Metformin",
        "Alcohol",
        "Ibuprofen",
        "Lisinopril",
        "Atorvastatin",
        "Clopidogrel",
        "Pregnancy",
        "Liver Disease",
        "Kidney Failure"
    ];

    const filteredSuggestions = suggestions.filter(item =>
        item.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (item: string) => {
        onAdd(item);
        setQuery("");
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                        <FiPlus className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {isOpen && query.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2 duration-150">
                    {filteredSuggestions.length > 0 ? (
                        <ul className="py-1">
                            {filteredSuggestions.map((item) => (
                                <li key={item}>
                                    <button
                                        onClick={() => handleSelect(item)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm text-gray-700 flex items-center justify-between group transition-colors"
                                    >
                                        <span>{item}</span>
                                        <FiPlus className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No matches found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

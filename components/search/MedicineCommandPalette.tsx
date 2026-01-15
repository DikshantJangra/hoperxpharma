'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiClock, FiX, FiAlertCircle } from 'react-icons/fi';
import { useMedicineSearch } from '@/hooks/useMedicineSearch';
import { medicineSearch } from '@/lib/search/medicineSearch';
import type { Medicine } from '@/types/medicine';

interface MedicineCommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (medicine: Medicine) => void;
}

export default function MedicineCommandPalette({
    isOpen,
    onClose,
    onSelect
}: MedicineCommandPaletteProps) {
    const {
        query,
        setQuery,
        results,
        loading,
        indexLoaded,
        recentMedicines,
        addToRecent
    } = useMedicineSearch();

    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            const displayItems = query ? results : recentMedicines;
            const maxIndex = displayItems.length - 1;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (displayItems[selectedIndex]) {
                        handleSelect(displayItems[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, query, results, recentMedicines, selectedIndex, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (resultsRef.current) {
            const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    const handleSelect = useCallback((medicine: Medicine) => {
        addToRecent(medicine);
        onSelect(medicine);
        onClose();
        setQuery('');
    }, [addToRecent, onSelect, onClose, setQuery]);

    if (!isOpen) return null;

    const displayItems = query ? results : recentMedicines;
    const showRecent = !query && recentMedicines.length > 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Command Palette */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] pointer-events-none">
                <div className="w-full max-w-2xl mx-4 pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                            <FiSearch className="text-gray-400" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search medicines by name, composition, or manufacturer..."
                                className="flex-1 text-base outline-none placeholder:text-gray-400"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    <FiX className="text-gray-400" size={18} />
                                </button>
                            )}
                            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded border border-gray-200">
                                ESC
                            </kbd>
                        </div>

                        {/* Loading State */}
                        {!indexLoaded && (
                            <div className="px-4 py-8 text-center">
                                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    Loading medicine catalog...
                                </div>
                            </div>
                        )}

                        {/* Searching State */}
                        {indexLoaded && loading && query && (
                            <div className="px-4 py-8 text-center">
                                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    Searching for "{query}"...
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {indexLoaded && !loading && (
                            <div className="max-h-[60vh] overflow-y-auto" ref={resultsRef}>
                                {/* Section Header */}
                                {displayItems.length > 0 && (
                                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 sticky top-0">
                                        {showRecent ? (
                                            <div className="flex items-center gap-2">
                                                <FiClock size={14} />
                                                Recent
                                            </div>
                                        ) : (
                                            `${results.length} result${results.length !== 1 ? 's' : ''}`
                                        )}
                                    </div>
                                )}

                                {/* Medicine Items */}
                                {displayItems.map((medicine, index) => (
                                    <button
                                        key={medicine.id}
                                        onClick={() => handleSelect(medicine)}
                                        className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-0 ${index === selectedIndex
                                            ? 'bg-emerald-50 border-l-2 border-l-emerald-500'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {medicine.name}
                                                </div>
                                                {medicine.composition && (
                                                    <div className="text-sm text-gray-600 truncate mt-0.5">
                                                        {medicine.composition}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                                    <span className="truncate">{medicine.manufacturer}</span>
                                                    <span>•</span>
                                                    <span className="shrink-0">{medicine.packSize}</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <div className="font-semibold text-emerald-600">
                                                    ₹{medicine.price.toFixed(2)}
                                                </div>
                                                {medicine.discontinued && (
                                                    <div className="text-xs text-red-600 mt-1">
                                                        Discontinued
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {/* Empty State */}
                                {displayItems.length === 0 && query && !loading && (
                                    <div className="px-4 py-12 text-center">
                                        <FiAlertCircle className="mx-auto text-gray-300 mb-3" size={32} />
                                        <p className="text-sm text-gray-500">
                                            No medicines found for "{query}"
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Try searching by brand name, salt, or manufacturer
                                        </p>
                                    </div>
                                )}

                                {/* No Recent */}
                                {displayItems.length === 0 && !query && (
                                    <div className="px-4 py-12 text-center">
                                        <FiSearch className="mx-auto text-gray-300 mb-3" size={32} />
                                        <p className="text-sm text-gray-500">
                                            Start typing to search medicines
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Search by name, composition, or manufacturer
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↑↓</kbd>
                                        <span>Navigate</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↵</kbd>
                                        <span>Select</span>
                                    </div>
                                </div>
                                {indexLoaded && (
                                    <div className="text-gray-400">
                                        {medicineSearch.getTotalCount().toLocaleString()} medicines
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

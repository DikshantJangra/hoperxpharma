import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';

interface Supplier {
    id: string;
    name: string;
    gstin?: string;
    paymentTerms?: string;
    defaultLeadTimeDays: number;
}

interface SupplierChipProps {
    value?: Supplier;
    onChange: (supplier: Supplier) => void;
}

export default function SupplierChip({ value, onChange }: SupplierChipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadSuppliers();
        }
    }, [isOpen]);

    const loadSuppliers = async () => {
        setLoading(true);
        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiBaseUrl}/purchase-orders/suppliers?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                setSuppliers(result.data || result.results || []);
            }
        } catch (error) {
            console.error('Failed to load suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.gstin?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (supplier: Supplier) => {
        onChange(supplier);
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined as any);
    };

    return (
        <div className="relative">
            {/* Selected Supplier or Dropdown Trigger */}
            {value ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-emerald-900 truncate">{value.name}</div>
                        {value.gstin && (
                            <div className="text-xs text-emerald-600 truncate">GSTIN: {value.gstin}</div>
                        )}
                    </div>
                    <button
                        onClick={handleClear}
                        className="shrink-0 text-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                        <FiX size={16} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <span className="text-sm text-gray-500">Select supplier...</span>
                    <FiChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />
                </button>
            )}

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-80 rounded-lg border border-gray-200 overflow-hidden">
                        {/* Search */}
                        <div className="p-2 border-b border-gray-200">
                            <input
                                type="text"
                                placeholder="Search suppliers..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                autoFocus
                            />
                        </div>

                        {/* Supplier List */}
                        <div className="max-h-64 overflow-y-auto">
                            {loading ? (
                                <div className="px-4 py-3 text-sm text-gray-500">Loading suppliers...</div>
                            ) : filteredSuppliers.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500">No suppliers found</div>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <button
                                        key={supplier.id}
                                        onClick={() => handleSelect(supplier)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                    >
                                        <div className="font-medium text-sm text-gray-900">{supplier.name}</div>
                                        {supplier.gstin && (
                                            <div className="text-xs text-gray-500 mt-1">GSTIN: {supplier.gstin}</div>
                                        )}
                                        {supplier.paymentTerms && (
                                            <div className="text-xs text-gray-400 mt-1">Terms: {supplier.paymentTerms}</div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

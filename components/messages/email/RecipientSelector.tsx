'use client';

import { useState, useRef, useEffect } from 'react';
import { FiX, FiUser, FiUsers, FiPackage } from 'react-icons/fi';

interface Recipient {
    id: string;
    name: string;
    email: string;
    type: 'patient' | 'prescriber' | 'supplier' | 'manual';
    subtitle?: string; // Phone, specialty, etc.
}

interface RecipientSelectorProps {
    value: Recipient[];
    onChange: (recipients: Recipient[]) => void;
    placeholder?: string;
    label?: string;
}

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

export default function RecipientSelector({ value = [], onChange, placeholder = "Type to search patients, doctors...", label }: RecipientSelectorProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<any>({ patients: [], prescribers: [], suppliers: [], total: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Search contacts when query changes
    useEffect(() => {
        if (query.length >= 2) {
            searchContacts(query);
        } else {
            setResults({ patients: [], prescribers: [], suppliers: [], total: 0 });
        }
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchContacts = async (searchQuery: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/email/contacts/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data.data || { patients: [], prescribers: [], suppliers: [], total: 0 });
                setIsOpen(true);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addRecipient = (contact: any, type: 'patient' | 'prescriber' | 'supplier', event?: React.MouseEvent) => {
        // Prevent form submission
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (!contact.email) return;

        const newRecipient: Recipient = {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            type,
            subtitle: type === 'prescriber' ? contact.specialty : contact.phoneNumber,
        };

        // Check if already added
        if (!value.find(r => r.email === newRecipient.email)) {
            onChange([...value, newRecipient]);
        }

        setQuery('');
        setIsOpen(false);
        inputRef.current?.focus(); // Keep focus for keyboard navigation
    };

    const addManualEmail = (event?: React.MouseEvent) => {
        // Prevent form submission
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(query) && !value.find(r => r.email === query)) {
            const manualRecipient: Recipient = {
                id: `manual-${Date.now()}`,
                name: query,
                email: query,
                type: 'manual',
            };
            onChange([...value, manualRecipient]);
            setQuery('');
            setIsOpen(false);
        }
    };

    const removeRecipient = (email: string) => {
        onChange(value.filter(r => r.email !== email));
    };

    const getTypeIcon = (type: Recipient['type']) => {
        switch (type) {
            case 'patient':
                return <FiUser className="w-3 h-3" />;
            case 'prescriber':
                return <FiUsers className="w-3 h-3" />;
            case 'supplier':
                return <FiPackage className="w-3 h-3" />;
            default:
                return <FiUser className="w-3 h-3" />;
        }
    };

    const getTypeColor = (type: Recipient['type']) => {
        switch (type) {
            case 'patient':
                return 'bg-blue-100 text-blue-700';
            case 'prescriber':
                return 'bg-purple-100 text-purple-700';
            case 'supplier':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && <label className="block text-sm font-medium text-[#0f172a] mb-2">{label}</label>}

            {/* Selected Recipients Chips */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {value.map((recipient) => (
                        <div
                            key={recipient.email}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getTypeColor(recipient.type)}`}
                        >
                            {getTypeIcon(recipient.type)}
                            <span className="max-w-[200px] truncate">{recipient.name}</span>
                            <button
                                onClick={() => removeRecipient(recipient.email)}
                                className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                            >
                                <FiX className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    onKeyDown={(e) => {
                        const allResults = [
                            ...(results.patients || []).map((p: any) => ({ ...p, _type: 'patient' })),
                            ...(results.prescribers || []).map((p: any) => ({ ...p, _type: 'prescriber' })),
                            ...(results.suppliers || []).map((s: any) => ({ ...s, _type: 'supplier' }))
                        ];

                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHighlightedIndex(prev => prev < allResults.length - 1 ? prev + 1 : 0);
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightedIndex(prev => prev > 0 ? prev - 1 : allResults.length - 1);
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation(); // CRITICAL: Prevent form submission
                            if (highlightedIndex >= 0 && allResults[highlightedIndex]) {
                                const selected = allResults[highlightedIndex];
                                addRecipient(selected, selected._type);
                                setHighlightedIndex(-1);
                            } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) {
                                addManualEmail();
                            }
                        }
                    }}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                />
                {isLoading && (
                    <div className="absolute right-3 top-3">
                        <div className="w-5 h-5 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && results.total > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-80 overflow-auto">
                    {/* Patients */}
                    {results.patients?.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-[#f8fafc] border-b border-[#e2e8f0]">
                                <p className="text-xs font-semibold text-[#64748b] uppercase">Patients</p>
                            </div>
                            {results.patients.map((patient: any) => (
                                <button
                                    key={patient.id}
                                    type="button"
                                    onClick={(e) => addRecipient(patient, 'patient', e)}
                                    className="w-full px-4 py-3 text-left hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <FiUser className="w-4 h-4 text-blue-700" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[#0f172a] truncate">{patient.name}</p>
                                            <p className="text-sm text-[#64748b] truncate">{patient.email}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Prescribers */}
                    {results.prescribers?.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-[#f8fafc] border-b border-[#e2e8f0]">
                                <p className="text-xs font-semibold text-[#64748b] uppercase">Prescribers</p>
                            </div>
                            {results.prescribers.map((prescriber: any) => (
                                <button
                                    key={prescriber.id}
                                    type="button"
                                    onClick={(e) => addRecipient(prescriber, 'prescriber', e)}
                                    className="w-full px-4 py-3 text-left hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                            <FiUsers className="w-4 h-4 text-purple-700" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[#0f172a] truncate">{prescriber.name}</p>
                                            <p className="text-sm text-[#64748b] truncate">
                                                {prescriber.email} {prescriber.specialty && `• ${prescriber.specialty}`}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Suppliers */}
                    {results.suppliers?.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-[#f8fafc] border-b border-[#e2e8f0]">
                                <p className="text-xs font-semibold text-[#64748b] uppercase">Suppliers</p>
                            </div>
                            {results.suppliers.map((supplier: any) => (
                                <button
                                    key={supplier.id}
                                    type="button"
                                    onClick={(e) => addRecipient(supplier, 'supplier', e)}
                                    className="w-full px-4 py-3 text-left hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                            <FiPackage className="w-4 h-4 text-orange-700" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[#0f172a] truncate">{supplier.name}</p>
                                            <p className="text-sm text-[#64748b] truncate">{supplier.email}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Manual Email Entry Option */}
                    {query && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query) &&
                        !value.find(r => r.email === query) && (
                            <button
                                type="button"
                                onClick={(e) => addManualEmail(e)}
                                className="w-full px-4 py-3 text-left hover:bg-[#f8fafc] transition-colors border-t border-[#e2e8f0]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                        <FiUser className="w-4 h-4 text-gray-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#64748b]">Add custom email</p>
                                        <p className="font-medium text-[#0f172a]">{query}</p>
                                    </div>
                                </div>
                            </button>
                        )}
                </div>
            )}

            {/* No Results */}
            {isOpen && query.length >= 2 && results.total === 0 && !isLoading && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg p-4 text-center">
                    <p className="text-sm text-[#64748b]">No contacts found</p>
                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query) && (
                        <button
                            type="button"
                            onClick={(e) => addManualEmail(e)}
                            className="mt-2 text-sm text-[#10b981] hover:text-[#059669] font-medium"
                        >
                            Add "{query}" as custom email
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

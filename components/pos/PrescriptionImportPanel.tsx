'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiFileText, FiX, FiCheck, FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { prescriptionApi } from '@/lib/api/prescriptions';
import { toast } from 'sonner';

interface PrescriptionImportPanelProps {
    onSelect: (rx: any) => void;
    onClose: () => void;
}

export default function PrescriptionImportPanel({ onSelect, onClose }: PrescriptionImportPanelProps) {
    const [search, setSearch] = useState('');
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus search input
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Load prescriptions on mount
    useEffect(() => {
        loadPrescriptions();
    }, []);

    // Search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            loadPrescriptions();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const loadPrescriptions = async () => {
        setIsLoading(true);
        try {
            const response = await prescriptionApi.getVerifiedPrescriptions(search);
            if (response && response.data) {
                setPrescriptions(response.data);
            }
        } catch (error) {
            console.error('Failed to load prescriptions:', error);
            toast.error('Failed to load verified prescriptions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = async (rx: any) => {
        const toastId = toast.loading(`Loading full details for ${rx.patient?.firstName}...`);
        try {
            // CRITICAL: Fetch FULL prescription details to match "Dispense Now" logic
            // getVerifiedPrescriptions returns a simplified version which might miss stock info
            const fullRx = await prescriptionApi.getPrescriptionById(rx.id);

            if (fullRx && (fullRx.data || fullRx)) {
                onSelect(fullRx.data || fullRx);
                onClose();
                toast.success('Prescription loaded successfully', { id: toastId });
            } else {
                toast.error('Could not fetch complete prescription data', { id: toastId });
            }
        } catch (error) {
            console.error('Fetch detail error:', error);
            toast.error('Error fetching full prescription details', { id: toastId });
        }
    };

    return (
        <div className="bg-white border-b border-gray-200 shadow-lg animate-in slide-in-from-top duration-300 overflow-hidden">
            {/* Header / Search Bar */}
            <div className="px-6 py-4 flex items-center gap-6 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-3 text-blue-700">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FiFileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm tracking-tight">IMPORT PRESCRIPTION</h3>
                        <p className="text-[10px] uppercase font-semibold text-blue-500/80">Search Verified Orders</p>
                    </div>
                </div>

                <div className="flex-1 relative max-w-2xl">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Type Patient Name, Phone, or Rx ID..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded">F6 to Toggle</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-400">ESC to Close</span>
                </div>

                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                    <FiX className="w-6 h-6" />
                </button>
            </div>

            {/* Horizontal Results Area */}
            <div className="px-6 py-4 bg-gray-50 min-h-[160px] max-h-[400px] overflow-y-auto">
                {isLoading ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="min-w-[300px] h-[100px] bg-white rounded-xl animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : prescriptions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {prescriptions.map((rx) => (
                            <button
                                key={rx.id}
                                onClick={() => handleSelect(rx)}
                                className="group flex flex-col text-left bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all relative overflow-hidden"
                            >
                                {/* Active Indicator */}
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-blue-500 text-white p-1 rounded-full shadow-lg">
                                        <FiCheck className="w-3 h-3" />
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 mb-2">
                                    <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                                        <FiUser className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-900 truncate">
                                            {rx.patient?.firstName} {rx.patient?.lastName}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-medium tracking-wide font-mono">
                                            #{rx.prescriptionNumber || rx.id.slice(-8)}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-50 pt-3">
                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                        <FiCalendar className="w-3 h-3" />
                                        {rx.updatedAt ? new Date(rx.updatedAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded group-hover:bg-blue-500 group-hover:text-white transition-colors uppercase">
                                        {rx.items?.length || 0} Items
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <FiFileText className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No verified prescriptions found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

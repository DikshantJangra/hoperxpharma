'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSearch, FiFileText, FiUser, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import { prescriptionApi } from '@/lib/api/prescriptions';

const PrescriptionCardSkeleton = () => (
    <div className="p-3 border border-[#e2e8f0] rounded-lg animate-pulse bg-white">
        <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        </div>
    </div>
);

interface PrescriptionImportModalProps {
    onSelect: (prescription: any) => void;
    onClose: () => void;
}

export default function PrescriptionImportModal({ onSelect, onClose }: PrescriptionImportModalProps) {
    const [search, setSearch] = useState('');
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load prescriptions on mount
    useEffect(() => {
        loadPrescriptions();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            loadPrescriptions();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const handleSelect = (rx: any) => {
        if (!rx.items || rx.items.length === 0) {
            toast.error('This prescription has no items');
            return;
        }
        onSelect(rx);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-2xl mx-4 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <FiFileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#0f172a]">Import Verified Prescription</h3>
                            <p className="text-xs text-gray-500">Select a verified prescription to load items</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#64748b] hover:text-[#0f172a] p-2 rounded-lg hover:bg-[#e2e8f0] transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-[#e2e8f0]">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by Patient Name, Phone, or Rx ID..."
                            className="w-full pl-10 pr-4 py-2.5 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 flex-1 bg-gray-50/50 space-y-3 min-h-[300px]">
                    {isLoading ? (
                        <>
                            <PrescriptionCardSkeleton />
                            <PrescriptionCardSkeleton />
                            <PrescriptionCardSkeleton />
                        </>
                    ) : prescriptions.length > 0 ? (
                        prescriptions.map((rx) => (
                            <div
                                key={rx.id}
                                onClick={() => handleSelect(rx)}
                                className="group p-4 bg-white border border-[#e2e8f0] rounded-xl hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Patient Info */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-[#0f172a] text-base group-hover:text-blue-600 transition-colors">
                                                {rx.patient?.firstName} {rx.patient?.lastName}
                                            </span>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full tracking-wide">
                                                Verified
                                            </span>
                                        </div>

                                        {/* Rx Details */}
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-sm text-[#64748b]">
                                            <div className="flex items-center gap-2">
                                                <FiUser className="w-3.5 h-3.5" />
                                                <span>Dr. {rx.prescriber?.name || 'Unknown'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">ID:</span>
                                                <span className="font-mono text-xs">{rx.id.slice(-6).toUpperCase()}</span>
                                            </div>
                                            <div className="col-span-2 mt-1 text-xs text-gray-400">
                                                {new Date(rx.updatedAt || rx.createdAt).toLocaleDateString(undefined, {
                                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </div>

                                        {/* Items Preview */}
                                        <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                                            <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                                                <FiCheckCircle className="w-3 h-3" />
                                                {rx.items.length} Prescribed Items
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {rx.items.slice(0, 3).map((item: any) => (
                                                    <span key={item.id} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                                                        {item.drug?.name}
                                                    </span>
                                                ))}
                                                {rx.items.length > 3 && (
                                                    <span className="px-2 py-1 bg-gray-50 text-gray-400 text-xs rounded-md border border-gray-200">
                                                        +{rx.items.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Select Button (Visible on Hover/Mobile) */}
                                    <div className="ml-4 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700">
                                            Import
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                <FiSearch className="w-8 h-8" />
                            </div>
                            <h4 className="text-[#0f172a] font-medium mb-1">No Verified Prescriptions Found</h4>
                            <p className="text-sm text-gray-500 max-w-xs">
                                {search ? "Try adjusting your search terms." : "All verified prescriptions have been processed."}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#e2e8f0] bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

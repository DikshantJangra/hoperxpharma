"use client";

import React, { useState } from "react";
import { FiX, FiSearch, FiAlertCircle, FiArrowRight, FiCheck } from "react-icons/fi";
import { usePatientSearch } from "@/hooks/usePatientSearch";
import { patientsApi } from "@/lib/api/patients";
import { toast } from "react-hot-toast";

interface PatientMergeModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetPatient: any; // The patient we are keeping
    onMergeComplete?: () => void;
}

export default function PatientMergeModal({
    isOpen,
    onClose,
    targetPatient,
    onMergeComplete
}: PatientMergeModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sourcePatient, setSourcePatient] = useState<any>(null);
    const [isMerging, setIsMerging] = useState(false);

    const { patients: searchResults, search, loading: searchLoading } = usePatientSearch({
        enableCache: true
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            search(query);
        }
    };

    const handleSelectSource = (patient: any) => {
        if (patient.id === targetPatient.id) {
            toast.error("Cannot merge a patient with themselves");
            return;
        }
        setSourcePatient(patient);
        setSearchQuery("");
    };

    const handleMerge = async () => {
        if (!sourcePatient || !targetPatient) return;

        if (!confirm(`Are you sure you want to merge ${sourcePatient.firstName} into ${targetPatient.firstName}? This action cannot be undone.`)) {
            return;
        }

        try {
            setIsMerging(true);
            await patientsApi.mergePatients(targetPatient.id, sourcePatient.id);
            toast.success("Patients merged successfully");
            if (onMergeComplete) onMergeComplete();
            onClose();
        } catch (error: any) {
            console.error("Merge failed:", error);
            toast.error(error.message || "Failed to merge patients");
        } finally {
            setIsMerging(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FiAlertCircle className="text-amber-500" />
                            Merge Duplicate Patients
                        </h2>
                        <p className="text-sm text-gray-500">Merge a duplicate record into the current patient profile.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Step 1: Find Duplicate */}
                    {!sourcePatient ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Search for the duplicate record to merge FROM:
                            </label>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    placeholder="Search by name or phone..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    autoFocus
                                />
                            </div>

                            {/* Search Results */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                {searchLoading ? (
                                    <div className="p-4 text-center text-gray-500">Searching...</div>
                                ) : searchQuery && searchResults.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">No patients found</div>
                                ) : (
                                    searchResults
                                        .filter(p => p.id !== targetPatient.id)
                                        .map(patient => (
                                            <button
                                                key={patient.id}
                                                onClick={() => handleSelectSource(patient)}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex justify-between items-center group"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</p>
                                                    <p className="text-sm text-gray-500">{patient.phoneNumber}</p>
                                                </div>
                                                <span className="text-teal-600 opacity-0 group-hover:opacity-100 text-sm font-medium">
                                                    Select
                                                </span>
                                            </button>
                                        ))
                                )}
                                {!searchQuery && (
                                    <div className="p-8 text-center text-gray-400 text-sm">
                                        Start typing to find a patient
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Confirm Merge */
                        <div className="space-y-6">
                            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                                {/* Source (Duplicate) */}
                                <div className="bg-red-50 border border-red-100 rounded-lg p-4 relative">
                                    <div className="absolute -top-3 left-4 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-medium">
                                        SOURCE (Will be deleted)
                                    </div>
                                    <h3 className="font-bold text-gray-900">{sourcePatient.firstName} {sourcePatient.lastName}</h3>
                                    <div className="text-sm text-gray-600 space-y-1 mt-2">
                                        <p>{sourcePatient.phoneNumber}</p>
                                        <p>{sourcePatient.gender || 'No gender'}</p>
                                        <p>{sourcePatient.dateOfBirth ? new Date(sourcePatient.dateOfBirth).toLocaleDateString() : 'No DOB'}</p>
                                    </div>
                                    <button
                                        onClick={() => setSourcePatient(null)}
                                        className="mt-3 text-xs text-red-600 hover:text-red-800 underline"
                                    >
                                        Change Selection
                                    </button>
                                </div>

                                <div className="flex justify-center">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <FiArrowRight className="text-gray-500 w-6 h-6" />
                                    </div>
                                </div>

                                {/* Target (Keep) */}
                                <div className="bg-green-50 border border-green-100 rounded-lg p-4 relative">
                                    <div className="absolute -top-3 left-4 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">
                                        TARGET (Will be kept)
                                    </div>
                                    <h3 className="font-bold text-gray-900">{targetPatient.firstName} {targetPatient.lastName}</h3>
                                    <div className="text-sm text-gray-600 space-y-1 mt-2">
                                        <p>{targetPatient.phoneNumber}</p>
                                        <p>{targetPatient.gender || 'No gender'}</p>
                                        <p>{targetPatient.dateOfBirth ? new Date(targetPatient.dateOfBirth).toLocaleDateString() : 'No DOB'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                                <p className="font-medium mb-1 flex items-center gap-2">
                                    <FiAlertCircle />
                                    Warning: This action is irreversible
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                                    <li>All prescriptions, sales, and history from the <strong>Source</strong> will be moved to the <strong>Target</strong>.</li>
                                    <li>The <strong>Source</strong> patient record will be permanently deleted.</li>
                                    <li>Conflicting data (like name/DOB) will be kept from the <strong>Target</strong> profile.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMerge}
                        disabled={!sourcePatient || isMerging}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isMerging ? 'Merging...' : 'Confirm Merge'}
                    </button>
                </div>
            </div>
        </div>
    );
}

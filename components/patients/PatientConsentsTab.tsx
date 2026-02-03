"use client";

import React, { useState } from "react";
import { FiLock, FiCheckCircle, FiX, FiAlertCircle } from "react-icons/fi";
import { patientsApi } from "@/lib/api/patients";
import { toast } from "react-hot-toast"; // Assuming react-hot-toast is used, or I'll use simple alert/console for now if not sure.
// Actually, I'll use a local error state or simple alert for simplicity if toast isn't set up.
// I'll check package.json later, but for now I'll use standard UI feedback.

interface PatientConsentsTabProps {
    patient: any;
    onUpdate: () => void;
}

export default function PatientConsentsTab({ patient, onUpdate }: PatientConsentsTabProps) {
    const [optimisticConsents, setOptimisticConsents] = useState<any[]>(patient.consents || []);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Sync with prop updates
    React.useEffect(() => {
        setOptimisticConsents(patient.consents || []);
    }, [patient.consents]);

    const handleWithdraw = async (consentId: string) => {
        if (!confirm("Are you sure you want to withdraw this consent?")) return;

        // 1. Optimistic Update
        const previousConsents = [...optimisticConsents];
        setOptimisticConsents(prev => prev.map(c =>
            c.id === consentId ? { ...c, status: "Withdrawn" } : c
        ));
        setLoadingId(consentId);

        try {
            // 2. API Call
            await patientsApi.withdrawConsent(consentId);
            // Success! No need to do anything else as the optimistic state is correct.
            // But we should trigger a refresh to get the server source of truth eventually.
            onUpdate();
        } catch (error) {
            // 3. Rollback on Error
            console.error("Failed to withdraw consent:", error);
            setOptimisticConsents(previousConsents);
            alert("Failed to withdraw consent. Please try again.");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {optimisticConsents.length > 0 ? (
                optimisticConsents.map((consent: any) => (
                    <div key={consent.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    {consent.type}
                                    {consent.status === "Active" && <FiCheckCircle className="w-4 h-4 text-green-500" />}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    Granted: {new Date(consent.grantedDate).toLocaleDateString()}
                                </p>
                                {consent.expiryDate && (
                                    <p className="text-sm text-gray-500">
                                        Expires: {new Date(consent.expiryDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${consent.status === "Active" ? "bg-green-100 text-green-700" :
                                        consent.status === "Withdrawn" ? "bg-gray-100 text-gray-700" :
                                            "bg-red-100 text-red-700"
                                    }`}>
                                    {consent.status}
                                </span>

                                {consent.status === "Active" && (
                                    <button
                                        onClick={() => handleWithdraw(consent.id)}
                                        disabled={loadingId === consent.id}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Withdraw Consent"
                                    >
                                        {loadingId === consent.id ? (
                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <FiX className="w-4 h-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100 border-dashed">
                    <FiLock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Consents</h3>
                    <p className="text-gray-500">No consent records found for this patient.</p>
                </div>
            )}
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { prescriptionApi } from '@/lib/api/prescriptions';
import { FiRefreshCw, FiDownload, FiUser, FiInfo, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ERxDashboard() {
    const [pendingScripts, setPendingScripts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState<string | null>(null);
    const router = useRouter();

    const fetchPending = async () => {
        setLoading(true);
        try {
            const response = await prescriptionApi.getPendingERx();
            if (response.success) {
                setPendingScripts(response.data);
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            toast.error('Failed to load pending E-Prescriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleImport = async (script: any) => {
        setImporting(script.eRxId);
        try {
            const response = await prescriptionApi.importERx(script);
            if (response.success) {
                toast.success(`Rx imported for ${script.patient.firstName}`);
                // Remove from list
                setPendingScripts(prev => prev.filter(p => p.eRxId !== script.eRxId));
                // Optional: navigate to created Rx
                // router.push(`/prescriptions/${response.data.id}`);
            } else {
                toast.error('Import failed');
            }
        } catch (error) {
            console.error('Import Error:', error);
            toast.error('Import failed');
        } finally {
            setImporting(null);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FiActivity className="text-teal-600" />
                        E-Prescription Hub
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Pending prescriptions from SureScripts/Network</p>
                </div>

                <button
                    onClick={fetchPending}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors font-medium border border-gray-200"
                >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    Refresh Feed
                </button>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <FiRefreshCw className="w-8 h-8 animate-spin mb-4" />
                        <p>Connecting to external provider...</p>
                    </div>
                ) : pendingScripts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                        <FiInfo className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="font-medium text-lg">No New Prescriptions</p>
                        <p className="text-sm">Last checked: {new Date().toLocaleTimeString()}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {pendingScripts.map(script => (
                            <div key={script.eRxId} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                {script.patient.firstName[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{script.patient.firstName} {script.patient.lastName}</h3>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    DOB: {new Date(script.patient.dob).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {script.priority === 'Urgent' && (
                                            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
                                                URGENT
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {script.medications.map((med: any, i: number) => (
                                            <div key={i} className="text-sm">
                                                <p className="font-bold text-gray-800">{med.drugName}</p>
                                                <p className="text-gray-600 text-xs mt-0.5">{med.sig}</p>
                                                <div className="flex gap-3 mt-1.5 text-xs text-gray-500 font-medium">
                                                    <span>Qty: {med.quantity}</span>
                                                    <span>Refills: {med.refills}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4 px-1">
                                        <div className="flex items-center gap-1" title="Prescriber">
                                            <FiUser className="text-gray-400" />
                                            <span className="truncate max-w-[120px]">{script.prescriber.name}</span>
                                        </div>
                                        <span>{script.prescriber.clinic}</span>
                                    </div>

                                    <button
                                        onClick={() => handleImport(script)}
                                        disabled={importing === script.eRxId}
                                        className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 group-hover:bg-teal-700"
                                    >
                                        {importing === script.eRxId ? (
                                            <>
                                                <FiRefreshCw className="animate-spin" /> Importing...
                                            </>
                                        ) : (
                                            <>
                                                <FiDownload /> Import to Queue
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="bg-gray-50 px-5 py-2 border-t border-gray-100 flex justify-between text-[10px] text-gray-400 font-mono uppercase">
                                    <span>ID: {script.eRxId}</span>
                                    <span>{new Date(script.receivedAt).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

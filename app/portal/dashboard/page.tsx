'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { portalApi } from '@/lib/api/portal';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiClock, FiCheckCircle, FiLogOut, FiPackage } from 'react-icons/fi';

interface Prescription {
    id: string;
    items: Array<{
        drug: { name: string; strength?: string };
        quantityPrescribed: number;
        daysSupply?: number;
    }>;
    prescriber: { name: string };
    refillsRemaining: number;
    status: string;
    nextRefillDue?: string;
}

export default function PortalDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [patient, setPatient] = useState<{ firstName: string } | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('portal_user');
        if (storedUser) {
            setPatient(JSON.parse(storedUser));
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await portalApi.getPrescriptions();
            setPrescriptions(data);
        } catch (error) {
            // Error handling usually means auth failed
            portalApi.logout();
        } finally {
            setLoading(false);
        }
    };

    const handleRefillRequest = async (rxId: string) => {
        try {
            await portalApi.requestRefill(rxId);
            toast.success('Refill Requested Successfully');
            // Optimistic update or refetch
            // For now, simple toast implies success
        } catch (error: any) {
            toast.error(error.message || 'Request failed');
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse pt-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-200 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Hello, {patient?.firstName} 👋
                    </h2>
                    <p className="text-sm text-gray-500">Your Active Medications</p>
                </div>
                <button
                    onClick={() => portalApi.logout()}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                    <FiLogOut size={20} />
                </button>
            </div>

            <div className="space-y-4">
                {prescriptions.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                        <FiPackage className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No active prescriptions found</p>
                    </div>
                ) : (
                    prescriptions.map((rx) => (
                        <div key={rx.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                            {/* Medication List */}
                            <div className="mb-4">
                                {rx.items.map((item, idx) => (
                                    <div key={idx} className="font-semibold text-gray-900 text-lg">
                                        {item.drug.name} <span className="text-gray-400 font-normal text-sm">{item.drug.strength}</span>
                                    </div>
                                ))}
                                <div className="text-xs text-gray-500 mt-1">
                                    Prescribed by Dr. {rx.prescriber?.name}
                                </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <div className="text-sm">
                                    <div className="flex items-center text-gray-600 mb-1">
                                        <FiRefreshCw className="mr-1.5 w-4 h-4" />
                                        <span>{rx.refillsRemaining} Refills left</span>
                                    </div>
                                    {rx.nextRefillDue && (
                                        <div className="flex items-center text-amber-600 font-medium">
                                            <FiClock className="mr-1.5 w-4 h-4" />
                                            <span>Due: {new Date(rx.nextRefillDue).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>

                                {rx.refillsRemaining > 0 ? (
                                    <button
                                        onClick={() => handleRefillRequest(rx.id)}
                                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95"
                                    >
                                        Request Refill
                                    </button>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg text-xs font-medium">
                                        Max Refills Reached
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="text-center pt-8 pb-4 opacity-50">
                <p className="text-xs text-gray-400">Powered by HopeRx Secure Portal</p>
            </div>
        </div>
    );
}

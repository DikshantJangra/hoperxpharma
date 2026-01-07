'use client';

import React, { useEffect, useState } from 'react';
import { FiClock, FiCheck, FiSend, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { patientsApi } from '@/lib/api/patients';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import toast from 'react-hot-toast';
import { usePremiumTheme } from "@/lib/hooks/usePremiumTheme";

interface RefillItem {
    id: string; // Adherence record ID
    patientId: string;
    patient: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
    };
    expectedRefillDate: string;
    status: 'overdue' | 'due' | 'upcoming';
}

export default function RefillRemindersWidget() {
    const router = useRouter();
    const { primaryStore } = useAuthStore();
    const { isPremium } = usePremiumTheme();
    const [loading, setLoading] = useState(true);
    const [refills, setRefills] = useState<RefillItem[]>([]);

    useEffect(() => {
        if (primaryStore?.id) {
            loadRefills();
        }
    }, [primaryStore?.id]);

    const loadRefills = async () => {
        try {
            setLoading(true);
            const data = await patientsApi.getRefillsDue({
                status: 'due', // Get overdue + due in next 3 days
            });
            if (data?.refills) {
                setRefills(data.refills);
            }
        } catch (error) {
            console.error("Failed to load refills:", error);
            // Don't show error toast for widget, just empty state
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = async (refill: RefillItem) => {
        try {
            const date = new Date(refill.expectedRefillDate).toLocaleDateString();
            const message = `Hello ${refill.patient.firstName}, this is a reminder from ${primaryStore?.name || 'HopeRx Pharmacy'}. Your prescription is due for refill on ${date}. Please reply 'YES' to refill.`;

            // Open WhatsApp Web
            const phone = refill.patient.phoneNumber.replace(/\D/g, ''); // Remove non-digits
            // Ensure country code if missing (assuming India +91 for now or getting from store settings)
            const formattedPhone = phone.length === 10 ? `91${phone}` : phone;

            const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');

            toast.success(`Reminder link opened for ${refill.patient.firstName}`);

            // Optionally update local state to show "Sent" (Mock for now)
        } catch (error) {
            toast.error("Failed to initiate reminder");
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 h-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Refill Reminders</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`
                p-6 rounded-xl border transition-all h-full flex flex-col
                ${isPremium ? 'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.01]' : 'duration-200'}
                ${isPremium
                    ? 'bg-white border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                    : 'bg-white border-gray-200'
                }
            `}
            {...(isPremium ? { 'data-premium': 'true' } : {})}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FiRefreshCw className={`w-5 h-5 ${isPremium ? 'text-emerald-600' : 'text-teal-600'}`} />
                    <h3 className="font-bold text-gray-900">Refill Reminders</h3>
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${isPremium ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-teal-100 text-teal-800'}`}>
                    {refills.length} Due
                </span>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-3 min-h-[200px] max-h-[300px]">
                {refills.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <FiCheck className="w-8 h-8 mb-2" />
                        <p className="text-sm">All caught up!</p>
                    </div>
                ) : (
                    refills.map((refill) => (
                        <div key={refill.id} className={`p-3 rounded-lg border transition-shadow ${isPremium ? 'bg-white border-gray-100 hover:shadow-md hover:border-emerald-100' : 'bg-gray-50 border-gray-100 hover:shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-medium text-sm text-gray-900">
                                        {refill.patient.firstName} {refill.patient.lastName}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        Due: {new Date(refill.expectedRefillDate).toLocaleDateString()}
                                    </p>
                                </div>
                                {refill.status === 'overdue' && (
                                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">Overdue</span>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-2">
                                <a
                                    href={`/patients/${refill.patientId}`}
                                    className="text-xs text-teal-600 hover:underline"
                                >
                                    View Profile
                                </a>
                                <button
                                    onClick={() => handleSendReminder(refill)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                                >
                                    <FiSend className="w-3 h-3" />
                                    Remind
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                    onClick={() => router.push('/patients/refills')}
                    className="w-full text-center text-sm text-gray-600 hover:text-teal-600 font-medium"
                >
                    View All Due Refills
                </button>
            </div>
        </div>
    );
}

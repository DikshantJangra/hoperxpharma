'use client';

import React, { useState, useEffect } from 'react';
import DispenseWorkflow from './components/DispenseWorkflow';
import { prescriptionApi } from '@/lib/api/prescriptions';
import { useParams, useRouter } from 'next/navigation';
import { FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function DispensePage() {
    const { id } = useParams();
    const router = useRouter();
    const [prescription, setPrescription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchRx = async () => {
            try {
                const response = await prescriptionApi.getPrescriptionById(id as string);
                if (response.success) {
                    setPrescription(response.data);
                } else {
                    toast.error('Failed to load prescription');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                toast.error('Failed to load prescription');
            } finally {
                setLoading(false);
            }
        };

        fetchRx();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <FiRefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                    <p className="text-gray-500 font-medium">Loading dispense workflow...</p>
                </div>
            </div>
        );
    }

    if (!prescription) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Prescription Not Found</h2>
                    <button
                        onClick={() => router.push('/prescriptions/queue')}
                        className="text-teal-600 hover:text-teal-700 font-medium"
                    >
                        Return to Workbench
                    </button>
                </div>
            </div>
        );
    }

    return (
        <DispenseWorkflow prescription={prescription} />
    );
}

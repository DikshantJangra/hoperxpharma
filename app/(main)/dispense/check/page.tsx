"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FiCheck, FiAlertTriangle, FiPackage, FiUser } from "react-icons/fi";
import { toast } from 'react-hot-toast';
import { dispenseApi, prescriptionApi } from "@/lib/api/prescriptions";
import { useAuthStore } from "@/lib/store/auth-store";

export default function CheckPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispenseEventId = searchParams.get('dispenseEventId');
    const { user } = useAuthStore();

    const [dispenseEvent, setDispenseEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [visualCheckConfirmed, setVisualCheckConfirmed] = useState(false);
    const [releasing, setReleasing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (dispenseEventId) {
            fetchDispenseEvent();
        }
    }, [dispenseEventId]);

    const fetchDispenseEvent = async () => {
        try {
            setLoading(true);
            // Fetch the dispense event with all details
            const response = await prescriptionApi.getPrescriptionById(dispenseEventId!);

            if (response.success) {
                // Find the dispense event
                const event = response.data.dispenseEvents?.[0];
                setDispenseEvent({
                    ...event,
                    prescription: response.data
                });
            }
        } catch (error: any) {
            console.error('[Check] Failed to fetch:', error);
            setError(error.response?.data?.message || 'Failed to load dispense event');
        } finally {
            setLoading(false);
        }
    };

    const handleRelease = async () => {
        if (!visualCheckConfirmed) {
            setError('You must confirm visual check before releasing');
            return;
        }

        // Check if user is pharmacist
        if (user?.role !== 'PHARMACIST' && user?.role !== 'ADMIN') {
            setError('Only pharmacists can release prescriptions');
            return;
        }

        try {
            setReleasing(true);
            setError(null);

            const response = await dispenseApi.release(dispenseEventId!, {
                visualCheckConfirmed: true
            });

            if (response.success) {
                // Show success and redirect to POS or queue
                toast.success(`Prescription released! Sale request created: ${response.saleDraftId || ''}`, {
                    icon: <FiCheck className="text-white" size={20} />,
                    duration: 4000
                });
                router.push('/dispense/queue');
            }
        } catch (error: any) {
            console.error('[Check] Release error:', error);
            setError(error.response?.data?.message || 'Failed to release prescription');
        } finally {
            setReleasing(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0ea5a3] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dispense event...</p>
                </div>
            </div>
        );
    }

    if (!dispenseEvent) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Dispense event not found</p>
                </div>
            </div>
        );
    }

    const prescription = dispenseEvent.prescription;
    const patient = prescription?.patient;

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Final Pharmacist Check</h1>
                    <p className="text-sm text-[#64748b]">Verify all items before releasing to patient</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Patient Info */}
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FiUser className="w-6 h-6 text-[#0ea5a3]" />
                            <h2 className="text-lg font-semibold text-[#0f172a]">Patient Information</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-sm text-[#64748b]">Name</div>
                                <div className="font-medium text-[#0f172a]">
                                    {patient?.firstName} {patient?.lastName}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-[#64748b]">Phone</div>
                                <div className="font-medium text-[#0f172a]">{patient?.phoneNumber || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-[#64748b]">Allergies</div>
                                <div className="font-medium text-[#0f172a]">
                                    {patient?.allergies?.join(', ') || 'None'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dispensed Items - Visual Comparison */}
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FiPackage className="w-6 h-6 text-[#0ea5a3]" />
                            <h2 className="text-lg font-semibold text-[#0f172a]">Dispensed Items</h2>
                        </div>

                        <div className="space-y-4">
                            {dispenseEvent.items?.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-[#0f172a] text-lg">
                                                {item.batch?.drug?.name || 'Unknown Drug'}
                                            </h3>
                                            <p className="text-sm text-[#64748b] mt-1">
                                                Quantity Dispensed: {item.quantityDispensed} units
                                            </p>
                                        </div>
                                        <FiCheck className="w-6 h-6 text-green-600" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                        <div className="p-2 bg-white rounded">
                                            <div className="text-[#64748b]">Batch Number</div>
                                            <div className="font-medium text-[#0f172a]">{item.batch?.batchNumber}</div>
                                        </div>
                                        <div className="p-2 bg-white rounded">
                                            <div className="text-[#64748b]">Expiry Date</div>
                                            <div className="font-medium text-[#0f172a]">
                                                {item.batch?.expiryDate ? new Date(item.batch.expiryDate).toLocaleDateString() : '-'}
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white rounded">
                                            <div className="text-[#64748b]">MRP</div>
                                            <div className="font-medium text-[#0f172a]">₹{item.batch?.mrp || '0'}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visual Check Confirmation */}
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <FiAlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="font-bold text-amber-900 mb-2">Mandatory Visual Check</h3>
                                <p className="text-sm text-amber-700 mb-4">
                                    As the pharmacist, you must visually verify that the dispensed items match the prescription
                                    before releasing to the patient. This is a non-bypassable safety requirement.
                                </p>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={visualCheckConfirmed}
                                        onChange={(e) => setVisualCheckConfirmed(e.target.checked)}
                                        className="mt-1 w-5 h-5 text-[#0ea5a3] border-amber-400 rounded focus:ring-[#0ea5a3]"
                                    />
                                    <span className="font-medium text-amber-900">
                                        I confirm that I have visually verified all dispensed items match the prescription,
                                        checked expiry dates, and confirmed correct quantities.
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-red-700">
                                <FiAlertTriangle className="w-5 h-5" />
                                <span className="font-medium">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleRelease}
                            disabled={!visualCheckConfirmed || releasing}
                            className={`flex-1 px-6 py-4 rounded-lg font-semibold text-lg transition-all ${visualCheckConfirmed && !releasing
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {releasing ? 'Releasing...' : '✓ Release & Send to POS'}
                        </button>
                        <button
                            onClick={() => router.push('/dispense/queue')}
                            className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Info Footer */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-700">
                            <strong>What happens next:</strong> Upon release, inventory will be automatically deducted,
                            a sale draft will be created in POS for payment, and the patient will receive an SMS notification
                            that their prescription is ready for pickup.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

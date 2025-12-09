'use client';

import { FiUser, FiFileText, FiInfo, FiActivity } from 'react-icons/fi';

interface PrescriptionBannerProps {
    prescription: any;
    onClear: () => void;
}

export default function PrescriptionBanner({ prescription, onClear }: PrescriptionBannerProps) {
    if (!prescription) return null;

    const { prescriber, notes, patient } = prescription;

    return (
        <div className="bg-indigo-50 border-b border-indigo-100 p-4 animate-in slide-in-from-top-2">
            <div className="flex items-start justify-between">

                {/* Clinical Context */}
                <div className="flex-1 flex gap-6">

                    {/* Prescriber Info */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-full border border-indigo-100 text-indigo-600">
                            <FiUser className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Prescribed By</h4>
                            <p className="font-semibold text-gray-900">Dr. {prescriber?.name || 'Unknown'}</p>
                            <p className="text-xs text-indigo-600">{prescriber?.specialization || 'General Practice'} • {prescriber?.licenseNumber}</p>
                        </div>
                    </div>

                    {/* Clinical Notes (if any) */}
                    {notes && (
                        <div className="flex items-start gap-3 pl-6 border-l border-indigo-200">
                            <div className="p-2 bg-white rounded-full border border-indigo-100 text-amber-600">
                                <FiFileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Clinical Notes</h4>
                                <p className="text-sm text-gray-700 italic max-w-md line-clamp-2" title={notes}>
                                    "{notes}"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Vitals/Alerts (Placeholder for future) */}
                    <div className="flex items-start gap-3 pl-6 border-l border-indigo-200 hidden xl:flex">
                        <div className="p-2 bg-white rounded-full border border-indigo-100 text-teal-600">
                            <FiActivity className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider">Status</h4>
                            <div className="flex gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                    VERIFIED
                                </span>
                                {prescription.isControlled && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                        CONTROLLED
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-1">
                    <div className="text-xs font-mono text-indigo-400">Rx #{prescription.id.slice(-6).toUpperCase()}</div>
                    <button
                        onClick={onClear}
                        className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 font-medium"
                    >
                        Unlink Prescription
                    </button>
                </div>

            </div>
        </div>
    );
}

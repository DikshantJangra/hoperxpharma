'use client';

import React, { useState } from 'react';
import { FiAlertTriangle, FiCheckSquare, FiSquare, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface VerifyStepProps {
    prescription: any;
    onComplete: () => void;
}

const VerifyStep = ({ prescription, onComplete }: VerifyStepProps) => {
    const [checks, setChecks] = useState({
        patientIdentity: false,
        drugAppropriateness: false,
        dosageCheck: false,
        interactionCheck: false
    });

    const isComplete = Object.values(checks).every(Boolean);

    const toggleCheck = (key: keyof typeof checks) => {
        setChecks(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleConfirm = () => {
        if (!isComplete) {
            toast.error('All clinical checks must be completed');
            return;
        }
        onComplete();
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Clinical Verification</h2>
                <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    <FiShield /> Clinical Review
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 mb-2">Safety Checklist</h3>
                    <p className="text-sm text-gray-500">Please review all warnings and confirm safety.</p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Mock Warnings */}
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3">
                        <FiAlertTriangle className="text-yellow-600 mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-yellow-800 text-sm">Interaction Warning (Moderate)</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                                Drug A may increase levels of Drug B. Monitor for side effects.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <CheckItem
                            label="Patient Identity & History Verified"
                            checked={checks.patientIdentity}
                            onClick={() => toggleCheck('patientIdentity')}
                        />
                        <CheckItem
                            label="Drug Indication Appropriate"
                            checked={checks.drugAppropriateness}
                            onClick={() => toggleCheck('drugAppropriateness')}
                        />
                        <CheckItem
                            label="Dosage & Frequency Check"
                            checked={checks.dosageCheck}
                            onClick={() => toggleCheck('dosageCheck')}
                        />
                        <CheckItem
                            label="Drug Interactions Reviewed"
                            checked={checks.interactionCheck}
                            onClick={() => toggleCheck('interactionCheck')}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleConfirm}
                    disabled={!isComplete}
                    className={`px-8 py-3 rounded-lg font-semibold transition-colors shadow-sm ${isComplete
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Approve Clinical Check
                </button>
            </div>
        </div>
    );
};

const CheckItem = ({ label, checked, onClick }: { label: string, checked: boolean, onClick: () => void }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${checked
                ? 'bg-teal-50 border-teal-200 text-teal-900'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
    >
        {checked ? <FiCheckSquare className="text-teal-600 w-5 h-5 flex-shrink-0" /> : <FiSquare className="text-gray-400 w-5 h-5 flex-shrink-0" />}
        <span className="font-medium text-sm">{label}</span>
    </div>
);

export default VerifyStep;

'use client';

import React from 'react';
import { FiUser, FiInfo, FiAlertCircle } from 'react-icons/fi';

interface IntakeStepProps {
    prescription: any;
    onComplete: () => void;
}

const IntakeStep = ({ prescription, onComplete }: IntakeStepProps) => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Prescription Intake</h2>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    Order #{prescription.id.slice(-6)}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Patient Information */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                            <FiUser size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{prescription.patient.firstName} {prescription.patient.lastName}</h3>
                            <p className="text-sm text-gray-500">Patient</p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Phone</span>
                            <span className="font-medium">{prescription.patient.phoneNumber}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Age/Gender</span>
                            <span className="font-medium">N/A</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Allergies</span>
                            <span className="font-medium text-red-600">None Recorded</span>
                        </div>
                    </div>
                </div>

                {/* Prescription Details */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <FiInfo size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Rx Details</h3>
                            <p className="text-sm text-gray-500">Source: {prescription.source}</p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Prescriber</span>
                            <span className="font-medium">
                                {prescription.prescriber ? `Dr. ${prescription.prescriber.name}` : 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium">
                                {new Date(prescription.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Priority</span>
                            <span className={`font-medium ${prescription.priority === 'Urgent' ? 'text-red-600' : 'text-gray-900'}`}>
                                {prescription.priority}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warnings / Alerts */}
            {prescription.controlledFlag && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <FiAlertCircle className="text-amber-600 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-amber-900">Controlled Substance</h4>
                        <p className="text-sm text-amber-800 mt-1">
                            This prescription contains controlled substances. Please verify ID and follow strict dispensing protocols.
                        </p>
                    </div>
                </div>
            )}

            <div className="mt-8 flex justify-end">
                <button
                    onClick={onComplete}
                    className="bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-sm"
                >
                    Confirm Patient & Continue
                </button>
            </div>
        </div>
    );
};

export default IntakeStep;

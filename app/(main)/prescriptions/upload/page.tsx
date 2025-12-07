'use client';

import React, { useState } from 'react';
import { FiUploadCloud, FiFileText, FiCheckCircle } from 'react-icons/fi';
import OCRUploader from './components/OCRUploader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
    const router = useRouter();

    const handleUploadComplete = (data: any) => {
        // Handle successful upload/OCR completion
        console.log('Processed Data:', data);
        // Navigate to verify or edit the new prescription
        // router.push(`/prescriptions/${data.id}/edit`);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">Upload Prescription</h1>
                    <div className="text-sm text-gray-500">
                        Convert paper prescriptions to digital records
                    </div>
                </div>
                <div>
                    <Link
                        href="/prescriptions"
                        className="text-gray-500 hover:text-gray-900 font-medium text-sm"
                    >
                        Cancel
                    </Link>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Info Panel */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FiFileText className="text-teal-600" />
                                    How it works
                                </h3>
                                <div className="space-y-4">
                                    <Step number={1} text="Upload an image or PDF of the prescription" />
                                    <Step number={2} text="AI extracts patient and drug details automatically" />
                                    <Step number={3} text="Verify the digital record and save" />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h4 className="font-bold text-blue-800 text-sm mb-2">Supported Formats</h4>
                                <p className="text-sm text-blue-700">
                                    JPG, PNG, PDF.<br />
                                    Max file size: 10MB.
                                </p>
                            </div>
                        </div>

                        {/* Upload Area */}
                        <div className="md:col-span-2">
                            <OCRUploader onComplete={handleUploadComplete} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Step = ({ number, text }: { number: number, text: string }) => (
    <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {number}
        </div>
        <p className="text-sm text-gray-600 leading-snug">{text}</p>
    </div>
);

"use client";

import React, { useState, useRef } from "react";
import { FiUpload, FiCamera, FiX, FiCheck, FiFileText, FiRefreshCw } from "react-icons/fi";
import { toast } from "react-hot-toast";

interface PrescriptionUploadProps {
    patientId: string;
    onUploadComplete?: (data: any) => void;
    onCancel?: () => void;
}

export default function PrescriptionUpload({ patientId, onUploadComplete, onCancel }: PrescriptionUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [ocrData, setOcrData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
            setOcrData(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const selectedFile = e.dataTransfer.files?.[0];
        if (selectedFile && (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf')) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
            setOcrData(null);
        }
    };

    const handleProcess = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);

            // Simulate OCR processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock OCR data
            const mockOcrData = {
                doctorName: "Dr. Smith",
                date: new Date().toISOString().split('T')[0],
                medicines: [
                    { name: "Amoxicillin", strength: "500mg", frequency: "BID", duration: "5 days" },
                    { name: "Paracetamol", strength: "650mg", frequency: "SOS", duration: "3 days" }
                ]
            };

            setOcrData(mockOcrData);
            toast.success("Prescription processed successfully");

        } catch (error) {
            console.error("OCR Error:", error);
            toast.error("Failed to process prescription");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            // Actual upload call
            // const result = await uploadPrescriptionFile(patientId, file);

            // Mock upload success for now until backend endpoint is ready
            await new Promise(resolve => setTimeout(resolve, 1000));
            const result = { id: "mock-id", url: previewUrl, ocrData };

            toast.success("Prescription saved");
            if (onUploadComplete) {
                onUploadComplete(result);
            }
        } catch (error) {
            console.error("Upload Error:", error);
            toast.error("Failed to save prescription");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FiFileText className="text-teal-600" />
                    Upload Prescription
                </h3>
                {onCancel && (
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <FiX />
                    </button>
                )}
            </div>

            <div className="p-6">
                {!file ? (
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors cursor-pointer bg-gray-50"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiCamera className="w-8 h-8" />
                        </div>
                        <p className="text-lg font-medium text-gray-700 mb-1">Click to upload or drag & drop</p>
                        <p className="text-sm text-gray-500">Supports JPG, PNG, PDF</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Preview Section */}
                        <div className="space-y-4">
                            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                {file.type.startsWith('image/') ? (
                                    <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col gap-2">
                                        <FiFileText className="w-12 h-12" />
                                        <span>PDF Document</span>
                                    </div>
                                )}

                                <button
                                    onClick={() => { setFile(null); setOcrData(null); }}
                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                >
                                    <FiX />
                                </button>
                            </div>
                        </div>

                        {/* Data/Action Section */}
                        <div className="flex flex-col h-full">
                            {!ocrData ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                                    <FiRefreshCw className={`w-10 h-10 text-teal-500 mb-4 ${isProcessing ? 'animate-spin' : ''}`} />
                                    <h4 className="font-medium text-gray-900 mb-2">Ready to Process</h4>
                                    <p className="text-sm text-gray-500 mb-6">
                                        We'll scan the prescription to extract medicine details automatically.
                                    </p>
                                    <button
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 transition-all shadow-sm hover:shadow-md w-full"
                                    >
                                        {isProcessing ? 'Processing...' : 'Scan Prescription'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                        <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                                            <FiCheck className="w-5 h-5" />
                                            Data Extracted Successfully
                                        </div>
                                        <div className="space-y-2 text-sm text-green-800">
                                            <div className="flex justify-between">
                                                <span className="text-green-600">Doctor:</span>
                                                <span className="font-medium">{ocrData.doctorName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-green-600">Date:</span>
                                                <span className="font-medium">{ocrData.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                                <tr>
                                                    <th className="px-3 py-2">Medicine</th>
                                                    <th className="px-3 py-2">Dosage</th>
                                                    <th className="px-3 py-2">Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {ocrData.medicines.map((med: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="px-3 py-2 font-medium text-gray-900">{med.name}</td>
                                                        <td className="px-3 py-2 text-gray-600">{med.strength} • {med.frequency}</td>
                                                        <td className="px-3 py-2 text-gray-600">{med.duration}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex gap-3 mt-auto">
                                        <button
                                            onClick={() => setOcrData(null)}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                        >
                                            Rescan
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isProcessing}
                                            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-sm"
                                        >
                                            {isProcessing ? 'Saving...' : 'Save Prescription'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

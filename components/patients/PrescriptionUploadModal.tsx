"use client";

import React from "react";
import PrescriptionUpload from "./PrescriptionUpload";

interface PrescriptionUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    onUploadComplete?: (data: any) => void;
}

export default function PrescriptionUploadModal({
    isOpen,
    onClose,
    patientId,
    onUploadComplete
}: PrescriptionUploadModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl animate-in zoom-in-95 duration-200">
                <PrescriptionUpload
                    patientId={patientId}
                    onUploadComplete={(data) => {
                        if (onUploadComplete) onUploadComplete(data);
                        onClose();
                    }}
                    onCancel={onClose}
                />
            </div>
        </div>
    );
}

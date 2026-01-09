'use client';
import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiX, FiImage, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

interface AssetUploaderProps {
    type: 'logo' | 'signature';
    currentUrl?: string;
    onUploadComplete: (url: string) => void;
    storeId?: string;
    mode?: 'store' | 'onboarding';
}

export default function AssetUploader({ type, currentUrl, onUploadComplete, storeId, mode = 'store' }: AssetUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxSize = type === 'logo' ? 5 : 2; // MB
    const label = type === 'logo' ? 'Store Logo' : 'Signature';

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        // Validate file type - explicitly reject SVG
        if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
            toast.error('SVG files are not supported. Please upload PNG, JPG, or WebP images.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (PNG, JPG, or WebP)');
            return;
        }

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
            toast.error(`File size must be less than ${maxSize}MB`);
            return;
        }

        // Validate storeId for store mode
        if (mode === 'store' && !storeId) {
            toast.error('Store ID is missing');
            return;
        }

        setUploading(true);

        try {
            // Step 1: Request presigned URL
            let requestEndpoint = '';
            if (mode === 'store') {
                requestEndpoint = `/stores/${storeId}/${type}/upload-request`;
            } else {
                // Onboarding mode - only supports logo currently
                if (type !== 'logo') {
                    throw new Error('Only logo upload is supported in onboarding mode');
                }
                requestEndpoint = `/onboarding/logo/upload-request`;
            }

            const requestResponse = await apiClient.post(requestEndpoint, { fileName: file.name });
            const { data: { uploadUrl, tempKey } } = requestResponse;

            // Step 2: Upload file to R2
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
            }

            // Step 3: Process upload
            let processEndpoint = '';
            if (mode === 'store') {
                processEndpoint = `/stores/${storeId}/${type}/process`;
            } else {
                processEndpoint = `/onboarding/logo/process`;
            }

            const processResponse = await apiClient.post(processEndpoint, { tempKey, fileName: file.name });
            const { data: { url } } = processResponse;

            // Update preview and notify parent
            setPreview(url);
            onUploadComplete(url);
            toast.success(`${label} uploaded successfully`);
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            toast.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = () => {
        setPreview(null);
        onUploadComplete('');
        toast.success(`${label} removed`);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
                {label}
            </label>

            <div
                className={`relative border-2 border-dashed rounded-xl transition-all ${dragActive
                    ? 'border-teal-500 bg-teal-50'
                    : preview
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-300 bg-white hover:border-teal-400'
                    } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !preview && fileInputRef.current?.click()}
            >
                {preview ? (
                    <div className="relative p-4">
                        <img
                            src={preview}
                            alt={label}
                            className={`mx-auto object-contain ${type === 'logo' ? 'h-32 w-32' : 'h-24 w-48'
                                }`}
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete();
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-gray-600">Uploading...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <FiUpload className="w-8 h-8 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        Drop {label.toLowerCase()} here or click to browse
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PNG, JPG or WebP only (max {maxSize}MB, no SVG)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {preview && (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <FiCheck className="w-4 h-4" />
                    <span>{label} uploaded successfully</span>
                </div>
            )}
        </div>
    );
}

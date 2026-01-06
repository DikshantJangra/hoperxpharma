'use client';

import { useState, useRef } from 'react';
import { FiUpload, FiX, FiFile, FiFileText, FiImage } from 'react-icons/fi';

interface AttachmentFile {
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    path: string;
    uploadedAt: string;
}

interface AttachmentUploaderProps {
    attachments: AttachmentFile[];
    onAttachmentsChange: (attachments: AttachmentFile[]) => void;
    maxSize?: number; // in bytes
    maxFiles?: number;
}

// Helper to get headers for requests (credentials: include handles auth)
// Note: For FormData uploads, we don't set Content-Type header
const getAuthHeaders = () => ({});

export default function AttachmentUploader({
    attachments,
    onAttachmentsChange,
    maxSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 5,
}: AttachmentUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
        }
    };

    const handleFiles = async (files: File[]) => {
        // Check max files limit
        if (attachments.length + files.length > maxFiles) {
            alert(`Maximum ${maxFiles} files allowed`);
            return;
        }

        // Validate and upload files
        for (const file of files) {
            // Check file size
            if (file.size > maxSize) {
                alert(`File "${file.name}" exceeds maximum size of ${maxSize / (1024 * 1024)}MB`);
                continue;
            }

            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/v1/email/attachments/upload', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload file');
            }

            const data = await response.json();
            const uploadedFile = data.data.file;

            // Add to attachments list
            onAttachmentsChange([...attachments, uploadedFile]);
            setUploadProgress(100);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(error.message || 'Failed to upload file');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const removeAttachment = async (filename: string) => {
        try {
            const response = await fetch(`/api/v1/email/attachments/${filename}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (response.ok) {
                onAttachmentsChange(attachments.filter(att => att.filename !== filename));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete attachment');
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) {
            return <FiImage className="w-5 h-5 text-blue-500" />;
        } else if (mimeType === 'application/pdf') {
            return <FiFileText className="w-5 h-5 text-red-500" />;
        } else {
            return <FiFile className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-3">
            {/* Upload Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging
                    ? 'border-[#10b981] bg-[#d1fae5]'
                    : 'border-[#e2e8f0] hover:border-[#10b981] hover:bg-[#f0fdf4]'
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt"
                />

                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-[#d1fae5] rounded-full flex items-center justify-center">
                        <FiUpload className="w-6 h-6 text-[#10b981]" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[#0f172a]">
                            Drop files here or click to browse
                        </p>
                        <p className="text-xs text-[#64748b] mt-1">
                            PDF, Images, Documents • Max {maxSize / (1024 * 1024)}MB per file • Up to {maxFiles} files
                        </p>
                    </div>
                </div>

                {uploading && (
                    <div className="mt-4">
                        <div className="w-full bg-[#e2e8f0] rounded-full h-2">
                            <div
                                className="bg-[#10b981] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-[#64748b] mt-1">Uploading...</p>
                    </div>
                )}
            </div>

            {/* Attached Files List */}
            {attachments.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-[#0f172a]">
                        Attached Files ({attachments.length})
                    </p>
                    {attachments.map((file) => (
                        <div
                            key={file.filename}
                            className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg"
                        >
                            {getFileIcon(file.mimeType)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#0f172a] truncate">
                                    {file.originalName}
                                </p>
                                <p className="text-xs text-[#64748b]">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeAttachment(file.filename)}
                                className="p-2 hover:bg-[#fee2e2] rounded-lg transition-colors group"
                            >
                                <FiX className="w-4 h-4 text-[#64748b] group-hover:text-[#dc2626]" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

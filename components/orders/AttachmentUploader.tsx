'use client';

import React, { useRef, useState, useEffect } from 'react';
import { MdAttachFile, MdDescription, MdClose, MdImage, MdPictureAsPdf } from 'react-icons/md';
import { apiClient } from '@/lib/api/client';

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  url: string;
  originalSize: number;
  compressedSize: number;
  uploadedAt: string;
}

interface AttachmentUploaderProps {
  poId?: string;
  attachments: Attachment[];
  onUpload: (attachment: Attachment) => void;
  onRemove?: (attachmentId: string) => void;
  apiEndpoint?: string; // 'po-attachments' or 'grn-attachments'
}

export default function AttachmentUploader({
  poId,
  attachments,
  onUpload,
  onRemove,
  apiEndpoint = 'po-attachments' // Default to PO attachments for backward compatibility
}: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [loadedAttachments, setLoadedAttachments] = useState<Attachment[]>(attachments || []);
  const [loading, setLoading] = useState(false);

  // Fetch attachments when poId changes
  useEffect(() => {
    const fetchAttachments = async () => {
      if (!poId) return;

      setLoading(true);
      try {
        const result = await apiClient.get(`/${apiEndpoint}/${poId}`);

        if (result.success && result.data) {
          setLoadedAttachments(result.data);
        }
      } catch (error) {
        console.error('[Attachment] Failed to fetch attachments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [poId]);

  // Update loaded attachments when prop changes
  useEffect(() => {
    if (attachments && attachments.length > 0) {
      setLoadedAttachments(attachments);
    }
  }, [attachments]);

  // Handle delete attachment
  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      await apiClient.delete(`/${apiEndpoint}/${attachmentId}`);

      // Remove from local state
      setLoadedAttachments(prev => prev.filter(att => att.id !== attachmentId));

      // Call parent onRemove if provided
      if (onRemove) {
        onRemove(attachmentId);
      }

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top';
      successDiv.textContent = '✓ Attachment deleted';
      document.body.appendChild(successDiv);

      setTimeout(() => {
        successDiv.remove();
      }, 3000);
    } catch (error) {
      console.error('[Attachment] Delete failed:', error);

      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top';
      errorDiv.textContent = '✗ Failed to delete attachment';
      document.body.appendChild(errorDiv);

      setTimeout(() => {
        errorDiv.remove();
      }, 3000);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!poId) {
      // Show error toast
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top';
      errorDiv.textContent = '✗ Please save the PO as a draft first';
      document.body.appendChild(errorDiv);

      setTimeout(() => {
        errorDiv.remove();
      }, 3000);
      return;
    }

    // Validate file sizes before uploading
    const maxSize = 5 * 1024 * 1024; // 5 MB
    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top';
        errorDiv.textContent = `✗ ${file.name} exceeds 5 MB limit`;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
          errorDiv.remove();
        }, 3000);

        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }

    setUploading(true);

    for (const file of Array.from(files)) {
      const fileId = `${Date.now()}_${file.name}`;

      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        console.log(`[Attachment] Starting upload for: ${file.name}`);

        // Step 1: Request presigned URL
        const idParam = apiEndpoint === 'grn-attachments' ? 'grnId' : 'poId';
        const requestResponse = await apiClient.post(`/${apiEndpoint}/request-upload`, {
          [idParam]: poId,
          fileName: file.name
        });

        const { data: requestData } = requestResponse;
        const { uploadUrl, tempKey } = requestData;

        setUploadProgress(prev => ({ ...prev, [fileId]: 30 }));
        console.log(`[Attachment] Uploading to R2...`);

        // Step 2: Upload file directly to R2 (Keep fetch here)
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to storage');
        }

        setUploadProgress(prev => ({ ...prev, [fileId]: 70 }));
        console.log(`[Attachment] Processing file...`);

        // Step 3: Complete upload processing
        const result = await apiClient.post(`/${apiEndpoint}/complete-upload`, {
          [idParam]: poId,
          tempKey,
          fileName: file.name
        });

        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        console.log(`[Attachment] Upload complete!`, result);

        // Access attachment from result.data.attachment (ApiResponse wraps it)
        const attachment = result.data?.attachment || result.attachment;

        if (result.success && attachment) {
          // Add to loaded attachments
          setLoadedAttachments(prev => [...prev, attachment]);

          // Call parent onUpload if provided
          if (onUpload) {
            onUpload(attachment);
          }

          // Show success message with compression info
          const compressionInfo = attachment.compressionRatio > 0
            ? ` (saved ${attachment.compressionRatio}%)`
            : '';

          // Create a temporary success indicator
          const successDiv = document.createElement('div');
          successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top';
          successDiv.textContent = `✓ ${file.name} uploaded${compressionInfo}`;
          document.body.appendChild(successDiv);

          setTimeout(() => {
            successDiv.remove();
          }, 3000);
        }

        // Remove progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }, 1000);

      } catch (error) {
        console.error('[Attachment] Upload failed:', error);

        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top';
        errorDiv.textContent = `✗ Failed to upload ${file.name}`;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
          errorDiv.remove();
        }, 3000);

        // Remove progress
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }

    setUploading(false);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;

    if (fileInputRef.current) {
      fileInputRef.current.files = files;
      handleFileSelect({ target: { files } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'image') return <MdImage className="h-5 w-5 text-blue-500" />;
    if (fileType === 'pdf') return <MdPictureAsPdf className="h-5 w-5 text-red-500" />;
    return <MdDescription className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <MdAttachFile className="h-4 w-4" />
          Attachments
        </h3>
      </div>

      <div className="p-5">
        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          <MdDescription className="mx-auto h-8 w-8 text-gray-400" />
          <div className="mt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Click to upload'}
            </button>
            <span className="text-sm text-gray-500"> or drag and drop</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            PDF, DOC, JPG, PNG up to 5MB
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Images will be compressed to WebP for efficiency
          </p>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="bg-gray-50 rounded-md p-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attachments List */}
        {loading && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Loading attachments...
          </div>
        )}

        {!loading && loadedAttachments.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-medium text-gray-700">Uploaded Files ({loadedAttachments.length})</h4>
            {loadedAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(attachment.fileType)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {attachment.fileName}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{formatFileSize(attachment.compressedSize)}</span>
                      {attachment.compressedSize < attachment.originalSize && (
                        <span className="text-green-600">
                          (saved {Math.round((1 - attachment.compressedSize / attachment.originalSize) * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete attachment"
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500">
          Attach quotations, supplier terms, or other relevant documents
        </div>
      </div>
    </div>
  );
}

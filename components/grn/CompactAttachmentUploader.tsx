'use client';

import React, { useRef, useState, useEffect } from 'react';
import { HiOutlineDocumentText, HiOutlinePaperClip, HiOutlineTrash, HiOutlineEye } from 'react-icons/hi2';
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

interface CompactAttachmentUploaderProps {
  poId?: string;
  attachments: Attachment[];
  onUpload: (attachment: Attachment) => void;
  onRemove?: (attachmentId: string) => void;
  apiEndpoint?: string;
}

export default function CompactAttachmentUploader({
  poId,
  attachments,
  onUpload,
  onRemove,
  apiEndpoint = 'grn-attachments'
}: CompactAttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [loadedAttachments, setLoadedAttachments] = useState<Attachment[]>(attachments || []);

  useEffect(() => {
    if (attachments && attachments.length > 0) {
      setLoadedAttachments(attachments);
    }
  }, [attachments]);

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Delete this document?')) return;

    try {
      await apiClient.delete(`/${apiEndpoint}/${attachmentId}`);
      setLoadedAttachments(prev => prev.filter(att => att.id !== attachmentId));
      if (onRemove) onRemove(attachmentId);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !poId) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const idParam = apiEndpoint === 'grn-attachments' ? 'grnId' : 'poId';
        
        // Request upload URL
        const requestResponse = await apiClient.post(`/${apiEndpoint}/request-upload`, {
          [idParam]: poId,
          fileName: file.name
        });

        const { uploadUrl, tempKey } = requestResponse.data;

        // Upload to R2
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        if (!uploadResponse.ok) throw new Error('Upload failed');

        // Complete upload
        const result = await apiClient.post(`/${apiEndpoint}/complete-upload`, {
          [idParam]: poId,
          tempKey,
          fileName: file.name
        });

        const attachment = result.data?.attachment || result.attachment;
        if (result.success && attachment) {
          setLoadedAttachments(prev => [...prev, attachment]);
          if (onUpload) onUpload(attachment);
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Compact header with icon and upload button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineDocumentText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Invoice & Documents</span>
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1"
        >
          <HiOutlinePaperClip className="w-3 h-3" />
          {uploading ? 'Uploading...' : 'Add'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Compact attachments list */}
      {loadedAttachments.length > 0 && (
        <div className="space-y-1">
          {loadedAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs hover:bg-gray-100"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <HiOutlineDocumentText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{attachment.fileName}</div>
                  <div className="text-gray-500">{formatFileSize(attachment.compressedSize)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="View"
                >
                  <HiOutlineEye className="w-3 h-3" />
                </a>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <HiOutlineTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loadedAttachments.length === 0 && (
        <div className="text-xs text-gray-500 italic">No documents attached</div>
      )}
    </div>
  );
}
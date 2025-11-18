'use client';

import React, { useRef } from 'react';
import { MdAttachFile, MdDescription, MdClose } from 'react-icons/md';

interface Attachment {
  id: string;
  name: string;
  url: string;
}

interface AttachmentUploaderProps {
  poId?: string;
  attachments: Attachment[];
  onUpload: (attachment: Attachment) => void;
  onRemove?: (attachmentId: string) => void;
}

export default function AttachmentUploader({ 
  poId, 
  attachments, 
  onUpload, 
  onRemove 
}: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        // Mock upload - replace with actual API call
        const mockAttachment: Attachment = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url: URL.createObjectURL(file) // In real app, this would be the uploaded file URL
        };

        onUpload(mockAttachment);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
          <MdAttachFile className="h-4 w-4" />
          Attachments
        </h3>
      </div>

      <div className="p-4">
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
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <MdDescription className="mx-auto h-8 w-8 text-gray-400" />
          <div className="mt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Click to upload
            </button>
            <span className="text-sm text-gray-500"> or drag and drop</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            PDF, DOC, JPG, PNG up to 10MB
          </p>
        </div>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-medium text-gray-700">Uploaded Files</h4>
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MdDescription className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {attachment.name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View
                  </a>
                  {onRemove && (
                    <button
                      onClick={() => onRemove(attachment.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <MdClose className="h-4 w-4" />
                    </button>
                  )}
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
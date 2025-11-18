'use client';

import React, { useState } from 'react';
import { HiOutlineCloudArrowUp, HiOutlineXMark } from 'react-icons/hi2';

interface UploadFeedWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, mapping: any) => void;
}

export default function UploadFeedWizard({ isOpen, onClose, onSubmit }: UploadFeedWizardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'CSV' | 'OFX'>('CSV');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (file) {
      onSubmit(file, { fileType, accountId: 'acct_01' });
      onClose();
      setFile(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Upload bank/gateway file (CSV/OFX) or drop here</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <HiOutlineXMark className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">File Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="CSV"
                  checked={fileType === 'CSV'}
                  onChange={(e) => setFileType(e.target.value as 'CSV')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">CSV</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="OFX"
                  checked={fileType === 'OFX'}
                  onChange={(e) => setFileType(e.target.value as 'OFX')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">OFX</span>
              </label>
            </div>
          </div>

          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <HiOutlineCloudArrowUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">Drop file here or click to upload</p>
              <input
                type="file"
                accept=".csv,.ofx"
                onChange={handleFileChange}
                className="hidden"
                id="feed-upload"
              />
              <label
                htmlFor="feed-upload"
                className="inline-block px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Choose File
              </label>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiOutlineXMark className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file}
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Upload & Process
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

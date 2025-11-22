'use client';

import React, { useState } from 'react';
import { OCRResult } from '@/types/expenses';
import { HiOutlineCloudArrowUp, HiOutlineXMark } from 'react-icons/hi2';

interface UploadOCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const FormFieldSkeleton = () => (
    <div className="space-y-1">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
        <div className="h-10 bg-gray-200 rounded-md w-full"></div>
    </div>
)

export default function UploadOCRModal({ isOpen, onClose, onSubmit }: UploadOCRModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    grossAmount: 0,
    gstAmount: 0,
    category: ''
  });

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsProcessingOCR(true);
      // Simulate OCR processing
      setTimeout(() => {
        // In a real app, you would send the file to an OCR API
        // and set the ocrResult and formData based on the API response.
        setOcrResult(null); // No OCR result initially
        setFormData({ // Initialize with empty/default values
            vendorId: '',
            invoiceNumber: '',
            invoiceDate: '',
            dueDate: '',
            grossAmount: 0,
            gstAmount: 0,
            category: ''
        });
        setIsProcessingOCR(false);
      }, 1500);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Upload Bill</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <HiOutlineXMark className="h-6 w-6" />
          </button>
        </div>

        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <HiOutlineCloudArrowUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">Upload invoice (PDF/JPG/PNG) or drag here</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer"
            >
              Choose File
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {isProcessingOCR ? (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center animate-pulse">
                    <p className="text-sm text-gray-600">Processing bill data...</p>
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mt-2"></div>
                </div>
            ) : ocrResult ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  We extracted fields from the invoice. Please review and confirm.
                </p>
                <p className="text-xs text-yellow-700 mt-1">Confidence: {Math.round(ocrResult.confidence * 100)}%</p>
              </div>
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">No data extracted from the document. Please enter manually.</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {isProcessingOCR ? (
                <>
                    <FormFieldSkeleton/>
                    <FormFieldSkeleton/>
                    <FormFieldSkeleton/>
                    <FormFieldSkeleton/>
                    <FormFieldSkeleton/>
                    <FormFieldSkeleton/>
                    <div className="col-span-2"><FormFieldSkeleton/></div>
                </>
              ) : (
                <>
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Vendor</label>
                        <select
                        value={formData.vendorId}
                        onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                        <option value="">Select vendor</option>
                        <option value="sup_001">ABC Supplies</option>
                        <option value="sup_002">MediCore</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Invoice Number</label>
                        <input
                        type="text"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Invoice Date</label>
                        <input
                        type="date"
                        value={formData.invoiceDate}
                        onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Due Date</label>
                        <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Gross Amount</label>
                        <input
                        type="number"
                        value={formData.grossAmount}
                        onChange={(e) => setFormData({ ...formData, grossAmount: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-1">GST Amount</label>
                        <input
                        type="number"
                        value={formData.gstAmount}
                        onChange={(e) => setFormData({ ...formData, gstAmount: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm text-gray-700 mb-1">Category</label>
                        <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                        <option value="">Select category</option>
                        <option value="Consumables">Consumables</option>
                        <option value="Rent">Rent</option>
                        <option value="Utilities">Utilities</option>
                        </select>
                    </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isProcessingOCR}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                disabled={isProcessingOCR}
              >
                Submit for Approval
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

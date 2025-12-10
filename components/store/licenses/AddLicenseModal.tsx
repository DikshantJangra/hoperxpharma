'use client';

import { useState } from 'react';
import { FiX, FiUpload, FiFile } from 'react-icons/fi';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

export default function AddLicenseModal({ onClose }: any) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [meta, setMeta] = useState({ type: '', number: '', authority: '', validFrom: '', validTo: '' });

  // Enable enhanced keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation();

  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
        data-focus-trap="true"
      >
        <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#0f172a]">Add License</h2>
            <p className="text-sm text-[#64748b]">Upload license document and extract details</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#f1f5f9] rounded">
            <FiX className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-2">Upload Document</label>
            <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-[#0ea5a3] bg-[#f0fdfa]' : 'border-[#cbd5e1] hover:border-[#0ea5a3]'
              }`}>
              <FiUpload className="w-12 h-12 text-[#94a3b8] mx-auto mb-3" />
              <p className="text-sm text-[#64748b] mb-2">Drag files here or click to upload</p>
              <p className="text-xs text-[#94a3b8] mb-4">PDF, JPG, PNG (max 25MB)</p>
              <input type="file" accept="application/pdf,image/*" onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="px-4 py-2 bg-[#f1f5f9] text-[#64748b] rounded-lg hover:bg-[#e2e8f0] cursor-pointer inline-block text-sm font-medium">
                Choose File
              </label>
            </div>
            {files.length > 0 && (
              <div className="mt-4 p-3 bg-[#f8fafc] rounded-lg flex items-center gap-3">
                <FiFile className="w-5 h-5 text-[#0ea5a3]" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#0f172a]">{files[0].name}</div>
                  <div className="text-xs text-[#64748b]">{(files[0].size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-2">License Details</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#64748b] mb-1">Type</label>
                <select value={meta.type} onChange={(e) => setMeta({ ...meta, type: e.target.value })} className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm">
                  <option value="">Select type</option>
                  <option>Drug License</option>
                  <option>Pharmacy License</option>
                  <option>GST Registration</option>
                  <option>Narcotic License</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#64748b] mb-1">License Number</label>
                <input type="text" value={meta.number} onChange={(e) => setMeta({ ...meta, number: e.target.value })} placeholder="DL-IN-12345" className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#64748b] mb-1">Issuing Authority</label>
                <input type="text" value={meta.authority} onChange={(e) => setMeta({ ...meta, authority: e.target.value })} placeholder="State Drug Controller" className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#64748b] mb-1">Valid From</label>
                  <input type="date" value={meta.validFrom} onChange={(e) => setMeta({ ...meta, validFrom: e.target.value })} className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-[#64748b] mb-1">Valid To</label>
                  <input type="date" value={meta.validTo} onChange={(e) => setMeta({ ...meta, validTo: e.target.value })} className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] text-sm font-medium">
            Cancel
          </button>
          <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] text-sm font-medium">
            Submit for Verification
          </button>
        </div>
      </div>
    </div>
  );
}

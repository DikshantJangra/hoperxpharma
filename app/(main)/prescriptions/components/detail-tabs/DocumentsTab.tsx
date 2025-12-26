'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiFile, FiDownload, FiEye, FiUpload, FiTrash2, FiX, FiImage, FiFileText } from 'react-icons/fi';
import { prescriptionApi } from '@/lib/api/prescriptions';
import toast from 'react-hot-toast';

interface DocumentsTabProps {
  prescription: any;
  onUpdate: () => void;
}

export default function DocumentsTab({ prescription, onUpdate }: DocumentsTabProps) {
  const [documents, setDocuments] = useState(prescription?.files || []);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const getFileType = (fileUrl: string) => {
    const ext = fileUrl?.split('.').pop()?.split('?')[0]?.toUpperCase();
    return ext || 'FILE';
  };

  const isImage = (fileUrl: string) => {
    const ext = getFileType(fileUrl).toLowerCase();
    return ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP'].includes(ext.toUpperCase());
  };

  const isPDF = (fileUrl: string) => {
    return getFileType(fileUrl).toUpperCase() === 'PDF';
  };

  const handleView = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handlePreview = (fileUrl: string) => {
    setPreviewUrl(fileUrl);
  };

  const handleDownload = (fileUrl: string) => {
    const fileName = fileUrl.split('/').pop()?.split('?')[0] || 'file';
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();

      // Add the prescription ID for updating
      formData.append('prescriptionId', prescription.id);

      // Add all files
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      // Preserve existing prescription data
      formData.append('patientId', prescription.patient.id);
      if (prescription.prescriber) {
        formData.append('prescriberId', prescription.prescriber.id);
      }
      formData.append('priority', prescription.priority);
      formData.append('source', prescription.source);
      formData.append('status', prescription.status);
      formData.append('totalRefills', prescription.totalRefills?.toString() || '0');
      formData.append('instructions', prescription.versions?.[0]?.instructions || '');

      // Add existing items
      if (prescription.items && prescription.items.length > 0) {
        const items = prescription.items.map((item: any) => ({
          drugId: item.drugId,
          batchId: item.batchId,
          quantity: item.quantityPrescribed,
          sig: item.sig,
          daysSupply: item.daysSupply
        }));
        formData.append('items', JSON.stringify(items));
      }

      const response = await prescriptionApi.createPrescription(formData);

      if (response.success) {
        toast.success(`${files.length} file(s) uploaded successfully!`);
        onUpdate(); // Refresh the prescription data
        event.target.value = ''; // Clear the input
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string, fileUrl: string) => {
    try {
      await prescriptionApi.deleteFile(prescription.id, fileId);
      toast.success('File deleted successfully');
      setConfirmDelete(null);
      onUpdate(); // Refresh prescription data
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete file');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FiUpload className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Upload Documents</h3>
            </div>

            <label className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <FiUpload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Choose Files'}
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-sm text-gray-600">
            Upload prescription scans, images, or PDF documents. Multiple files supported.
          </p>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Documents ({documents.length})</h3>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FiFile className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Documents</h3>
              <p className="text-gray-500">No documents have been uploaded for this prescription yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((document: any) => (
              <Card key={document.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Preview Section */}
                  {isImage(document.fileUrl) ? (
                    <div
                      className="relative h-48 bg-gray-100 cursor-pointer group"
                      onClick={() => handlePreview(document.fileUrl)}
                    >
                      <img
                        src={document.fileUrl}
                        alt="Prescription document"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <FiEye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ) : isPDF(document.fileUrl) ? (
                    <div
                      className="h-48 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center cursor-pointer group"
                      onClick={() => handleView(document.fileUrl)}
                    >
                      <div className="text-center">
                        <FiFileText className="h-16 w-16 text-red-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-red-700">PDF Document</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <FiFile className="h-16 w-16 text-gray-400" />
                    </div>
                  )}

                  {/* Info & Actions */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {document.fileUrl?.split('/').pop()?.split('?')[0] || 'Document'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {getFileType(document.fileUrl)} • {new Date(document.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {isImage(document.fileUrl) && (
                          <button
                            onClick={() => handlePreview(document.fileUrl)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Preview"
                          >
                            <FiImage className="h-4 w-4 text-gray-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleView(document.fileUrl)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Open in new tab"
                        >
                          <FiEye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDownload(document.fileUrl)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Download"
                        >
                          <FiDownload className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(document.id)}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <FiX className="h-8 w-8" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Delete Document?</h3>
                  <p className="text-sm text-gray-600">
                    This will permanently delete the document from the prescription and cloud storage. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const doc = documents.find((d: any) => d.id === confirmDelete);
                    if (doc) handleDelete(confirmDelete, doc.fileUrl);
                  }}
                >
                  Delete Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
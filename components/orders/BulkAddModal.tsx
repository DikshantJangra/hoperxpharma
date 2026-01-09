import React, { useState } from 'react';
import { FiX, FiDownload, FiUpload } from 'react-icons/fi';
import { HiOutlineInformationCircle } from 'react-icons/hi2';
import { parseCSVForBulkAdd, generateExampleCSV, type BulkAddItem } from '@/lib/parsers/csvParser';
import { apiClient } from '@/lib/api/client';

interface BulkAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (items: any[]) => void;
    supplier?: any;
}

export default function BulkAddModal({ isOpen, onClose, onAdd, supplier }: BulkAddModalProps) {
    const [csvText, setCSVText] = useState('');
    const [preview, setPreview] = useState<BulkAddItem[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleParse = () => {
        const result = parseCSVForBulkAdd(csvText);
        setPreview(result.items);
        setErrors(result.errors);
    };

    const handleAdd = async () => {
        if (preview.length === 0) return;

        setLoading(true);
        try {
            const response = await apiClient.post('/purchase-orders/bulk-add', {
                items: preview,
                supplierId: supplier?.id
            });

            onAdd(response.data.lines || response.lines || []);
            handleClose();
        } catch (error: any) {
            console.error('Bulk add failed:', error);
            setErrors([...errors, error.message || 'Failed to add items. Please try again.']);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCSVText('');
        setPreview([]);
        setErrors([]);
        onClose();
    };

    const handleLoadExample = () => {
        setCSVText(generateExampleCSV());
        setErrors([]);
    };

    const handleDownloadTemplate = () => {
        const template = 'drugCode,quantity,price\ndrug_123,10,45.50\ndrug_456,5,120.00\ndrug_789,20,';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bulk_add_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Bulk Add Items</h3>
                                <p className="text-sm text-gray-600 mt-1">Add multiple items at once using CSV format</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white px-6 py-4 space-y-4">
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <HiOutlineInformationCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-blue-900 mb-2">How to use:</h4>
                                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                        <li>Download the template or load an example below</li>
                                        <li>Fill in: <code className="bg-blue-100 px-1 rounded">drugCode, quantity, price</code></li>
                                        <li>Price is optional (will use default if not provided)</li>
                                        <li>Paste your CSV data and click "Parse & Preview"</li>
                                        <li>Review the preview and click "Add Items"</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FiDownload size={16} />
                                Download Template
                            </button>
                            <button
                                onClick={handleLoadExample}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                                <FiUpload size={16} />
                                Load Example
                            </button>
                        </div>

                        {/* CSV Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Paste CSV Data
                            </label>
                            <textarea
                                value={csvText}
                                onChange={(e) => setCSVText(e.target.value)}
                                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                placeholder="drugCode,quantity,price&#10;drug_123,10,45.50&#10;drug_456,5,120.00&#10;drug_789,20"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Format: <code className="bg-gray-100 px-1 rounded">drugCode, quantity, price</code> (one item per line)
                            </p>
                        </div>

                        <button
                            onClick={handleParse}
                            disabled={!csvText.trim()}
                            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Parse & Preview
                        </button>

                        {/* Errors */}
                        {errors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-red-600 rounded-full"></span>
                                    Errors Found ({errors.length})
                                </h4>
                                <ul className="space-y-1 max-h-32 overflow-y-auto">
                                    {errors.map((error, i) => (
                                        <li key={i} className="text-xs text-red-700 pl-4">
                                            • {error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Preview */}
                        {preview.length > 0 && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-700">
                                        Preview ({preview.length} items)
                                    </h4>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                                                    #
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                                                    Drug ID
                                                </th>
                                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                                                    Quantity
                                                </th>
                                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                                                    Price
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {preview.map((item, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                                                    <td className="px-4 py-2 text-gray-900 font-mono text-xs">{item.drugId}</td>
                                                    <td className="px-4 py-2 text-right text-gray-900">{item.qty}</td>
                                                    <td className="px-4 py-2 text-right text-gray-900">
                                                        {item.pricePerUnit ? `₹${item.pricePerUnit.toFixed(2)}` : <span className="text-gray-400">-</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={preview.length === 0 || loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Adding...
                                </>
                            ) : (
                                `Add ${preview.length} Items`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

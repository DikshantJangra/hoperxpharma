import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { parseCSVForBulkAdd, generateExampleCSV, type BulkAddItem } from '@/lib/parsers/csvParser';

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
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiBaseUrl}/purchase-orders/bulk-add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    items: preview,
                    supplierId: supplier?.id
                })
            });

            if (response.ok) {
                const result = await response.json();
                onAdd(result.data.lines || result.lines || []);
                handleClose();
            } else {
                throw new Error('Failed to bulk add items');
            }
        } catch (error) {
            console.error('Bulk add failed:', error);
            setErrors([...errors, 'Failed to add items. Please try again.']);
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
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Bulk Add Items</h3>
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
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Paste CSV (drugCode, qty, price)
                                </label>
                                <button
                                    onClick={handleLoadExample}
                                    className="text-xs text-emerald-600 hover:text-emerald-700"
                                >
                                    Load Example
                                </button>
                            </div>
                            <textarea
                                value={csvText}
                                onChange={(e) => setCSVText(e.target.value)}
                                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="drug_123, 10, 45.50&#10;drug_456, 5, 120.00&#10;drug_789, 20"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Format: drugCode, quantity, price (price is optional)
                            </p>
                        </div>

                        <button
                            onClick={handleParse}
                            disabled={!csvText.trim()}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Parse & Preview
                        </button>

                        {/* Errors */}
                        {errors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                                <ul className="space-y-1">
                                    {errors.map((error, i) => (
                                        <li key={i} className="text-xs text-red-700">
                                            {error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Preview */}
                        {preview.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Preview ({preview.length} items)
                                </h4>
                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Drug ID
                                                </th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Qty
                                                </th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Price
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {preview.map((item, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-gray-900">{item.drugId}</td>
                                                    <td className="px-3 py-2 text-right text-gray-900">{item.qty}</td>
                                                    <td className="px-3 py-2 text-right text-gray-900">
                                                        {item.pricePerUnit ? `₹${item.pricePerUnit.toFixed(2)}` : '-'}
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
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={preview.length === 0 || loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Adding...' : `Add ${preview.length} Items`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

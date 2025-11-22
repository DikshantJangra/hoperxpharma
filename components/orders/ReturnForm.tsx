'use client';

import React, { useState } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';

interface ReturnFormProps {
    onSubmit: (returnData: ReturnData) => void;
    onCancel: () => void;
}

export interface ReturnData {
    poNumber: string;
    items: Array<{
        productName: string;
        quantity: number;
        reason: string;
    }>;
    notes: string;
}

export default function ReturnForm({ onSubmit, onCancel }: ReturnFormProps) {
    const [formData, setFormData] = useState<ReturnData>({
        poNumber: '',
        items: [{ productName: '', quantity: 0, reason: '' }],
        notes: ''
    });

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productName: '', quantity: 0, reason: '' }]
        });
    };

    const removeItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Create Return Request</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* PO Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Purchase Order
                        </label>
                        <select
                            value={formData.poNumber}
                            onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            required
                        >
                            <option value="">Select a PO...</option>
                            <option value="PO-2025-000123">PO-2025-000123 - ABC Pharma</option>
                            <option value="PO-2025-000121">PO-2025-000121 - MediCore</option>
                            <option value="PO-2025-000120">PO-2025-000120 - HealthPlus</option>
                        </select>
                    </div>

                    {/* Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Items to Return
                            </label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                + Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.items.map((item, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Product</label>
                                            <input
                                                type="text"
                                                value={item.productName}
                                                onChange={(e) => updateItem(index, 'productName', e.target.value)}
                                                placeholder="Product name"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                                placeholder="0"
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Reason</label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={item.reason}
                                                    onChange={(e) => updateItem(index, 'reason', e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                    required
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="damaged">Damaged</option>
                                                    <option value="expired">Expired</option>
                                                    <option value="wrong-item">Wrong Item</option>
                                                    <option value="quality">Quality Issue</option>
                                                </select>
                                                {formData.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <FiX size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Add any additional details..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                        />
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Photos (Optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                            <FiUpload className="mx-auto text-gray-400 mb-2" size={32} />
                            <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            Submit Return Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

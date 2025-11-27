'use client';

import React, { useState } from 'react';
import { HiOutlineXMark, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';

interface BatchSplitModalProps {
    item: any;
    drugName: string;
    onSplit: (splitData: any[]) => void;
    onClose: () => void;
}

export default function BatchSplitModal({ item, drugName, onSplit, onClose }: BatchSplitModalProps) {
    const [splits, setSplits] = useState([
        {
            receivedQty: Math.floor(item.receivedQty / 2),
            freeQty: 0,
            batchNumber: '',
            expiryDate: '',
            mrp: item.mrp,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            gstPercent: item.gstPercent
        },
        {
            receivedQty: item.receivedQty - Math.floor(item.receivedQty / 2),
            freeQty: 0,
            batchNumber: '',
            expiryDate: '',
            mrp: item.mrp,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            gstPercent: item.gstPercent
        }
    ]);

    const totalQty = splits.reduce((sum, split) => sum + parseInt(split.receivedQty.toString()), 0);
    const isValid = totalQty === item.receivedQty && splits.every(s => s.batchNumber && s.expiryDate);

    const addSplit = () => {
        setSplits([...splits, {
            receivedQty: 0,
            freeQty: 0,
            batchNumber: '',
            expiryDate: '',
            mrp: item.mrp,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            gstPercent: item.gstPercent
        }]);
    };

    const removeSplit = (index: number) => {
        if (splits.length > 2) {
            setSplits(splits.filter((_, i) => i !== index));
        }
    };

    const updateSplit = (index: number, field: string, value: any) => {
        const newSplits = [...splits];
        newSplits[index] = { ...newSplits[index], [field]: value };
        setSplits(newSplits);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Split Batch</h2>
                            <p className="text-sm text-gray-500 mt-1">{drugName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <HiOutlineXMark className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-900">
                            Total quantity to distribute: <span className="font-semibold">{item.receivedQty} units</span>
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                            Current total: <span className={totalQty === item.receivedQty ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{totalQty} units</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        {splits.map((split, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-900">Batch {index + 1}</h3>
                                    {splits.length > 2 && (
                                        <button
                                            onClick={() => removeSplit(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <HiOutlineTrash className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            value={split.receivedQty}
                                            onChange={(e) => updateSplit(index, 'receivedQty', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Free Qty
                                        </label>
                                        <input
                                            type="number"
                                            value={split.freeQty}
                                            onChange={(e) => updateSplit(index, 'freeQty', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Batch Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={split.batchNumber}
                                            onChange={(e) => updateSplit(index, 'batchNumber', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="e.g., A2X9"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Expiry Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={split.expiryDate}
                                            onChange={(e) => updateSplit(index, 'expiryDate', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            MRP
                                        </label>
                                        <input
                                            type="number"
                                            value={split.mrp}
                                            onChange={(e) => updateSplit(index, 'mrp', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Unit Price
                                        </label>
                                        <input
                                            type="number"
                                            value={split.unitPrice}
                                            onChange={(e) => updateSplit(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addSplit}
                        className="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2"
                    >
                        <HiOutlinePlus className="h-5 w-5" />
                        Add Another Batch
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSplit(splits)}
                            disabled={!isValid}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Split Batch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

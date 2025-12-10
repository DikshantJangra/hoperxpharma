'use client';

import React, { useState } from 'react';
import { HiOutlineXMark, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface BatchSplitModalProps {
    item: any;
    drugName: string;
    onSplit: (splitData: any[]) => void;
    onClose: () => void;
}

export default function BatchSplitModal({ item, drugName, onSplit, onClose }: BatchSplitModalProps) {
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [splits, setSplits] = useState([
        {
            receivedQty: Math.floor(item.receivedQty / 2),
            freeQty: 0,
            batchNumber: item.batchNumber || '',
            expiryDate: item.expiryDate || '',
            location: item.location || '',
            mrp: item.mrp || 0,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountType: item.discountType || 'BEFORE_GST',
            gstPercent: item.gstPercent
        },
        {
            receivedQty: item.receivedQty - Math.floor(item.receivedQty / 2),
            freeQty: 0,
            batchNumber: item.batchNumber || '',
            expiryDate: item.expiryDate || '',
            location: item.location || '',
            mrp: item.mrp || 0,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountType: item.discountType || 'BEFORE_GST',
            gstPercent: item.gstPercent
        }
    ]);

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    const totalQty = splits.reduce((sum, split) => sum + parseInt(split.receivedQty.toString()), 0);
    const totalFreeQty = splits.reduce((sum, split) => sum + parseInt(split.freeQty.toString()), 0);

    // Validation
    const errors = [];
    if (totalQty !== Number(item.receivedQty)) {
        errors.push(`Split quantities must total ${item.receivedQty} (currently ${totalQty})`);
    }
    if (totalFreeQty !== Number(item.freeQty || 0)) {
        errors.push(`Free quantities must total ${item.freeQty || 0} (currently ${totalFreeQty})`);
    }
    if (splits.some(s => !s.batchNumber || s.batchNumber.trim() === '')) {
        errors.push('All splits must have batch numbers');
    }
    if (splits.some(s => !s.expiryDate || new Date(s.expiryDate).getFullYear() === 1970)) {
        errors.push('All splits must have valid expiry dates');
    }
    if (splits.some(s => s.receivedQty <= 0 && s.freeQty <= 0)) {
        errors.push('Each split must have quantity > 0');
    }
    // Check for duplicate batch numbers
    const batchNumbers = splits.map(s => s.batchNumber).filter(b => b);
    if (new Set(batchNumbers).size !== batchNumbers.length) {
        errors.push('Batch numbers must be unique');
    }

    const isValid = errors.length === 0;

    const addSplit = () => {
        setSplits([...splits, {
            receivedQty: 0,
            freeQty: 0,
            batchNumber: item.batchNumber || '',
            expiryDate: item.expiryDate || '',
            location: item.location || '',
            mrp: item.mrp || 0,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountType: item.discountType || 'BEFORE_GST',
            gstPercent: item.gstPercent || 5
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

    const handleSplit = () => {
        setAttemptedSubmit(true);
        if (isValid) {
            onSplit(splits);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onKeyDown={handleKeyDown}
        >
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
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-blue-700">Received to distribute:</span>
                                <span className="font-semibold text-blue-900 ml-2">{item.receivedQty} units</span>
                            </div>
                            <div>
                                <span className="text-blue-700">Free to distribute:</span>
                                <span className="font-semibold text-blue-900 ml-2">{item.freeQty || 0} units</span>
                            </div>
                            <div>
                                <span className="text-blue-700">Current received total:</span>
                                <span className={`font-semibold ml-2 ${totalQty === item.receivedQty ? 'text-emerald-600' : 'text-red-600'}`}>{totalQty} units</span>
                            </div>
                            <div>
                                <span className="text-blue-700">Current free total:</span>
                                <span className={`font-semibold ml-2 ${totalFreeQty === (item.freeQty || 0) ? 'text-emerald-600' : 'text-red-600'}`}>{totalFreeQty} units</span>
                            </div>
                        </div>
                    </div>

                    {attemptedSubmit && errors.length > 0 && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-red-900 mb-1">Validation Errors:</p>
                            <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                                {errors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

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
                                            onFocus={(e) => e.target.select()}
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
                                            onFocus={(e) => e.target.select()}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            min="0"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
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
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Expiry (MM/YYYY) *
                                        </label>
                                        <input

                                            defaultValue={split.expiryDate ? (() => {
                                                const date = new Date(split.expiryDate);
                                                const year = date.getFullYear();
                                                // Treat 1970 (epoch/invalid dates) as empty
                                                if (year === 1970) return '';
                                                return `${String(date.getMonth() + 1).padStart(2, '0')}/${year}`;
                                            })() : ''}
                                            onInput={(e) => {
                                                const inputType = (e.nativeEvent as any).inputType;
                                                // Prevent auto-fill on backspaces
                                                if (inputType && inputType.startsWith('delete')) {
                                                    return;
                                                }

                                                let value = e.currentTarget.value.replace(/[^0-9/]/g, '');

                                                // Smart month formatting:
                                                // - If first digit is 2, auto-format to "02/" immediately
                                                // - If first digit is > 2, auto-format to "0X/"
                                                // - If first digit is 0 or 1, wait for second digit
                                                if (value.length === 1 && !value.includes('/')) {
                                                    const firstDigit = parseInt(value);
                                                    if (firstDigit === 2) {
                                                        value = '02/';
                                                        e.currentTarget.value = value;
                                                        return;
                                                    } else if (firstDigit > 2) {
                                                        value = '0' + value + '/';
                                                        e.currentTarget.value = value;
                                                        return;
                                                    }
                                                    // For 0 or 1, just continue (wait for second digit)
                                                }

                                                // Add slash after valid 2-digit month
                                                if (value.length === 2 && !value.includes('/')) {
                                                    const month = parseInt(value);
                                                    if (month > 12) {
                                                        value = '12';
                                                    }
                                                    value = value + '/';
                                                }
                                                // Insert slash after MM if user types more
                                                else if (value.length > 2 && !value.includes('/')) {
                                                    const monthPart = value.substring(0, 2);
                                                    const month = parseInt(monthPart);
                                                    if (month > 12) {
                                                        value = '12/' + value.substring(2);
                                                    } else {
                                                        value = monthPart + '/' + value.substring(2);
                                                    }
                                                }

                                                // Limit year to 4 digits
                                                if (value.includes('/')) {
                                                    const parts = value.split('/');
                                                    if (parts[1] && parts[1].length > 4) {
                                                        parts[1] = parts[1].substring(0, 4);
                                                        value = parts[0] + '/' + parts[1];
                                                    }
                                                }

                                                // Limit to MM/YYYY format (7 chars)
                                                if (value.length > 7) {
                                                    value = value.substring(0, 7);
                                                }

                                                e.currentTarget.value = value;
                                            }}
                                            onBlur={(e) => {
                                                let value = e.currentTarget.value.trim();

                                                // Only save if we have a complete MM/YYYY format with 4-digit year
                                                if (value && value.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/)) {
                                                    const [month, year] = value.split('/');
                                                    const paddedMonth = month.padStart(2, '0');
                                                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                                                    const fullDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;
                                                    e.currentTarget.value = `${paddedMonth}/${year}`;
                                                    updateSplit(index, 'expiryDate', fullDate);
                                                }
                                                // If incomplete (e.g., "12/" or "12/20"), don't save - just leave it in the field
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="MM/YYYY (e.g., 12/2027)"
                                            maxLength={7}
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
                                            onFocus={(e) => e.target.select()}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Purchase Rate
                                        </label>
                                        <input
                                            type="number"
                                            value={split.unitPrice}
                                            onChange={(e) => updateSplit(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Disc %
                                        </label>
                                        <input
                                            type="number"
                                            value={split.discountPercent !== undefined && split.discountPercent !== null ? split.discountPercent : 0}
                                            onChange={(e) => updateSplit(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            step="0.01"
                                            max="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Disc Type
                                        </label>
                                        <select
                                            value={split.discountType || 'BEFORE_GST'}
                                            onChange={(e) => updateSplit(index, 'discountType', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="BEFORE_GST">Before GST</option>
                                            <option value="AFTER_GST">After GST</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            GST %
                                        </label>
                                        <select
                                            value={split.gstPercent !== undefined && split.gstPercent !== null ? split.gstPercent : 5}
                                            onChange={(e) => updateSplit(index, 'gstPercent', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            {[0, 5, 12, 18, 28].map((rate) => (
                                                <option key={rate} value={rate}>
                                                    {rate}%
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            value={split.location || ''}
                                            onChange={(e) => updateSplit(index, 'location', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="e.g., Rack A-1"
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
                            onClick={handleSplit}
                            disabled={attemptedSubmit && !isValid}
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
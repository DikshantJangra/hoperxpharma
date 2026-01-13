'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineXMark, HiOutlinePlus, HiOutlineTrash, HiChevronDown, HiChevronUp } from 'react-icons/hi2';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { inventoryApi } from '@/lib/api/inventory';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

interface BatchSplitModalProps {
    item: any;
    drugName: string;
    onSplit: (splitData: any[]) => void;
    onClose: () => void;
}

export default function BatchSplitModal({ item, drugName, onSplit, onClose }: BatchSplitModalProps) {
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [batchStatus, setBatchStatus] = useState<Record<number, any>>({});
    const [expandedBatchInfo, setExpandedBatchInfo] = useState<Record<number, boolean>>({});
    const batchCheckTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map());
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
            gstPercent: item.gstPercent,
            manufacturerBarcode: item.manufacturerBarcode || ''
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
            gstPercent: item.gstPercent,
            manufacturerBarcode: item.manufacturerBarcode || ''
        }
    ]);

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            batchCheckTimeouts.current.forEach(timeout => clearTimeout(timeout));
            batchCheckTimeouts.current.clear();
        };
    }, []);

    // Check if batch exists in inventory (debounced)
    const checkBatchInInventory = (index: number, batchNumber: string) => {
        // Clear existing timeout for this split
        const existing = batchCheckTimeouts.current.get(index);
        if (existing) clearTimeout(existing);

        // Only check if batch number is meaningful
        if (!batchNumber || batchNumber === 'TBD' || batchNumber.length < 2) {
            setBatchStatus(prev => {
                const updated = { ...prev };
                delete updated[index];
                return updated;
            });
            return;
        }

        // Set new timeout
        const timeout = setTimeout(async () => {
            try {
                const result = await inventoryApi.checkBatch(item.drugId, batchNumber);
                if (result.success) {
                    setBatchStatus(prev => ({
                        ...prev,
                        [index]: result.data || { exists: false }
                    }));
                }
            } catch (error) {
                console.error('Failed to check batch in inventory:', error);
                setBatchStatus(prev => ({
                    ...prev,
                    [index]: { exists: false }
                }));
            }
        }, 500); // 500ms debounce

        batchCheckTimeouts.current.set(index, timeout);
    };

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
            gstPercent: item.gstPercent,
            manufacturerBarcode: item.manufacturerBarcode || ''
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

        // Check inventory when batch number changes
        if (field === 'batchNumber' && typeof value === 'string') {
            checkBatchInInventory(index, value);
        }
    };

    const toggleBatchInfo = (index: number) => {
        setExpandedBatchInfo(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
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
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Batch Number *
                                        </label>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={split.batchNumber}
                                                    onChange={(e) => updateSplit(index, 'batchNumber', e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                    placeholder="e.g., A2X9"
                                                />
                                                {/* Status Badge */}
                                                {batchStatus[index] && (
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                                                        batchStatus[index].exists 
                                                            ? 'bg-blue-100 text-blue-700' 
                                                            : 'bg-green-100 text-green-700'
                                                    }`}>
                                                        {batchStatus[index].exists ? '📦 Stocked' : '✨ New'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Show QR/Barcode Panel for existing batches */}
                                            {batchStatus[index]?.exists && (
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleBatchInfo(index)}
                                                        className="flex items-center justify-between w-full text-sm text-blue-800 font-medium mb-2"
                                                    >
                                                        <span className="flex items-center gap-1">
                                                            <span>📋</span>
                                                            <span>Existing Batch Details</span>
                                                        </span>
                                                        {expandedBatchInfo[index] ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
                                                    </button>

                                                    {expandedBatchInfo[index] && (
                                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            <div className="flex gap-3 items-start flex-wrap">
                                                                {/* Internal QR Code */}
                                                                {(batchStatus[index].internalQR || batchStatus[index].internalQRCode || batchStatus[index].batchId) && (
                                                                    <div className="flex flex-col items-center bg-white p-2 rounded border border-gray-200">
                                                                        <div className="text-[9px] text-gray-500 mb-1 font-medium">Internal QR</div>
                                                                        <QRCodeSVG
                                                                            value={batchStatus[index].internalQR || batchStatus[index].internalQRCode || batchStatus[index].batchId || ''}
                                                                            size={60}
                                                                            className="border p-1"
                                                                            level="M"
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Manufacturer Barcode */}
                                                                {batchStatus[index].manufacturerBarcode && (
                                                                    <div className="flex-1 min-w-[180px] bg-white p-2 rounded border border-gray-200">
                                                                        <div className="text-[9px] text-gray-500 mb-1 font-medium">Manufacturer Barcode</div>
                                                                        <div className="font-mono text-xs text-gray-900 mb-1">
                                                                            {batchStatus[index].manufacturerBarcode}
                                                                        </div>
                                                                        <div className="overflow-hidden">
                                                                            <Barcode
                                                                                value={batchStatus[index].manufacturerBarcode}
                                                                                width={1}
                                                                                height={20}
                                                                                displayValue={false}
                                                                                margin={0}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Batch Details */}
                                                            <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2 rounded border border-gray-200">
                                                                <div className="flex flex-col">
                                                                    <span className="text-gray-500 font-medium">Location</span>
                                                                    <span className="text-gray-900">{batchStatus[index].location || 'Not set'}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-gray-500 font-medium">Current MRP</span>
                                                                    <span className="text-gray-900 font-semibold">₹{batchStatus[index].mrp}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-gray-500 font-medium">Expiry</span>
                                                                    <span className="text-gray-900">
                                                                        {batchStatus[index].expiry ? new Date(batchStatus[index].expiry).toLocaleDateString('en-GB', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            year: '2-digit'
                                                                        }) : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-gray-500 font-medium">Current Stock</span>
                                                                    <span className="text-blue-600 font-bold">{batchStatus[index].currentStock} units</span>
                                                                </div>
                                                            </div>

                                                            {/* Auto-fill suggestion */}
                                                            {batchStatus[index].manufacturerBarcode && !split.manufacturerBarcode && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateSplit(index, 'manufacturerBarcode', batchStatus[index].manufacturerBarcode)}
                                                                    className="w-full text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                                                                >
                                                                    ✨ Use Existing Barcode: {batchStatus[index].manufacturerBarcode}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* New batch indicator */}
                                            {batchStatus[index]?.exists === false && split.batchNumber && split.batchNumber !== 'TBD' && (
                                                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                                                    <p className="text-amber-800 font-medium">✨ New batch detected</p>
                                                    <p className="text-amber-600 text-[10px] mt-1">
                                                        Internal QR code will be generated automatically upon completion
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Barcode
                                        </label>
                                        <input
                                            type="text"
                                            value={(split as any).manufacturerBarcode || ''}
                                            onChange={(e) => updateSplit(index, 'manufacturerBarcode', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Scan/Type..."
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
                                                if (year === 1970) return '';
                                                return `${String(date.getMonth() + 1).padStart(2, '0')}/${year}`;
                                            })() : ''}
                                            onInput={(e) => {
                                                const inputType = (e.nativeEvent as any).inputType;
                                                if (inputType && inputType.startsWith('delete')) return;

                                                let value = e.currentTarget.value.replace(/[^0-9/]/g, '');

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
                                                }

                                                if (value.length === 2 && !value.includes('/')) {
                                                    const month = parseInt(value);
                                                    if (month > 12) value = '12';
                                                    value = value + '/';
                                                }
                                                else if (value.length > 2 && !value.includes('/')) {
                                                    const monthPart = value.substring(0, 2);
                                                    const month = parseInt(monthPart);
                                                    if (month > 12) {
                                                        value = '12/' + value.substring(2);
                                                    } else {
                                                        value = monthPart + '/' + value.substring(2);
                                                    }
                                                }

                                                if (value.includes('/')) {
                                                    const parts = value.split('/');
                                                    if (parts[1] && parts[1].length > 4) {
                                                        parts[1] = parts[1].substring(0, 4);
                                                        value = parts[0] + '/' + parts[1];
                                                    }
                                                }

                                                if (value.length > 7) {
                                                    value = value.substring(0, 7);
                                                }

                                                e.currentTarget.value = value;
                                            }}
                                            onBlur={(e) => {
                                                let value = e.currentTarget.value.trim();
                                                if (value && value.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/)) {
                                                    const [month, year] = value.split('/');
                                                    const paddedMonth = month.padStart(2, '0');
                                                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                                                    const fullDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;
                                                    e.currentTarget.value = `${paddedMonth}/${year}`;
                                                    updateSplit(index, 'expiryDate', fullDate);
                                                }
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
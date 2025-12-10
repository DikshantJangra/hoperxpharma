'use client';

import React, { useState } from 'react';
import { HiOutlineXMark, HiOutlineExclamationTriangle, HiOutlineCheckCircle } from 'react-icons/hi2';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface DiscrepancyHandlerProps {
    item: any;
    drugName: string;
    existingDiscrepancy?: any;
    onResolve: (resolution: any) => void;
    onClose: () => void;
}

export default function DiscrepancyHandler({ item, drugName, existingDiscrepancy, onResolve, onClose }: DiscrepancyHandlerProps) {
    const [reason, setReason] = useState<string>(existingDiscrepancy?.reason || 'SHORTAGE');
    const [resolution, setResolution] = useState<string>(existingDiscrepancy?.resolution || 'BACKORDER');
    const [description, setDescription] = useState(existingDiscrepancy?.description || '');
    const [rejectedQty, setRejectedQty] = useState(0); // This might need logic if we store rejectedQty
    const [debitNoteValue, setDebitNoteValue] = useState(existingDiscrepancy?.debitNoteValue || 0);

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    const discrepancyQty = Math.abs(item.orderedQty - item.receivedQty);
    const isShortage = item.receivedQty < item.orderedQty;
    const isOverage = item.receivedQty > item.orderedQty;

    const handleSubmit = () => {
        const discrepancyData = {
            grnItemId: item.id,
            reason,
            resolution,
            description,
            expectedQty: item.orderedQty,
            actualQty: item.receivedQty,
            discrepancyQty,
            debitNoteValue: debitNoteValue > 0 ? debitNoteValue : null
        };

        onResolve(discrepancyData);
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onKeyDown={handleKeyDown}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <HiOutlineExclamationTriangle className="h-6 w-6 text-amber-600" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Handle Discrepancy</h2>
                                <p className="text-sm text-gray-500 mt-1">{drugName}</p>
                            </div>
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
                <div className="p-6 space-y-4">
                    {/* Discrepancy Summary */}
                    <div className={`p-4 rounded-lg ${isShortage ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Ordered Quantity</p>
                                <p className="text-2xl font-bold text-gray-900">{item.orderedQty}</p>
                            </div>
                            <div className="text-gray-400">→</div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Received Quantity</p>
                                <p className={`text-2xl font-bold ${isShortage ? 'text-amber-600' : 'text-blue-600'}`}>
                                    {item.receivedQty}
                                </p>
                            </div>
                        </div>
                        <p className={`text-sm mt-2 ${isShortage ? 'text-amber-700' : 'text-blue-700'}`}>
                            {isShortage ? 'Shortage' : 'Overage'}: {discrepancyQty} units
                        </p>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason *
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="SHORTAGE">Shortage</option>
                            <option value="OVERAGE">Overage</option>
                            <option value="DAMAGED">Damaged</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="WRONG_ITEM">Wrong Item</option>
                            <option value="MISSING">Missing (Billed but not sent)</option>
                        </select>
                    </div>

                    {/* Resolution */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resolution *
                        </label>
                        <select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            {isShortage && (
                                <>
                                    <option value="BACKORDER">Backorder (Expect remaining items later)</option>
                                    <option value="CANCELLED">Cancelled (Supplier can't fulfill)</option>
                                    <option value="DEBIT_NOTE">Missing (Generate Debit Note)</option>
                                </>
                            )}
                            {isOverage && (
                                <option value="ACCEPTED">Accept Extra Items</option>
                            )}
                            {(reason === 'DAMAGED' || reason === 'EXPIRED') && (
                                <option value="DEBIT_NOTE">Reject & Generate Debit Note</option>
                            )}
                        </select>
                    </div>

                    {/* Rejected Quantity (for damaged/expired) */}
                    {(reason === 'DAMAGED' || reason === 'EXPIRED') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejected Quantity
                            </label>
                            <input
                                type="number"
                                value={rejectedQty}
                                onChange={(e) => {
                                    const qty = parseInt(e.target.value) || 0;
                                    setRejectedQty(qty);
                                    // Auto-calculate debit note value
                                    const unitPrice = parseFloat(item.unitPrice) || 0;
                                    setDebitNoteValue(qty * unitPrice);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                min="0"
                                max={item.receivedQty}
                            />
                        </div>
                    )}

                    {/* Debit Note Value */}
                    {resolution === 'DEBIT_NOTE' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Debit Note Value (₹)
                            </label>
                            <input
                                type="number"
                                value={debitNoteValue}
                                onChange={(e) => setDebitNoteValue(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                step="0.01"
                                min="0"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Auto-calculated based on unit price. Adjust if needed.
                            </p>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Provide details about this discrepancy..."
                        />
                    </div>

                    {/* Resolution Info */}
                    {resolution === 'BACKORDER' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-900">
                                <HiOutlineCheckCircle className="inline h-4 w-4 mr-1" />
                                PO will remain open for receiving remaining {discrepancyQty} units later.
                            </p>
                        </div>
                    )}

                    {resolution === 'DEBIT_NOTE' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-sm text-amber-900">
                                <HiOutlineExclamationTriangle className="inline h-4 w-4 mr-1" />
                                A debit note of ₹{Number(debitNoteValue).toFixed(2)} will be generated for supplier.
                            </p>
                        </div>
                    )}
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
                            onClick={handleSubmit}
                            disabled={!description}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Record Discrepancy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

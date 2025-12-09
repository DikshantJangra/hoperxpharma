'use client';

import React from 'react';
import { HiOutlineXMark, HiOutlineCheck, HiOutlineExclamationTriangle } from 'react-icons/hi2';

interface CompletionSummaryProps {
    grn: any;
    po: any;
    onConfirm: () => void;
    onCancel: () => void;
    saving: boolean;
}

export default function CompletionSummary({ grn, po, onConfirm, onCancel, saving }: CompletionSummaryProps) {
    // Calculate new PO status
    const calculatePOStatus = () => {
        let allReceived = true;
        for (const poItem of po.items) {
            const grnItem = grn.items.find((gi: any) => gi.poItemId === poItem.id);
            if (!grnItem) continue;

            const totalReceived = (poItem.receivedQty || 0) + grnItem.receivedQty + grnItem.freeQty;
            if (totalReceived < poItem.quantity) {
                allReceived = false;
                break;
            }
        }
        return allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    };

    const newPOStatus = calculatePOStatus();
    const totalItems = grn.items.reduce((sum: number, item: any) => sum + item.receivedQty + item.freeQty, 0);
    const discrepancyCount = grn.discrepancies?.length || 0;

    const formatCurrency = (amount: any) => {
        const num = Number(amount);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    // Use passed totals or default to 0
    const { subtotal, taxAmount, total } = (grn as any).totals || { subtotal: 0, taxAmount: 0, total: 0 };

    // Format expiry date to MM/YYYY format (no day)
    const formatExpiryDate = (dateString: string) => {
        if (!dateString) return 'N/A';

        // Parse the date
        const date = new Date(dateString);

        // Get month and year
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${month}/${year}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Complete Receiving</h2>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <HiOutlineXMark className="h-6 w-6" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Review the summary before completing this GRN
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Inventory Update Summary */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Inventory Update</h3>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <HiOutlineCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-emerald-900">
                                        {grn.items.length} batches will be added to inventory
                                    </p>
                                    <p className="text-sm text-emerald-700 mt-1">
                                        Total items: {totalItems} units
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 space-y-2">
                            {grn.items.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded">
                                    <div>
                                        <span className="font-medium">Batch {item.batchNumber}</span>
                                        <span className="text-gray-500 ml-2">
                                            Exp: {formatExpiryDate(item.expiryDate)}
                                        </span>
                                    </div>
                                    <div className="text-gray-900">
                                        {item.receivedQty + item.freeQty} units
                                        {item.freeQty > 0 && (
                                            <span className="text-emerald-600 ml-1">
                                                (+{item.freeQty} free)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PO Status Update */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Purchase Order Status</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Current Status</p>
                                    <p className="text-sm font-medium text-gray-900">{po.status}</p>
                                </div>
                                <div className="text-gray-400">→</div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">New Status</p>
                                    <p className="text-sm font-medium text-blue-900">{newPOStatus}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Impact */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Financial Impact</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">₹{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Tax Amount</span>
                                    <span className="font-medium">₹{formatCurrency(taxAmount)}</span>
                                </div>
                                <div className="border-t border-gray-300 pt-2 flex items-center justify-between">
                                    <span className="font-semibold text-gray-900">Total Payable</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        ₹{formatCurrency(total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Discrepancies Warning */}
                    {discrepancyCount > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <HiOutlineExclamationTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-900">
                                        {discrepancyCount} discrepancy(ies) detected
                                    </p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Please review discrepancies before completing
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={onCancel}
                            disabled={saving}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={saving}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <HiOutlineCheck className="h-5 w-5" />
                            {saving ? 'Completing...' : 'Confirm & Complete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { LiaBoxOpenSolid, LiaCheckCircleSolid } from "react-icons/lia";

// Define enums to match backend
export enum ReturnIntent {
    UNOPENED_UNUSED = 'UNOPENED_UNUSED',
    OPENED_UNUSED = 'OPENED_UNUSED',
    PARTIAL_USED = 'PARTIAL_USED',
    DEFECTIVE_DAMAGED = 'DEFECTIVE_DAMAGED',
    EXPIRED_SOLD = 'EXPIRED_SOLD',
    WRONG_ITEM_SOLD = 'WRONG_ITEM_SOLD',
    CUSTOMER_MIND_CHANGE = 'CUSTOMER_MIND_CHANGE'
}

interface ReturnFormProps {
    saleId: string | undefined; // Passed from parent context
    invoiceNumber?: string; // Invoice number for display
    saleItems: any[]; // List of items in the original sale
    onSubmit: (returnData: any) => void;
    onCancel: () => void;
    isOverlay?: boolean;
    isProcessing?: boolean;
    customerName?: string; // To check if walk-in customer
}

export default function ReturnForm({ saleId, invoiceNumber, saleItems, onSubmit, onCancel, isOverlay = false, isProcessing = false, customerName }: ReturnFormProps) {
    const [returnItems, setReturnItems] = useState<any[]>([]);
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundType, setRefundType] = useState('CASH');
    const [refundPercentage, setRefundPercentage] = useState(100);

    // Check if walk-in customer
    const isWalkInCustomer = customerName === 'Walk-in Customer' || !customerName;

    // Initialize returnItems from saleItems on mount (Auto-pickup items)
    useEffect(() => {
        // Only initialize if returnItems is empty (first mount)
        if (saleItems && saleItems.length > 0 && returnItems.length === 0) {
            setReturnItems(saleItems.map(si => {
                const lineTotal = Number(si.lineTotal || si.total || 0);
                const originalQuantity = Number(si.quantity || si.qty || 0);
                const returnedQuantity = Number(si.returnedQty || 0);
                const remainingQuantity = Math.max(0, originalQuantity - returnedQuantity);

                // Calculate unit price, but CAP at MRP to prevent over-refunds from legacy tax bugs
                let unitPrice = originalQuantity > 0 ? lineTotal / originalQuantity : 0;
                if (si.mrp && Number(si.mrp) > 0) {
                    unitPrice = Math.min(unitPrice, Number(si.mrp));
                }

                // Ensure calculatedRefund matches this unit price logic
                const calculatedMax = unitPrice * remainingQuantity;

                return {
                    saleItemId: si.id || si.saleItemId,
                    name: si.drug?.name || si.name || 'Unknown Item',
                    batch: si.batch || 'N/A',
                    originalQuantity,
                    returnedQuantity,
                    remainingQuantity,
                    quantity: 0,
                    intent: ReturnIntent.UNOPENED_UNUSED,
                    condition: 'Sealed',
                    isResellable: true,
                    reason: '',
                    lineTotal,
                    unitPrice,
                    calculatedRefund: 0,
                    manualRefundAmount: undefined,
                    selected: false
                };
            }));
        }
    }, []); // Empty dependency array - only run once on mount

    const updateReturnItem = (index: number, field: string, value: any) => {
        const newItems = [...returnItems];
        newItems[index] = { ...newItems[index], [field]: value };

        // If quantity changes, recalculate the base refund
        if (field === 'quantity') {
            const qty = Math.min(Math.max(0, value || 0), newItems[index].originalQuantity);
            newItems[index].quantity = qty;
            newItems[index].selected = qty > 0;

            // Calculate the maximum refundable amount for this quantity
            const calculatedMax = newItems[index].unitPrice * qty;
            newItems[index].calculatedRefund = calculatedMax;

            // If there's no manual override, set manual amount to calculated
            if (newItems[index].manualRefundAmount === undefined || qty === 0) {
                newItems[index].manualRefundAmount = qty > 0 ? calculatedMax : undefined;
            } else {
                // If manual amount exists, cap it at new max
                newItems[index].manualRefundAmount = Math.min(newItems[index].manualRefundAmount, calculatedMax);
            }
        }

        // If manual refund is being set, validate and cap it
        if (field === 'manualRefundAmount') {
            const maxRefund = newItems[index].calculatedRefund || 0;
            newItems[index].manualRefundAmount = Math.min(Math.max(0, value || 0), maxRefund);
        }

        // Auto-set condition based on intent for convenience
        if (field === 'intent') {
            if (value === ReturnIntent.UNOPENED_UNUSED) {
                newItems[index].condition = 'Sealed';
            } else if (value === ReturnIntent.OPENED_UNUSED || value === ReturnIntent.PARTIAL_USED) {
                newItems[index].condition = 'Opened';
            } else if (value === ReturnIntent.DEFECTIVE_DAMAGED) {
                newItems[index].condition = 'Damaged';
            }
        }

        setReturnItems(newItems);
    };

    const toggleSelectItem = (index: number) => {
        const newItems = [...returnItems];
        const isNowSelected = !newItems[index].selected;
        newItems[index].selected = isNowSelected;

        if (isNowSelected) {
            // When selecting, set to full remaining quantity and calculate refund
            const qty = newItems[index].remainingQuantity;
            newItems[index].quantity = qty;
            const calculatedMax = newItems[index].unitPrice * qty;
            newItems[index].calculatedRefund = calculatedMax;
            newItems[index].manualRefundAmount = calculatedMax;
        } else {
            // When deselecting, reset everything
            newItems[index].quantity = 0;
            newItems[index].calculatedRefund = 0;
            newItems[index].manualRefundAmount = undefined;
        }

        setReturnItems(newItems);
    };

    // Calculate Refund Preview - simplified to use manual amounts
    useEffect(() => {
        let subtotal = 0;
        returnItems.forEach(item => {
            if (item.selected && item.quantity > 0) {
                // Use manualRefundAmount if set, otherwise use calculatedRefund
                const itemRefund = item.manualRefundAmount !== undefined ? item.manualRefundAmount : (item.calculatedRefund || 0);
                subtotal += itemRefund;
            }
        });

        // Apply percentage adjustment to the subtotal
        const adjustedTotal = (subtotal * refundPercentage) / 100;
        setRefundAmount(adjustedTotal);
    }, [returnItems, refundPercentage]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedItems = returnItems.filter(item => item.selected && item.quantity > 0);

        if (selectedItems.length === 0) {
            return;
        }

        onSubmit({
            originalSaleId: saleId,
            refundType,
            items: selectedItems.map(item => ({
                saleItemId: item.saleItemId,
                quantity: item.quantity,
                intent: item.intent,
                condition: item.condition,
                isResellable: item.isResellable || false,
                reason: item.reason || 'Customer Return',
            })),
            refundAmount
        });

        // Don't reset form - parent will close modal on success
    };

    return (
        <div className={isOverlay
            ? "absolute inset-0 z-[60] bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
            : "fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"}
        >
            <div className={isOverlay
                ? "flex-1 flex flex-col overflow-hidden"
                : "bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Initiate Return</h2>
                        <p className="text-sm text-gray-500">Invoice: {invoiceNumber || saleId || 'Unknown'}</p>
                    </div>
                    <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Items List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900">Items to Return</h3>

                            <div className="space-y-3">
                                {returnItems.map((item, index) => (
                                    <div key={index} className={`p-4 rounded-lg border transition-colors ${item.selected ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={item.selected}
                                                    onChange={() => toggleSelectItem(index)}
                                                    disabled={item.remainingQuantity <= 0}
                                                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-sm font-semibold truncate ${item.remainingQuantity <= 0 ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                            {item.name}
                                                        </p>
                                                        {item.returnedQuantity > 0 && (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${item.remainingQuantity <= 0
                                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                                                }`}>
                                                                {item.remainingQuantity <= 0 ? 'RETURNED' : 'PARTIALLY RETURNED'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Batch: {item.batch} • Sold: {item.originalQuantity} units
                                                        {item.returnedQuantity > 0 && ` • Returned: ${item.returnedQuantity}`}
                                                        {item.remainingQuantity > 0 && ` • Available: ${item.remainingQuantity}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Resellable Toggle - Top Right */}
                                            {item.selected && (
                                                <div className="flex items-center gap-2 ml-4">
                                                    <span className="text-xs font-medium text-slate-600">Resellable:</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={item.isResellable || false}
                                                        onChange={(e) => updateReturnItem(index, 'isResellable', e.target.checked)}
                                                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {item.selected && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                                    {/* Quantity */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Return Qty</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.remainingQuantity}
                                                            value={item.quantity}
                                                            onChange={(e) => updateReturnItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                            className="w-full text-sm px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm font-semibold"
                                                            required
                                                        />
                                                    </div>

                                                    {/* Intent */}
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Return Intent</label>
                                                        <select
                                                            value={item.intent}
                                                            onChange={(e) => updateReturnItem(index, 'intent', e.target.value)}
                                                            className="w-full text-sm px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm font-medium"
                                                        >
                                                            <option value={ReturnIntent.UNOPENED_UNUSED}>Unopened / Unused</option>
                                                            <option value={ReturnIntent.OPENED_UNUSED}>Opened / Unused</option>
                                                            <option value={ReturnIntent.PARTIAL_USED}>Partially Used</option>
                                                            <option value={ReturnIntent.DEFECTIVE_DAMAGED}>Defective / Damaged</option>
                                                            <option value={ReturnIntent.EXPIRED_SOLD}>Expired</option>
                                                            <option value={ReturnIntent.WRONG_ITEM_SOLD}>Wrong Item Sold</option>
                                                            <option value={ReturnIntent.CUSTOMER_MIND_CHANGE}>Customer Mind Change</option>
                                                        </select>
                                                    </div>

                                                    {/* Condition */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Condition</label>
                                                        <select
                                                            value={item.condition}
                                                            onChange={(e) => updateReturnItem(index, 'condition', e.target.value)}
                                                            className="w-full text-sm px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm font-medium"
                                                        >
                                                            <option value="Sealed">Sealed</option>
                                                            <option value="Opened">Opened</option>
                                                            <option value="Damaged">Damaged</option>
                                                        </select>
                                                    </div>

                                                    {/* Refund Amount */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-emerald-700 mb-1.5">Refund ₹</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.calculatedRefund}
                                                            step="0.01"
                                                            value={item.quantity > 0 ? (item.manualRefundAmount || item.calculatedRefund || 0) : ''}
                                                            onChange={(e) => updateReturnItem(index, 'manualRefundAmount', parseFloat(e.target.value) || 0)}
                                                            className="w-full text-sm px-3 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 shadow-sm font-bold text-emerald-900"
                                                            placeholder={item.quantity > 0 ? `${(item.calculatedRefund || 0).toFixed(2)}` : '0.00'}
                                                            disabled={item.quantity === 0}
                                                        />
                                                        <p className="text-[10px] text-slate-500 mt-1 font-medium">Max: ₹{(item.calculatedRefund || 0).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Refund Preview Section */}
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="text-sm font-semibold text-emerald-900">Refund Summary</h4>
                                    <p className="text-xs text-emerald-700">Estimated refund based on return policy</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-bold text-emerald-600">
                                        ₹{refundAmount.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-emerald-800">Actual Refund Amount</span>
                                </div>
                            </div>

                            {/* Percentage Adjustment */}
                            <div className="pt-3 border-t border-emerald-200">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium text-emerald-900">Refund Percentage</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={refundPercentage}
                                            onChange={(e) => setRefundPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                            className="w-16 text-sm px-2 py-1 border border-emerald-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-center font-semibold"
                                        />
                                        <span className="text-sm font-semibold text-emerald-900">%</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={refundPercentage}
                                    onChange={(e) => setRefundPercentage(parseInt(e.target.value))}
                                    className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                />
                                <div className="flex justify-between text-[10px] text-emerald-700 mt-1">
                                    <span>0%</span>
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                                {refundPercentage < 100 && (
                                    <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center gap-1.5">
                                        <FiAlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>Applying {100 - refundPercentage}% restocking/processing fee</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Refund Method Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Refund Method</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`relative border rounded-lg p-3 cursor-pointer transition-all ${refundType === 'CASH' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="refundType"
                                        value="CASH"
                                        checked={refundType === 'CASH'}
                                        onChange={(e) => setRefundType(e.target.value)}
                                        className="sr-only"
                                    />
                                    {refundType === 'CASH' && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                                            <FiCheck className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    <div className="text-sm font-medium text-gray-900">Cash Refund</div>
                                    <div className="text-xs text-gray-500 mt-0.5">Return cash to customer</div>
                                </label>

                                <label className={`relative border rounded-lg p-3 transition-all ${isWalkInCustomer
                                    ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                                    : refundType === 'STORE_CREDIT'
                                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 cursor-pointer'
                                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="refundType"
                                        value="STORE_CREDIT"
                                        checked={refundType === 'STORE_CREDIT'}
                                        onChange={(e) => !isWalkInCustomer && setRefundType(e.target.value)}
                                        disabled={isWalkInCustomer}
                                        className="sr-only"
                                    />
                                    {refundType === 'STORE_CREDIT' && !isWalkInCustomer && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                                            <FiCheck className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    <div className="text-sm font-medium text-gray-900">Store Credit</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {isWalkInCustomer ? 'Not available for walk-in' : 'Issue Credit Note'}
                                    </div>
                                </label>
                            </div>
                            {refundType === 'STORE_CREDIT' && !isWalkInCustomer && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-800">
                                        <strong>Note:</strong> A credit note will be issued to the customer for ₹{refundAmount.toFixed(2)}. Valid for 6 months.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Inventory Impact Summary */}
                        {returnItems.filter(i => i.selected && i.quantity > 0).length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-slate-900 mb-3">Inventory Impact</h4>
                                <div className="space-y-2">
                                    {returnItems.filter(i => i.selected && i.quantity > 0).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-700">{item.name}</span>
                                                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-medium">
                                                    +{item.quantity}
                                                </span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.isResellable
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {item.isResellable ? 'RESTOCK' : 'QUARANTINE'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <p className="text-[10px] text-slate-600">
                                        • Resellable items will be added back to available stock<br />
                                        • Non-resellable items will be moved to quarantine
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isProcessing}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={returnItems.filter(i => i.selected).length === 0 || isProcessing}
                            className="px-8 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                        >
                            {isProcessing && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {isProcessing ? 'Processing...' : 'Process Refund'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

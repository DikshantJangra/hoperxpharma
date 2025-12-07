'use client';

import React, { useState } from 'react';
import { HiOutlineCheck, HiOutlineExclamationCircle, HiOutlineArrowUp, HiOutlineCog, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import BatchSplitModal from './BatchSplitModal';
import DiscrepancyHandler from './DiscrepancyHandler';

interface ReceivingTableProps {
    items: any[];
    poItems: any[];
    onItemUpdate: (itemId: string, updates: any) => void;
    onBatchSplit: (itemId: string, splitData: any[]) => void;
    onDiscrepancy: (itemId: string, discrepancyData: any) => void;
}

export default function ReceivingTable({ items, poItems, onItemUpdate, onBatchSplit, onDiscrepancy }: ReceivingTableProps) {
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [splitItem, setSplitItem] = useState<any | null>(null);
    const [discrepancyItem, setDiscrepancyItem] = useState<any | null>(null);

    const getStatus = (item: any) => {
        if (item.receivedQty === item.orderedQty) {
            return { label: 'Matched', color: 'text-emerald-600', icon: HiOutlineCheck };
        } else if (item.receivedQty < item.orderedQty) {
            return { label: 'Short', color: 'text-amber-600', icon: HiOutlineExclamationCircle };
        } else {
            return { label: 'Over', color: 'text-blue-600', icon: HiOutlineArrowUp };
        }
    };

    const getDrugName = (drugId: string) => {
        const poItem = poItems.find(pi => pi.drugId === drugId);
        if (!poItem || !poItem.drug) return 'Unknown';
        return `${poItem.drug.name}${poItem.drug.strength ? ` ${poItem.drug.strength}` : ''}`;
    };

    const handleFieldUpdate = (itemId: string, field: string, value: any) => {
        const updates: any = {};

        // For numeric fields, parse the value
        if (['receivedQty', 'freeQty', 'unitPrice', 'discountPercent', 'gstPercent', 'mrp'].includes(field)) {
            if (value === '' || value === null) {
                updates[field] = field === 'mrp' ? null : 0;
            } else {
                const parsedValue = field.includes('Qty') ? parseInt(value) : parseFloat(value);
                updates[field] = isNaN(parsedValue) ? 0 : parsedValue;
            }
        } else {
            // For text fields like batchNumber, expiryDate, discountType - just pass the value
            updates[field] = value;
        }

        onItemUpdate(itemId, updates);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Item
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Ordered
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Received
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Free
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Batch No
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Expiry (MM/YYYY)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                                MRP
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Purchase Rate
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Disc %
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Disc Type
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.map((item) => {
                            const status = getStatus(item);
                            const StatusIcon = status.icon;

                            return (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-gray-900">
                                            {getDrugName(item.drugId)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="text-sm text-gray-900">{item.orderedQty || 0}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={(item.receivedQty ?? 0).toString()}
                                            onChange={(e) => handleFieldUpdate(item.id, 'receivedQty', e.target.value)}
                                            onFocus={(e) => {
                                                // Select all on focus if value is 0
                                                if (e.target.value === '0') {
                                                    e.target.select();
                                                }
                                            }}
                                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            min="0"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={(item.freeQty ?? 0).toString()}
                                            onChange={(e) => handleFieldUpdate(item.id, 'freeQty', e.target.value)}
                                            onFocus={(e) => {
                                                // Select all on focus if value is 0
                                                if (e.target.value === '0') {
                                                    e.target.select();
                                                }
                                            }}
                                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            min="0"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={item.batchNumber || ''}
                                            onChange={(e) => handleFieldUpdate(item.id, 'batchNumber', e.target.value)}
                                            onBlur={(e) => {
                                                // Add red border if empty
                                                if (!e.target.value || e.target.value.trim() === '') {
                                                    e.target.classList.add('border-red-500');
                                                } else {
                                                    e.target.classList.remove('border-red-500');
                                                }
                                            }}
                                            className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="Required"
                                            required
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="month"
                                            value={item.expiryDate ? new Date(item.expiryDate).toISOString().substring(0, 7) : ''}
                                            onChange={(e) => {
                                                // Convert YYYY-MM to last day of month
                                                if (e.target.value) {
                                                    const [year, month] = e.target.value.split('-');
                                                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                                                    const fullDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
                                                    handleFieldUpdate(item.id, 'expiryDate', fullDate);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                // Validate expiry date
                                                if (!e.target.value) {
                                                    e.target.classList.add('border-red-500');
                                                } else {
                                                    const [year, month] = e.target.value.split('-');
                                                    const expiryDate = new Date(parseInt(year), parseInt(month) - 1);
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    if (expiryDate < today) {
                                                        e.target.classList.add('border-red-500');
                                                    } else {
                                                        e.target.classList.remove('border-red-500');
                                                    }
                                                }
                                            }}
                                            className="w-36 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={item.mrp || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Prevent setting MRP to 0
                                                if (value === '0' || value === '0.00' || value === '0.0') {
                                                    return;
                                                }
                                                handleFieldUpdate(item.id, 'mrp', value);
                                            }}
                                            onFocus={(e) => {
                                                // Select all on focus if value is 0
                                                if (e.target.value === '0' || e.target.value === '0.00') {
                                                    e.target.select();
                                                }
                                            }}
                                            onBlur={(e) => {
                                                // If MRP is empty or 0 on blur, show warning
                                                if (!e.target.value || parseFloat(e.target.value) === 0) {
                                                    e.target.classList.add('border-red-500');
                                                } else {
                                                    e.target.classList.remove('border-red-500');
                                                }
                                            }}
                                            className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                            required
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={item.unitPrice || ''}
                                            onChange={(e) => handleFieldUpdate(item.id, 'unitPrice', e.target.value)}
                                            onFocus={(e) => {
                                                // Select all on focus
                                                e.target.select();
                                            }}
                                            className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={item.discountPercent || ''}
                                            onChange={(e) => handleFieldUpdate(item.id, 'discountPercent', e.target.value)}
                                            onFocus={(e) => {
                                                e.target.select();
                                            }}
                                            className="w-20 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={item.discountType || 'BEFORE_GST'}
                                            onChange={(e) => handleFieldUpdate(item.id, 'discountType', e.target.value)}
                                            className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                        >
                                            <option value="BEFORE_GST">Before GST</option>
                                            <option value="AFTER_GST">After GST</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className={`flex items-center justify-center gap-1 ${status.color}`}>
                                            <StatusIcon className="h-4 w-4" />
                                            <span className="text-sm font-medium">{status.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setSplitItem(item)}
                                                className="text-gray-600 hover:text-gray-900"
                                                title="Split Batch"
                                            >
                                                <HiOutlineCog className="h-5 w-5" />
                                            </button>
                                            {(item.receivedQty !== item.orderedQty) && (
                                                <button
                                                    onClick={() => setDiscrepancyItem(item)}
                                                    className="text-amber-600 hover:text-amber-900"
                                                    title="Handle Discrepancy"
                                                >
                                                    <HiOutlineExclamationTriangle className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {splitItem && (
                <BatchSplitModal
                    item={splitItem}
                    drugName={getDrugName(splitItem.drugId)}
                    onSplit={(splitData: any) => {
                        onBatchSplit(splitItem.id, splitData);
                        setSplitItem(null);
                    }}
                    onClose={() => setSplitItem(null)}
                />
            )}

            {discrepancyItem && (
                <DiscrepancyHandler
                    item={discrepancyItem}
                    drugName={getDrugName(discrepancyItem.drugId)}
                    onResolve={(discrepancyData) => {
                        onDiscrepancy(discrepancyItem.id, discrepancyData);
                        setDiscrepancyItem(null);
                    }}
                    onClose={() => setDiscrepancyItem(null)}
                />
            )}
        </div>
    );
}

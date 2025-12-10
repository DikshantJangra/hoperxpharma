'use client';

import React, { useState } from 'react';
import { HiOutlineCheck, HiOutlineExclamationCircle, HiOutlineArrowUp, HiOutlineCog, HiOutlineExclamationTriangle, HiOutlineTrash } from 'react-icons/hi2';
import BatchSplitModal from './BatchSplitModal';
import DiscrepancyHandler from './DiscrepancyHandler';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface ReceivingTableProps {
    items: any[];
    poItems: any[];
    onItemUpdate: (itemId: string, updates: any) => void;
    onBatchSplit: (itemId: string, splitData: any[]) => void;
    onDiscrepancy: (itemId: string, discrepancyData: any) => void;
    onDeleteBatch: (itemId: string) => void;
}

export default function ReceivingTable({ items, poItems, onItemUpdate, onBatchSplit, onDiscrepancy, onDeleteBatch }: ReceivingTableProps) {
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [splitItem, setSplitItem] = useState<any | null>(null);
    const [discrepancyItem, setDiscrepancyItem] = useState<any | null>(null);

    const { handleKeyDown } = useKeyboardNavigation();

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
        // Just pass the value directly to parent without conversion
        // The parent will handle the conversion when sending to API
        const updates: any = {
            [field]: value
        };

        onItemUpdate(itemId, updates);
    };

    return (
        <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            onKeyDown={handleKeyDown}
            data-focus-trap="true"
        >
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
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                                GST %
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Location
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
                        {items.filter(item => !item.parentItemId).map((item) => {
                            const status = getStatus(item);
                            const StatusIcon = status.icon;
                            const isParent = item.isSplit;
                            const hasChildren = item.children && item.children.length > 0;

                            return (
                                <React.Fragment key={item.id}>
                                    {/* Parent Row */}
                                    <tr className={`${isParent ? 'bg-blue-50 font-medium' : 'hover:bg-gray-50'}`}>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">
                                                {isParent && '📦 '}
                                                {getDrugName(item.drugId)}
                                                {isParent && <span className="ml-2 text-xs text-blue-600">(Split into {item.children?.length || 0} batches)</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="text-sm text-gray-900">{item.orderedQty || 0}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={(item.receivedQty ?? 0).toString()}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '0' : parseFloat(e.target.value).toString();
                                                    handleFieldUpdate(item.id, 'receivedQty', val);
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                min="0"
                                                disabled={isParent}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={(item.freeQty ?? 0).toString()}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '0' : parseFloat(e.target.value).toString();
                                                    handleFieldUpdate(item.id, 'freeQty', val);
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                min="0"
                                                disabled={isParent}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={item.batchNumber || ''}
                                                onChange={(e) => handleFieldUpdate(item.id, 'batchNumber', e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                                placeholder="Batch No"
                                            // Batch number editing enabled for parent to propagate
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                key={`expiry-${item.id}-${item.expiryDate}`}
                                                defaultValue={item.expiryDate ? (() => {
                                                    const date = new Date(item.expiryDate);
                                                    if (date.getFullYear() === 1970) return '';
                                                    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                                                })() : ''}
                                                onInput={(e) => {
                                                    const inputType = (e.nativeEvent as any).inputType;
                                                    // Prevent auto-fill on backspaces
                                                    if (inputType && inputType.startsWith('delete')) {
                                                        return;
                                                    }

                                                    let value = e.currentTarget.value.replace(/[^0-9/]/g, '');

                                                    // Case 1: Exactly 2 digits, no slash -> Default 20 logic
                                                    if (value.length === 2 && !value.includes('/')) {
                                                        value = value + '/20';
                                                    }
                                                    // Case 2: More than 2 digits, no slash -> Insert slash
                                                    else if (value.length > 2 && !value.includes('/')) {
                                                        value = value.substring(0, 2) + '/' + value.substring(2);
                                                    }

                                                    // Validate month (can't be > 12)
                                                    if (value.length >= 2 && !value.includes('/')) {
                                                        const month = parseInt(value.substring(0, 2));
                                                        if (month > 12) {
                                                            value = '12' + value.substring(2);
                                                        }
                                                    }

                                                    // Limit to MM/YYYY format
                                                    if (value.length > 7) {
                                                        value = value.substring(0, 7);
                                                    }

                                                    e.currentTarget.value = value;
                                                }}
                                                onBlur={(e) => {
                                                    let value = e.currentTarget.value.trim();

                                                    // Auto-expand YY to 20YY
                                                    // This allows users to type "12/25" for "12/2025"
                                                    if (value && value.match(/^(0?[1-9]|1[0-2])\/(\d{2})$/)) {
                                                        const parts = value.split('/');
                                                        value = `${parts[0]}/20${parts[1]}`;
                                                    }

                                                    // Validate and save only on blur
                                                    if (value && value.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/)) {
                                                        const [month, year] = value.split('/');
                                                        const paddedMonth = month.padStart(2, '0');
                                                        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                                                        const fullDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

                                                        // Update display to padded format
                                                        e.currentTarget.value = `${paddedMonth}/${year}`;

                                                        handleFieldUpdate(item.id, 'expiryDate', fullDate);
                                                    }
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                                placeholder="MM/YYYY"
                                                maxLength={7}
                                            // Expiry editing enabled for parent to propagate
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.mrp || 0}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '0' : parseFloat(e.target.value).toString();
                                                    handleFieldUpdate(item.id, 'mrp', val);
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                            // MRP editing enabled for parent to propagate
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.unitPrice || 0}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '0' : parseFloat(e.target.value).toString();
                                                    handleFieldUpdate(item.id, 'unitPrice', val);
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                            // Unit Price editing enabled for parent to propagate
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.discountPercent !== undefined && item.discountPercent !== null ? item.discountPercent : 0}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '0' : parseFloat(e.target.value).toString();
                                                    handleFieldUpdate(item.id, 'discountPercent', val);
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                className="w-20 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                placeholder="0"
                                            // Discount editing enabled for parent to propagate
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={item.discountType || 'BEFORE_GST'}
                                                onChange={(e) => handleFieldUpdate(item.id, 'discountType', e.target.value)}
                                                className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                            // Discount Type editing enabled for parent to propagate
                                            >
                                                <option value="BEFORE_GST">Before GST</option>
                                                <option value="AFTER_GST">After GST</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={item.gstPercent !== undefined && item.gstPercent !== null ? item.gstPercent : 5}
                                                onChange={(e) => handleFieldUpdate(item.id, 'gstPercent', parseFloat(e.target.value))}
                                                disabled={isParent} // Disable GST editing for parent items that are split
                                                className={`w-20 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm ${isParent ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                            >
                                                {[0, 5, 12, 18, 28].map((rate) => (
                                                    <option key={rate} value={rate}>
                                                        {rate}%
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={item.location || ''}
                                                onChange={(e) => handleFieldUpdate(item.id, 'location', e.target.value)}
                                                className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                                placeholder="e.g., Rack A-1"
                                            // Location editing enabled for parent to propagate
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className={`flex items-center justify-center gap-1 ${status.color}`}>
                                                <StatusIcon className="h-4 w-4" />
                                                <span className="text-sm font-medium">{status.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {!isParent && (
                                                    <button
                                                        onClick={() => setSplitItem(item)}
                                                        className="text-gray-600 hover:text-gray-900"
                                                        title="Split Batch"
                                                    >
                                                        <HiOutlineCog className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {isParent && (
                                                    <button
                                                        onClick={() => {
                                                            // Load children into split modal for editing
                                                            const itemWithChildren = {
                                                                ...item,
                                                                // Use children data for editing
                                                                _isEditMode: true
                                                            };
                                                            setSplitItem(itemWithChildren);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Edit Split Batches"
                                                    >
                                                        <HiOutlineCog className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {(item.receivedQty !== item.orderedQty) && !isParent && (
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

                                    {/* Child Rows (Split Batches) */}
                                    {hasChildren && item.children.map((child: any) => {
                                        const childStatus = getStatus(child);
                                        const ChildStatusIcon = childStatus.icon;

                                        return (
                                            <tr key={child.id} className="bg-emerald-50 border-l-4 border-emerald-500">
                                                <td className="px-4 py-3 pl-12">
                                                    <div className="text-sm text-gray-700">
                                                        ↳ {getDrugName(child.drugId)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="text-sm text-gray-700">{child.orderedQty || 0}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={(child.receivedQty ?? 0).toString()}
                                                        onChange={(e) => handleFieldUpdate(child.id, 'receivedQty', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        min="0"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={(child.freeQty ?? 0).toString()}
                                                        onChange={(e) => handleFieldUpdate(child.id, 'freeQty', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        min="0"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={child.batchNumber || ''}
                                                        onChange={(e) => handleFieldUpdate(child.id, 'batchNumber', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                                        placeholder="Batch #"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        key={`expiry-${child.id}-${child.expiryDate}`}
                                                        defaultValue={child.expiryDate ? (() => {
                                                            const date = new Date(child.expiryDate);
                                                            if (date.getFullYear() === 1970) return '';
                                                            return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                                                        })() : ''}
                                                        onInput={(e) => {
                                                            const inputType = (e.nativeEvent as any).inputType;
                                                            // Prevent auto-fill on backspaces
                                                            if (inputType && inputType.startsWith('delete')) {
                                                                return;
                                                            }

                                                            let value = e.currentTarget.value.replace(/[^0-9/]/g, '');
                                                            // Case 1: Exactly 2 digits, no slash -> Default 20 logic
                                                            if (value.length === 2 && !value.includes('/')) {
                                                                value = value + '/20';
                                                            }
                                                            // Case 2: More than 2 digits, no slash -> Insert slash
                                                            else if (value.length > 2 && !value.includes('/')) {
                                                                value = value.substring(0, 2) + '/' + value.substring(2);
                                                            }

                                                            if (value.length >= 2 && !value.includes('/')) {
                                                                const month = parseInt(value.substring(0, 2));
                                                                if (month > 12) {
                                                                    value = '12' + value.substring(2);
                                                                }
                                                            }
                                                            if (value.length > 7) {
                                                                value = value.substring(0, 7);
                                                            }
                                                            e.currentTarget.value = value;
                                                        }}
                                                        onBlur={(e) => {
                                                            let value = e.currentTarget.value.trim();

                                                            // Auto-expand YY to 20YY
                                                            if (value && value.match(/^(0?[1-9]|1[0-2])\/(\d{2})$/)) {
                                                                const parts = value.split('/');
                                                                value = `${parts[0]}/20${parts[1]}`;
                                                            }

                                                            if (value && value.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/)) {
                                                                const [month, year] = value.split('/');
                                                                const paddedMonth = month.padStart(2, '0');
                                                                const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                                                                const fullDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;
                                                                e.currentTarget.value = `${paddedMonth}/${year}`;
                                                                handleFieldUpdate(child.id, 'expiryDate', fullDate);
                                                            }
                                                        }}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                                        placeholder="MM/YYYY"
                                                        maxLength={7}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={child.mrp || 0}
                                                        onChange={(e) => handleFieldUpdate(child.id, 'mrp', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            e.target.value = val.toString();
                                                            handleFieldUpdate(child.id, 'mrp', val.toString());
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
                                                        value={child.unitPrice || 0}
                                                        onChange={(e) => handleFieldUpdate(child.id, 'unitPrice', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            e.target.value = val.toString();
                                                            handleFieldUpdate(child.id, 'unitPrice', val.toString());
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
                                                        value={child.discountPercent !== undefined && child.discountPercent !== null ? child.discountPercent : 0}
                                                        onChange={(e) => handleFieldUpdate(child.id, 'discountPercent', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            e.target.value = val.toString();
                                                            handleFieldUpdate(child.id, 'discountPercent', val.toString());
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
                                                        value={child.discountType || 'BEFORE_GST'}
                                                        onChange={(e) => handleFieldUpdate(child.id, 'discountType', e.target.value)}
                                                        className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                                    >
                                                        <option value="BEFORE_GST">Before GST</option>
                                                        <option value="AFTER_GST">After GST</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={child.gstPercent !== undefined && child.gstPercent !== null ? child.gstPercent : 5}
                                                        onChange={(e) => handleFieldUpdate(child.id, 'gstPercent', parseFloat(e.target.value))}
                                                        className="w-20 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                                    >
                                                        {[0, 5, 12, 18, 28].map((rate) => (
                                                            <option key={rate} value={rate}>
                                                                {rate}%
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={child.location || ''}
                                                        onChange={(e) => handleFieldUpdate(child.id, 'location', e.target.value)}
                                                        className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                                        placeholder="e.g., Rack A-1"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className={`flex items-center justify-center gap-1 ${childStatus.color}`}>
                                                        <ChildStatusIcon className="h-4 w-4" />
                                                        <span className="text-sm font-medium">{childStatus.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this split batch?')) {
                                                                    onDeleteBatch(child.id);
                                                                }
                                                            }}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Delete Batch"
                                                        >
                                                            <HiOutlineTrash className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {splitItem && (
                <BatchSplitModal
                    item={splitItem}
                    drugName={getDrugName(splitItem.drugId)}
                    onSplit={async (splitData: any) => {
                        await onBatchSplit(splitItem.id, splitData);
                        // Small delay to ensure GRN refresh completes before closing modal
                        setTimeout(() => {
                            setSplitItem(null);
                        }, 500);
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


import React, { useState } from 'react';
import { HiOutlineCheck, HiOutlineExclamationCircle, HiOutlineArrowUp, HiOutlineCog, HiOutlineExclamationTriangle, HiOutlineTrash, HiOutlineQrCode } from 'react-icons/hi2';
import BatchSplitModal from './BatchSplitModal';
import DiscrepancyHandler from './DiscrepancyHandler';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { scanApi } from '@/lib/api/scan';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const BarcodeScannerModal = dynamic(() => import('@/components/pos/BarcodeScannerModal'), { ssr: false });

interface ReceivingTableProps {
    items: any[];
    poItems: any[];
    discrepancies?: any[];
    onItemUpdate: (itemId: string, updates: any) => void;
    onBatchSplit: (itemId: string, splitData: any[]) => void;
    onDiscrepancy: (itemId: string, discrepancyData: any) => void;
    onDeleteBatch: (itemId: string) => void;
}

export default function ReceivingTable({ items, poItems, discrepancies = [], onItemUpdate, onBatchSplit, onDiscrepancy, onDeleteBatch }: ReceivingTableProps) {
    // ... existing state ...

    // ... existing functions ...


    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [splitItem, setSplitItem] = useState<any | null>(null);
    const [discrepancyItem, setDiscrepancyItem] = useState<any | null>(null);
    const [scanningItem, setScanningItem] = useState<string | null>(null);
    // Store batch history: drugId -> [{batchNumber, barcode}]
    const [batchHistory, setBatchHistory] = useState<Record<string, Array<{ batchNumber: string; barcode: string }>>>({});

    const { handleKeyDown } = useKeyboardNavigation();

    // Fetch batch history on mount
    React.useEffect(() => {
        const loadHistory = async () => {
            const drugIds = Array.from(new Set(items.map(i => i.drugId)));
            if (drugIds.length === 0) return;

            try {
                // Use fetch directly or valid API client
                // Assuming we have an inventoryApi or similar
                const token = localStorage.getItem('accessToken');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/inventory/batches/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ drugIds })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        setBatchHistory(result.data);
                    }
                }
            } catch (err) {
                console.error('Failed to load batch history', err);
            }
        };

        loadHistory();
    }, [items.length]); // Run once or when items list significantly changes (initially)

    // 1. DUPLICATE CHECK LOGIC
    const checkBarcodeDuplicate = (itemId: string, barcode: string) => {
        // Find if this barcode is used by any OTHER item
        const duplicateItem = items.find(i =>
            i.manufacturerBarcode === barcode &&
            i.id !== itemId &&
            !i.parentItemId
        );

        if (duplicateItem) {
            // Found a duplicate use of this barcode
            // Check if it's the SAME DRUG
            if (duplicateItem.drugId === items.find(i => i.id === itemId)?.drugId) {
                // Same drug, different batch -> ALLOWED
                return { status: 'ALLOWED', message: 'Matched to same product' };
            } else {
                // Different drug -> WARN/BLOCK
                return {
                    status: 'WARNING',
                    message: `Duplicate! Used by ${getDrugName(duplicateItem.drugId)}`,
                    conflictingItem: duplicateItem
                };
            }
        }
        return { status: 'OK' };
    };

    const handleBarcodeChange = async (itemId: string, barcode: string) => {
        // 1. Local Duplicate Check
        const dupCheck = checkBarcodeDuplicate(itemId, barcode);
        if (dupCheck.status === 'WARNING') {
            toast.warning(dupCheck.message || 'Barcode conflict detected');
        }

        // 2. Update State
        handleFieldUpdate(itemId, 'manufacturerBarcode', barcode);

        // 3. Optional: Verify with backend if it's a real barcode
        if (barcode.length > 5) {
            try {
                const verification = await scanApi.verifyBarcode(barcode);
                if (verification.batch) {
                    const currentItem = items.find(i => i.id === itemId);
                    if (currentItem && currentItem.drugId !== verification.batch.drugId) {
                        toast.error(`Warning: This barcode is registered to ${verification.batch.drugName} in the system!`);
                    }
                }
            } catch (e) {
                // Ignore API errors
            }
        }
    };


    const getStatus = (item: any) => {
        const received = parseFloat(item.receivedQty) || 0;
        const ordered = parseFloat(item.orderedQty) || 0;

        if (received === ordered) {
            return { label: 'Matched', color: 'text-emerald-600', icon: HiOutlineCheck };
        } else if (received < ordered) {
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
        // Smart Barcode Sync:
        // If updating batch number, check if we have a known barcode for this batch in history
        if (field === 'batchNumber' && typeof value === 'string' && value.length > 2) {
            const item = items.find(i => i.id === itemId);
            if (item) {
                const history = batchHistory[item.drugId];
                if (history) {
                    const match = history.find(h => h.batchNumber.toLowerCase() === value.toLowerCase());
                    if (match && match.barcode) {
                        // Found a match! Auto-fill barcode if currently empty or different
                        // We update both fields
                        const updates: any = {
                            [field]: value,
                            manufacturerBarcode: match.barcode
                        };
                        onItemUpdate(itemId, updates);
                        return;
                    } else {
                        // NO MATCH for this new batch.
                        // Check if the CURRENT barcode belongs to a DIFFERENT batch in history (i.e. it's the "old" one)
                        const currentBarcode = item.manufacturerBarcode;
                        if (currentBarcode) {
                            const belongsToOther = history.some(h =>
                                h.barcode === currentBarcode &&
                                h.batchNumber.toLowerCase() !== value.toLowerCase()
                            );

                            if (belongsToOther) {
                                // The current barcode belongs to a different batch in history, so it's likely incorrect for this new batch.
                                // Clear it so user knows to scan/enter the correct one.
                                const updates: any = {
                                    [field]: value,
                                    manufacturerBarcode: ''
                                };
                                onItemUpdate(itemId, updates);
                                return;
                            }
                        }
                    }
                }
            }
        }

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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                                {/* Barcode Icon Header */}
                                <HiOutlineQrCode className="w-5 h-5 mx-auto" />
                            </th>
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
                                        <td className="px-2 py-3">
                                            {/* Barcode Input / Scan Trigger */}
                                            {isParent ? (
                                                <div className="flex justify-center">
                                                    <span className="text-gray-400">-</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setScanningItem(item.id)}
                                                        className={`p-1.5 rounded-md transition-colors ${item.manufacturerBarcode
                                                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                        title="Scan Barcode"
                                                    >
                                                        <HiOutlineQrCode className="w-5 h-5" />
                                                    </button>
                                                    {/* Optional: Small input if they want to type? 
                                                         User said "keep the BarCode icon before items". 
                                                         Let's just keep the icon trigger for now, 
                                                         or maybe a very small input field? 
                                                         "Move it to the place where ... verified ... is written"
                                                         Let's assume they want to SCAN primarily.
                                                         If I put an input, it takes space. 
                                                         Let's put a small input that expands or just an icon that opens scanner?
                                                         "what if I scan the same barcode ... in frontend for all" implies manual entry/rapid scanning might be used.
                                                         Let's add a small input field hidden/visible?
                                                         Actually, standard usage: Click icon -> Scan. 
                                                         Or focus field -> Scan.
                                                         Let's make the barcode editable via a small input next to icon.
                                                     */}
                                                    <input
                                                        type="text"
                                                        value={item.manufacturerBarcode || ''}
                                                        onChange={(e) => handleBarcodeChange(item.id, e.target.value)}
                                                        className={`w-24 text-xs px-1 py-1 border rounded ${item.manufacturerBarcode ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'
                                                            }`}
                                                        placeholder="Barcode..."
                                                    />
                                                </div>
                                            )}
                                        </td>
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

                                                        // Update display to padded format
                                                        e.currentTarget.value = `${paddedMonth}/${year}`;

                                                        handleFieldUpdate(item.id, 'expiryDate', fullDate);
                                                    }
                                                    // If incomplete (e.g., "12/" or "12/20"), don't save - just leave it in the field
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
                                                <td className="px-2 py-3 pl-8">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setScanningItem(child.id)}
                                                            className={`p-1.5 rounded-md transition-colors ${child.manufacturerBarcode
                                                                ? 'text-emerald-600 bg-white hover:bg-emerald-100'
                                                                : 'text-gray-400 hover:text-gray-600 hover:bg-white'
                                                                }`}
                                                            title="Scan Barcode"
                                                        >
                                                            <HiOutlineQrCode className="w-5 h-5" />
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={child.manufacturerBarcode || ''}
                                                            onChange={(e) => handleBarcodeChange(child.id, e.target.value)}
                                                            className={`w-24 text-xs px-1 py-1 border rounded ${child.manufacturerBarcode ? 'border-emerald-300 bg-white' : 'border-gray-300'
                                                                }`}
                                                            placeholder="Barcode..."
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 pl-4">
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
                                                                handleFieldUpdate(child.id, 'expiryDate', fullDate);
                                                            }
                                                            // If incomplete (e.g., "12/" or "12/20"), don't save - just leave it in the field
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
                    existingDiscrepancy={discrepancies.find((d: any) => d.grnItemId === discrepancyItem.id)}
                    onResolve={(discrepancyData) => {
                        onDiscrepancy(discrepancyItem.id, discrepancyData);
                        setDiscrepancyItem(null);
                    }}
                    onClose={() => setDiscrepancyItem(null)}
                />
            )}

            {/* Barcode Scanner Modal */}
            {scanningItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden relative">
                        <button
                            onClick={() => setScanningItem(null)}
                            className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full"
                        >
                            <HiOutlineTrash className="w-5 h-5 text-gray-500" />
                        </button>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">Scan Barcode</h3>
                            <BarcodeScannerModal
                                onClose={() => setScanningItem(null)}
                                onScan={(code) => {
                                    handleBarcodeChange(scanningItem, code);
                                    setScanningItem(null); // Close after successful scan
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}

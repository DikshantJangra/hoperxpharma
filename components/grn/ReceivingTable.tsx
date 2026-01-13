
import React, { useState } from 'react';
import { HiOutlineCheck, HiOutlineExclamationCircle, HiOutlineArrowUp, HiOutlineCog, HiOutlineExclamationTriangle, HiOutlineTrash, HiOutlineQrCode } from 'react-icons/hi2';
import BatchSplitModal from './BatchSplitModal';
import DiscrepancyHandler from './DiscrepancyHandler';
import BatchSelector from './BatchSelector';
import BatchStatusBadge from './BatchStatusBadge';
import BatchInfoPanel from './BatchInfoPanel';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { scanApi } from '@/lib/api/scan';
import { inventoryApi } from '@/lib/api/inventory';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

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
    // Store inventory status: itemId -> {exists, currentStock, expiry, location, mrp}
    const [inventoryStatus, setInventoryStatus] = useState<Record<string, any>>({});
    // Debounce timer for inventory checks
    const inventoryCheckTimeouts = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

    const { handleKeyDown } = useKeyboardNavigation();

    // Fetch batch history on mount and cleanup on unmount
    React.useEffect(() => {
        const loadHistory = async () => {
            const drugIds = Array.from(new Set(items.map(i => i.drugId)));
            if (drugIds.length === 0) return;

            try {
                // Use apiClient for proper authentication
                const { apiClient } = await import('@/lib/api/client');
                const response = await apiClient.post('/inventory/batches/history', { drugIds });

                if (response.success) {
                    setBatchHistory(response.data);
                }
            } catch (err) {
                console.error('Failed to load batch history', err);
            }

            // Initial inventory status check for all items using bulk endpoint
            // This ensures badges show up immediately for pre-filled or resumed drafts with O(1) efficiency
            try {
                const itemsToCheck = items
                    .filter(item => item.batchNumber && item.batchNumber !== 'TBD' && item.batchNumber.length > 1)
                    .map(item => ({ drugId: item.drugId, batchNumber: item.batchNumber }));

                if (itemsToCheck.length > 0) {
                    const result = await inventoryApi.checkBatchesBulk(itemsToCheck);

                    if (result.success) {
                        const bulkStatus = result.data;
                        const newStatusMap: Record<string, any> = {};

                        // Map bulk results back to item IDs
                        items.forEach(item => {
                            if (item.batchNumber) {
                                const key = `${item.drugId}_${item.batchNumber}`;
                                if (bulkStatus[key]) {
                                    newStatusMap[item.id] = bulkStatus[key];
                                }
                            }
                        });

                        setInventoryStatus(prev => ({
                            ...prev,
                            ...newStatusMap
                        }));
                    }
                }
            } catch (err) {
                console.error('Failed initial bulk inventory check', err);
            }
        };

        loadHistory();

        // Cleanup: Clear all pending debounce timeouts on unmount
        return () => {
            inventoryCheckTimeouts.current.forEach(timeout => clearTimeout(timeout));
            inventoryCheckTimeouts.current.clear();
        };
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

    /**
     * Check if batch exists in inventory (debounced)
     */
    const checkBatchInInventory = (itemId: string, drugId: string, batchNumber: string) => {
        // Clear existing timeout for this item
        const existing = inventoryCheckTimeouts.current.get(itemId);
        if (existing) clearTimeout(existing);

        // Only check if batch number is meaningful (not empty or 'TBD')
        if (!batchNumber || batchNumber === 'TBD' || batchNumber.length < 2) {
            setInventoryStatus(prev => {
                const updated = { ...prev };
                delete updated[itemId];
                return updated;
            });
            return;
        }

        // Set new timeout
        const timeout = setTimeout(async () => {
            try {
                const result = await inventoryApi.checkBatch(drugId, batchNumber);
                if (result.success) {
                    // Set inventory status for both exists and doesn't exist cases
                    setInventoryStatus(prev => ({
                        ...prev,
                        [itemId]: result.data || { exists: false }
                    }));
                }
            } catch (error) {
                console.error('Failed to check batch in inventory:', error);
                // On error, assume new batch (don't block user)
                setInventoryStatus(prev => ({
                    ...prev,
                    [itemId]: { exists: false }
                }));
            }
        }, 500); // 500ms debounce

        inventoryCheckTimeouts.current.set(itemId, timeout);
    };

    const handleFieldUpdate = (itemId: string, field: string, value: any) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        // Prepare updates object
        const updates: any = { [field]: value };

        // INVENTORY STATUS CHECK: When batch number changes
        if (field === 'batchNumber' && typeof value === 'string') {
            checkBatchInInventory(itemId, item.drugId, value);

            // Smart Barcode Sync: Auto-fill or clear barcode based on history
            if (value.length > 2) {
                const history = batchHistory[item.drugId];
                if (history) {
                    const match = history.find(h => h.batchNumber.toLowerCase() === value.toLowerCase());
                    if (match && match.barcode) {
                        // Found a match! Auto-fill barcode
                        updates.manufacturerBarcode = match.barcode;
                    } else {
                        // NO MATCH for this new batch.
                        // Check if the CURRENT barcode belongs to a DIFFERENT batch in history
                        const currentBarcode = item.manufacturerBarcode;
                        if (currentBarcode) {
                            const belongsToOther = history.some(h =>
                                h.barcode === currentBarcode &&
                                h.batchNumber.toLowerCase() !== value.toLowerCase()
                            );

                            if (belongsToOther) {
                                // Clear incorrect barcode
                                updates.manufacturerBarcode = '';
                            }
                        }
                    }
                }
            }
        }

        // Single atomic update to parent
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-48">
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
                                    <tr className={`${isParent ? 'bg-blue-50 font-medium' : 'hover:bg-gray-50'} relative`}>
                                        <td className="px-2 py-3 relative">
                                            {/* TOP-LEFT "IN STOCK" STICKER - Positioned absolutely on the row */}
                                            {!isParent && inventoryStatus[item.id]?.exists && inventoryStatus[item.id]?.currentStock && (
                                                <div className="absolute -top-2 -left-2 z-20 transform -rotate-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-2 py-1 rounded shadow-lg border-2 border-white">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[8px] font-bold">📦 STOCK</span>
                                                            <span className="text-[8px] font-semibold bg-white/20 px-1 py-0.5 rounded">
                                                                {inventoryStatus[item.id].currentStock}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* TOP-LEFT STATUS STICKERS */}
                                            {!isParent && (
                                                <div className="absolute -top-1 -left-1 z-10 flex flex-col gap-1">
                                                    {(() => {
                                                        const status = inventoryStatus[item.id];
                                                        const scanned = item.manufacturerBarcode;
                                                        const stored = status?.manufacturerBarcode;
                                                        const hasInternalQR = status?.internalQRCode;

                                                        if (status?.exists) {
                                                            // Check if barcode verification is needed
                                                            if (scanned && stored) {
                                                                if (scanned === stored) {
                                                                    return (
                                                                        <span className="px-1.5 py-0.5 text-[9px] bg-emerald-600 text-white rounded font-bold shadow-sm uppercase tracking-wide">
                                                                            VERIFIED
                                                                        </span>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <span className="px-1.5 py-0.5 text-[9px] bg-red-600 text-white rounded font-bold shadow-sm uppercase tracking-wide flex items-center gap-1">
                                                                            MISMATCH
                                                                        </span>
                                                                    );
                                                                }
                                                            }
                                                            // Show STOCKED for both manufacturer barcode and internal QR
                                                            return (
                                                                <span className="px-1.5 py-0.5 text-[9px] bg-blue-600 text-white rounded font-bold shadow-sm uppercase tracking-wide">
                                                                    STOCKED
                                                                </span>
                                                            );
                                                        } else if (status?.exists === false && item.batchNumber && item.batchNumber !== 'TBD') {
                                                            return (
                                                                <span className="px-1.5 py-0.5 text-[9px] bg-green-600 text-white rounded font-bold shadow-sm uppercase tracking-wide">
                                                                    NEW
                                                                </span>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            )}

                                            {/* Barcode Input / Scan Trigger */}
                                            {isParent ? (
                                                <div className="flex justify-center">
                                                    <span className="text-gray-400">-</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => setScanningItem(item.id)}
                                                        className={`p-1.5 rounded-md transition-colors ${item.manufacturerBarcode
                                                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                        title={item.manufacturerBarcode ? `Barcode: ${item.manufacturerBarcode}` : "Scan Barcode"}
                                                    >
                                                        <HiOutlineQrCode className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">
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
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={item.batchNumber || ''}
                                                    onChange={(e) => handleFieldUpdate(item.id, 'batchNumber', e.target.value)}
                                                    placeholder="Batch #"
                                                    disabled={isParent}
                                                    className="w-full min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                                />

                                                {/* Show QR Code Panel for existing batches */}
                                                {!isParent && inventoryStatus[item.id]?.exists && (
                                                    <BatchInfoPanel
                                                        inventoryStatus={inventoryStatus[item.id]}
                                                        showDetails={true}
                                                    />
                                                )}

                                                {/* Prompt to link internal QR for existing batches without internal QR */}
                                                {!isParent && inventoryStatus[item.id]?.exists &&
                                                    inventoryStatus[item.id]?.manufacturerBarcode &&
                                                    !inventoryStatus[item.id]?.internalQR &&
                                                    !inventoryStatus[item.id]?.internalQRCode && (
                                                        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                                            <p className="text-blue-800 font-medium">⚠️ Internal QR Missing</p>
                                                            <p className="text-blue-600 text-[10px] mt-1">
                                                                This batch has manufacturer barcode but no internal QR. Link will be created upon completion.
                                                            </p>
                                                        </div>
                                                    )}

                                                {/* Prompt to create QR for new batches */}
                                                {!isParent && inventoryStatus[item.id]?.exists === false && item.batchNumber && item.batchNumber !== 'TBD' && (
                                                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                                                        <p className="text-amber-800 font-medium">New batch detected</p>
                                                        <p className="text-amber-600 text-[10px] mt-1">
                                                            Internal QR code will be generated automatically upon completion
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
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
                                                        className="w-full min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
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
            {/* Barcode Scanner Modal */}
            {scanningItem && (
                <BarcodeScannerModal
                    onClose={() => setScanningItem(null)}
                    onScan={(code) => {
                        handleBarcodeChange(scanningItem, code);
                        setScanningItem(null); // Close after successful scan
                    }}
                />
            )}
        </div>

    );
}

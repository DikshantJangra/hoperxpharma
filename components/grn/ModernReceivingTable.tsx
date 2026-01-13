import React, { useState, useEffect } from 'react';
import ReceivingCard from './ReceivingCard';
import BatchSplitModal from './BatchSplitModal';
import { inventoryApi } from '@/lib/api/inventory';
import dynamic from 'next/dynamic';
import { HiOutlineCog } from 'react-icons/hi2';

const BarcodeScannerModal = dynamic(() => import('@/components/pos/BarcodeScannerModal'), { ssr: false });

interface ModernReceivingTableProps {
    items: any[];
    poItems: any[];
    onItemUpdate: (itemId: string, updates: any) => void;
    onBatchSplit?: (itemId: string, splitData: any[]) => void;
}

export default function ModernReceivingTable({ items, poItems, onItemUpdate, onBatchSplit }: ModernReceivingTableProps) {
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
    const [inventoryStatus, setInventoryStatus] = useState<Record<string, any>>({});
    const [scanningItem, setScanningItem] = useState<string | null>(null);
    const [splitItem, setSplitItem] = useState<any | null>(null);

    // Auto-expand first incomplete item on mount
    useEffect(() => {
        const firstIncomplete = items.find(item => 
            !item.isSplit && 
            (!item.receivedQty || !item.batchNumber || item.batchNumber === 'TBD')
        );
        if (firstIncomplete) {
            setExpandedItem(firstIncomplete.id);
        }
    }, []);

    // Load batch history and check inventory status
    useEffect(() => {
        const loadInventoryStatus = async () => {
            // Include both parent and child items in the check
            const allItemsToCheck = items.flatMap(item => {
                if (item.isSplit && item.children) {
                    return item.children.filter((child: any) => 
                        child.batchNumber && 
                        child.batchNumber !== 'TBD' && 
                        child.batchNumber.length > 1
                    ).map((child: any) => ({ 
                        drugId: child.drugId, 
                        batchNumber: child.batchNumber,
                        itemId: child.id 
                    }));
                }
                if (item.batchNumber && item.batchNumber !== 'TBD' && item.batchNumber.length > 1) {
                    return [{ drugId: item.drugId, batchNumber: item.batchNumber, itemId: item.id }];
                }
                return [];
            });

            if (allItemsToCheck.length > 0) {
                try {
                    const result = await inventoryApi.checkBatchesBulk(
                        allItemsToCheck.map(({ drugId, batchNumber }) => ({ drugId, batchNumber }))
                    );
                    
                    if (result.success) {
                        const bulkStatus = result.data;
                        const newStatusMap: Record<string, any> = {};

                        allItemsToCheck.forEach(({ drugId, batchNumber, itemId }) => {
                            const key = `${drugId}_${batchNumber}`;
                            if (bulkStatus[key]) {
                                newStatusMap[itemId] = bulkStatus[key];
                            }
                        });

                        setInventoryStatus(newStatusMap);
                    }
                } catch (err) {
                    console.error('Failed to load inventory status', err);
                }
            }
        };

        loadInventoryStatus();
    }, [items.length]);

    const getDrugName = (drugId: string) => {
        const poItem = poItems.find(pi => pi.drugId === drugId);
        if (!poItem || !poItem.drug) return 'Unknown';
        return `${poItem.drug.name}${poItem.drug.strength ? ` ${poItem.drug.strength}` : ''}`;
    };

    const handleExpand = (itemId: string) => {
        if (expandedItem === itemId) {
            // Collapsing - mark as complete if valid
            const item = items.find(i => i.id === itemId);
            if (item && isItemComplete(item)) {
                setCompletedItems(prev => new Set([...prev, itemId]));
                // Auto-expand next incomplete item
                const currentIndex = items.findIndex(i => i.id === itemId);
                const nextIncomplete = items.slice(currentIndex + 1).find(i => 
                    !i.isSplit && !completedItems.has(i.id)
                );
                setExpandedItem(nextIncomplete?.id || null);
            } else {
                setExpandedItem(null);
            }
        } else {
            setExpandedItem(itemId);
        }
    };

    const isItemComplete = (item: any) => {
        return item.receivedQty > 0 && 
               item.batchNumber && 
               item.batchNumber !== 'TBD' && 
               item.expiryDate &&
               item.mrp > 0;
    };

    const handleUpdate = (itemId: string, updates: any) => {
        onItemUpdate(itemId, updates);
        
        // Check batch in inventory when batch number changes
        if (updates.batchNumber) {
            const item = items.find(i => i.id === itemId);
            if (item) {
                checkBatchInInventory(itemId, item.drugId, updates.batchNumber);
            }
        }
    };

    const checkBatchInInventory = async (itemId: string, drugId: string, batchNumber: string) => {
        if (!batchNumber || batchNumber === 'TBD' || batchNumber.length < 2) {
            setInventoryStatus(prev => {
                const updated = { ...prev };
                delete updated[itemId];
                return updated;
            });
            return;
        }

        try {
            const result = await inventoryApi.checkBatch(drugId, batchNumber);
            if (result.success) {
                setInventoryStatus(prev => ({
                    ...prev,
                    [itemId]: result.data || { exists: false }
                }));
            }
        } catch (error) {
            console.error('Failed to check batch:', error);
        }
    };

    const handleScan = (itemId: string) => {
        setScanningItem(itemId);
    };

    const handleBarcodeScanned = (code: string) => {
        if (scanningItem) {
            onItemUpdate(scanningItem, { manufacturerBarcode: code });
            setScanningItem(null);
        }
    };

    const handleSplit = (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (item) {
            setSplitItem(item);
        }
    };

    const handleBatchSplit = async (splitData: any[]) => {
        if (splitItem && onBatchSplit) {
            await onBatchSplit(splitItem.id, splitData);
            setTimeout(() => {
                setSplitItem(null);
            }, 500);
        }
    };

    // Calculate progress - include all items (parent + children)
    const allItems = items.flatMap(item => {
        if (item.isSplit && item.children) {
            return item.children;
        }
        return item.parentItemId ? [] : [item];
    });
    const totalItems = allItems.length;
    const completedCount = allItems.filter(i => isItemComplete(i)).length;
    const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Progress Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                        Progress: {completedCount} of {totalItems} items verified
                    </span>
                    <span className="text-sm font-semibold text-blue-600">{progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Item Cards */}
            <div className="space-y-3">
                {items.filter(item => !item.parentItemId).map((item) => {
                    // For split items, show parent card + child cards
                    if (item.isSplit && item.children) {
                        return (
                            <div key={item.id} className="space-y-2">
                                {/* Parent Card */}
                                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">{getDrugName(item.drugId)}</h3>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Split into {item.children.length} batches
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleSplit(item.id)}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Edit Split"
                                        >
                                            <HiOutlineCog className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Child Cards */}
                                {item.children.map((child: any) => (
                                    <div key={child.id} className="ml-4">
                                        <ReceivingCard
                                            item={child}
                                            drugName={`↳ ${getDrugName(child.drugId)}`}
                                            isExpanded={expandedItem === child.id}
                                            isComplete={isItemComplete(child)}
                                            inventoryStatus={inventoryStatus[child.id]}
                                            onExpand={() => handleExpand(child.id)}
                                            onUpdate={(updates) => handleUpdate(child.id, updates)}
                                            onScan={() => handleScan(child.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        );
                    }

                    // Regular non-split item
                    return (
                        <ReceivingCard
                            key={item.id}
                            item={item}
                            drugName={getDrugName(item.drugId)}
                            isExpanded={expandedItem === item.id}
                            isComplete={isItemComplete(item)}
                            inventoryStatus={inventoryStatus[item.id]}
                            onExpand={() => handleExpand(item.id)}
                            onUpdate={(updates) => handleUpdate(item.id, updates)}
                            onScan={() => handleScan(item.id)}
                        />
                    );
                })}
            </div>

            {/* Batch Split Modal */}
            {splitItem && (
                <BatchSplitModal
                    item={splitItem}
                    drugName={getDrugName(splitItem.drugId)}
                    onSplit={handleBatchSplit}
                    onClose={() => setSplitItem(null)}
                />
            )}

            {/* Barcode Scanner Modal */}
            {scanningItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">Scan Barcode</h3>
                            <BarcodeScannerModal
                                onClose={() => setScanningItem(null)}
                                onScan={handleBarcodeScanned}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

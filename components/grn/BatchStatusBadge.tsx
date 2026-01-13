import React from 'react';

interface BatchStatusBadgeProps {
    inventoryStatus?: {
        exists: boolean;
        currentStock?: number;
        batchId?: string;
    };
    barcodeStatus?: {
        status: 'IN_SYSTEM' | 'NEW' | 'CONFLICT' | 'NONE';
        message?: string;
    };
    manufacturerBarcode?: string;
}

/**
 * Visual status badges displayed in top-left corner of item row
 * Shows inventory status and barcode verification status
 */
export default function BatchStatusBadge({
    inventoryStatus,
    barcodeStatus,
    manufacturerBarcode
}: BatchStatusBadgeProps) {
    return (
        <div className="absolute -top-2 -left-2 z-20 flex flex-col gap-1">
            {/* Stock Status Sticker */}
            {inventoryStatus?.exists && inventoryStatus.currentStock !== undefined && (
                <div className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md shadow-lg flex items-center gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    📦 {inventoryStatus.currentStock} in stock
                </div>
            )}

            {/* Barcode Status Sticker */}
            {manufacturerBarcode && barcodeStatus?.status === 'IN_SYSTEM' && (
                <div className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    ✓ Barcode OK
                </div>
            )}

            {manufacturerBarcode && barcodeStatus?.status === 'NEW' && (
                <div className="px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    🆕 New Code
                </div>
            )}

            {manufacturerBarcode && barcodeStatus?.status === 'CONFLICT' && (
                <div className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-md shadow-lg animate-pulse">
                    ⚠️ Conflict!
                </div>
            )}
        </div>
    );
}

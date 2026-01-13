import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

interface BatchInfoPanelProps {
    inventoryStatus?: {
        exists: boolean;
        batchId?: string;
        internalQR?: string;
        internalQRCode?: string;
        manufacturerBarcode?: string;
        location?: string;
        mrp?: number;
        expiry?: string;
        currentStock?: number;
    };
    showDetails: boolean;
}

/**
 * Panel showing QR code, barcode, and batch details for existing batches
 * Displayed when an existing batch is selected
 */
export default function BatchInfoPanel({ inventoryStatus, showDetails }: BatchInfoPanelProps) {
    if (!showDetails || !inventoryStatus?.exists || !inventoryStatus.batchId) {
        return null;
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1">
                <span>📋</span>
                <span>Existing Batch Details</span>
            </div>

            <div className="flex gap-4 items-start">
                {/* Internal QR Code if available */}
                {(inventoryStatus.internalQR || inventoryStatus.internalQRCode) && (
                    <div className="flex flex-col items-center bg-white p-2 rounded border border-gray-200">
                        <div className="text-[9px] text-gray-500 mb-1 font-medium">Internal QR</div>
                        <QRCodeSVG
                            value={inventoryStatus.internalQR || inventoryStatus.internalQRCode || ''}
                            size={60}
                            className="border p-1"
                            level="M"
                        />
                    </div>
                )}

                {/* Manufacturer Barcode */}
                {inventoryStatus.manufacturerBarcode && (
                    <div className="flex-1 bg-white p-2 rounded border border-gray-200">
                        <div className="text-[9px] text-gray-500 mb-1 font-medium">Manufacturer Barcode</div>
                        <div className="font-mono text-xs text-gray-900 mb-1">
                            {inventoryStatus.manufacturerBarcode}
                        </div>
                        <div className="overflow-hidden">
                            <Barcode
                                value={inventoryStatus.manufacturerBarcode}
                                width={1.2}
                                height={25}
                                displayValue={false}
                                margin={0}
                            />
                        </div>
                    </div>
                )}

                {/* Batch Info */}
                <div className="text-xs space-y-1 bg-white p-2 rounded border border-gray-200">
                    <div className="flex gap-2">
                        <span className="text-gray-500 font-medium">Location:</span>
                        <span className="text-gray-900">{inventoryStatus.location || 'Not set'}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-gray-500 font-medium">Current MRP:</span>
                        <span className="text-gray-900 font-semibold">₹{inventoryStatus.mrp}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-gray-500 font-medium">Expiry:</span>
                        <span className="text-gray-900">{inventoryStatus.expiry ? formatDate(inventoryStatus.expiry) : 'N/A'}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-gray-500 font-medium">Stock:</span>
                        <span className="text-blue-600 font-bold">{inventoryStatus.currentStock} units</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

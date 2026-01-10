'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { HiOutlineQrCode } from 'react-icons/hi2';
import { HiOutlineX } from 'react-icons/hi';
import { scanApi } from '@/lib/api/scan';
import { toast } from 'sonner';

const BarcodeScannerModal = dynamic(() => import('@/components/pos/BarcodeScannerModal'), { ssr: false });

interface GRNBarcodeScannerProps {
    itemId: string;
    batchId?: string;
    drugId: string;
    onDataScanned: (data: {
        barcode: string;
        batchNumber?: string;
        expiryDate?: string;
        mrp?: number;
    }) => void;
}

export default function GRNBarcodeScanner({ itemId, batchId, drugId, onDataScanned }: GRNBarcodeScannerProps) {
    const [showScanner, setShowScanner] = useState(false);
    const [scanning, setScanning] = useState(false);

    const handleScan = async (barcode: string) => {
        setScanning(true);
        try {
            // 1. Try to process scan (check if already enrolled)
            try {
                const scanResult = await scanApi.processScan(barcode, 'GRN');

                if (scanResult.data) {
                    // Barcode already enrolled - use existing data
                    toast.success('Barcode recognized! Auto-filling batch details...');
                    onDataScanned({
                        barcode,
                        batchNumber: scanResult.data.batch?.batchNumber,
                        expiryDate: scanResult.data.batch?.expiryDate,
                        mrp: scanResult.data.batch?.mrp
                    });
                    setShowScanner(false);
                    return;
                }
            } catch (error: any) {
                // 404 means barcode not enrolled yet - proceed to enrollment
                if (error.statusCode !== 404) {
                    throw error;
                }
            }

            // 2. If not enrolled and we have batch ID, enroll it
            if (batchId) {
                await scanApi.enrollBarcode({
                    barcode,
                    batchId,
                    barcodeType: 'MANUFACTURER',
                    unitType: 'STRIP' // Default, adjust as needed
                });

                toast.success('Barcode enrolled successfully!');

                // Auto-fill just the barcode (batch details to be entered manually)
                onDataScanned({
                    barcode
                });
            } else {
                // No batch ID yet - just return the barcode
                toast.info('Barcode scanned. Complete receiving to auto-enroll.');
                onDataScanned({
                    barcode
                });
            }

            setShowScanner(false);
        } catch (error: any) {
            console.error('Barcode scan error:', error);
            toast.error(error.message || 'Failed to process barcode');
        } finally {
            setScanning(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowScanner(true)}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                title="Scan Barcode"
                type="button"
            >
                <HiOutlineQrCode className="h-5 w-5" />
            </button>

            {showScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">Scan Manufacturer Barcode</h3>
                            <button
                                onClick={() => setShowScanner(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <HiOutlineX className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-2">
                            <BarcodeScannerModal
                                onClose={() => setShowScanner(false)}
                                onScan={handleScan}
                            />
                        </div>

                        {scanning && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Processing barcode...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

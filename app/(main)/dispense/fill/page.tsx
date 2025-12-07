"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FiCheck, FiX, FiAlertTriangle, FiPackage } from "react-icons/fi";
import { BsUpcScan } from "react-icons/bs";
import { dispenseApi, prescriptionApi } from "@/lib/api/prescriptions";
// import { drugApi } from "@/lib/api/drugs";

export default function FillPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prescriptionId = searchParams.get('prescriptionId');
    const scanInputRef = useRef<HTMLInputElement>(null);

    const [prescription, setPrescription] = useState<any>(null);
    const [dispenseEvent, setDispenseEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scanInput, setScanInput] = useState("");
    const [scannedItems, setScannedItems] = useState<any[]>([]);
    const [currentDrugIndex, setCurrentDrugIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [batchInput, setBatchInput] = useState("");
    const [quantityInput, setQuantityInput] = useState("");

    // Auto-focus scanner input
    useEffect(() => {
        scanInputRef.current?.focus();
    }, [currentDrugIndex]);

    // Fetch prescription details
    useEffect(() => {
        if (prescriptionId) {
            fetchPrescriptionDetails();
        }
    }, [prescriptionId]);

    const fetchPrescriptionDetails = async () => {
        try {
            setLoading(true);
            const response = await prescriptionApi.getPrescriptionById(prescriptionId!);

            if (response.success) {
                setPrescription(response.data);
                // Start fill workflow if not already started
                await startFillWorkflow();
            }
        } catch (error: any) {
            console.error('[Fill] Failed to fetch prescription:', error);
            setError(error.response?.data?.message || 'Failed to load prescription');
        } finally {
            setLoading(false);
        }
    };

    const startFillWorkflow = async () => {
        try {
            const response = await dispenseApi.startFill(prescriptionId!);
            if (response.success) {
                setDispenseEvent(response.data);
            }
        } catch (error: any) {
            console.error('[Fill] Failed to start workflow:', error);
        }
    };

    const handleScan = async () => {
        if (!scanInput.trim() || !batchInput.trim() || !quantityInput.trim()) {
            setError('Please enter barcode, batch number, and quantity');
            return;
        }

        const currentItem = prescription?.items?.[currentDrugIndex];
        if (!currentItem) {
            setError('No more items to scan');
            return;
        }

        try {
            setError(null);

            // Call scan API with safety checks
            const response = await dispenseApi.scanBarcode(dispenseEvent.id, {
                barcode: scanInput,
                drugId: currentItem.drugId,
                batchNumber: batchInput,
                quantity: parseInt(quantityInput)
            });

            if (response.success) {
                // Add to scanned items
                setScannedItems([...scannedItems, {
                    ...response.data,
                    drugName: currentItem.drug?.name,
                    scannedAt: new Date()
                }]);

                // Move to next item
                if (currentDrugIndex < prescription.items.length - 1) {
                    setCurrentDrugIndex(currentDrugIndex + 1);
                }

                // Clear inputs
                setScanInput("");
                setBatchInput("");
                setQuantityInput("");
                scanInputRef.current?.focus();
            }
        } catch (error: any) {
            console.error('[Fill] Scan error:', error);
            const errorData = error.response?.data;

            // Safety block - show prominent error
            if (errorData?.isSafetyBlock) {
                setError(`🔒 SAFETY BLOCK: ${errorData.message}`);
            } else {
                setError(errorData?.message || 'Scan failed');
            }
        }
    };

    const handleComplete = () => {
        // Navigate to check page
        router.push(`/dispense/check?dispenseEventId=${dispenseEvent.id}`);
    };

    const currentItem = prescription?.items?.[currentDrugIndex];
    const allItemsScanned = scannedItems.length === prescription?.items?.length;

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0ea5a3] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading prescription...</p>
                </div>
            </div>
        );
    }

    if (!prescription) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Prescription not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-[#f8fafc]">
            {/* Left: Required Items */}
            <div className="w-1/3 bg-white border-r border-[#e2e8f0] p-6 overflow-y-auto">
                <h2 className="text-xl font-bold text-[#0f172a] mb-4">Required Medications</h2>
                <p className="text-sm text-[#64748b] mb-6">
                    Patient: {prescription.patient?.firstName} {prescription.patient?.lastName}
                </p>

                <div className="space-y-3">
                    {prescription.items?.map((item: any, idx: number) => {
                        const isScanned = scannedItems.some(s => s.drugId === item.drugId);
                        const isCurrent = idx === currentDrugIndex;

                        return (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg border-2 transition-all ${isScanned
                                    ? 'border-green-500 bg-green-50'
                                    : isCurrent
                                        ? 'border-[#0ea5a3] bg-emerald-50'
                                        : 'border-gray-200 bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-[#0f172a]">{item.drug?.name}</h3>
                                        <p className="text-sm text-[#64748b] mt-1">
                                            Qty: {item.quantityPrescribed}
                                        </p>
                                        {item.sig && (
                                            <p className="text-xs text-[#64748b] mt-1">{item.sig}</p>
                                        )}
                                    </div>
                                    {isScanned && (
                                        <FiCheck className="w-6 h-6 text-green-600" />
                                    )}
                                </div>
                                {item.isControlled && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                                        Controlled Substance
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Middle: Scanner Interface */}
            <div className="flex-1 p-8 flex flex-col">
                <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Fill Prescription</h1>
                    <p className="text-sm text-[#64748b] mb-8">
                        Scan items {currentDrugIndex + 1} of {prescription.items?.length}
                    </p>

                    {/* Current Item Card */}
                    {currentItem && !allItemsScanned && (
                        <div className="bg-white border-2 border-[#0ea5a3] rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FiPackage className="w-8 h-8 text-[#0ea5a3]" />
                                <div>
                                    <h2 className="text-xl font-bold text-[#0f172a]">{currentItem.drug?.name}</h2>
                                    <p className="text-sm text-[#64748b]">
                                        Required: {currentItem.quantityPrescribed} units
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scanner Input */}
                    {!allItemsScanned && (
                        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                        <BsUpcScan className="inline w-4 h-4 mr-2" />
                                        Scan Barcode
                                    </label>
                                    <input
                                        ref={scanInputRef}
                                        type="text"
                                        value={scanInput}
                                        onChange={(e) => setScanInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                batchInput && quantityInput && handleScan();
                                            }
                                        }}
                                        placeholder="Scan or enter barcode..."
                                        className="w-full px-4 py-3 border-2 border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-lg font-mono"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                            Batch Number
                                        </label>
                                        <input
                                            type="text"
                                            value={batchInput}
                                            onChange={(e) => setBatchInput(e.target.value)}
                                            placeholder="Enter batch..."
                                            className="w-full px-4 py-3 border-2 border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            value={quantityInput}
                                            onChange={(e) => setQuantityInput(e.target.value)}
                                            placeholder="Enter qty..."
                                            className="w-full px-4 py-3 border-2 border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleScan}
                                    disabled={!scanInput || !batchInput || !quantityInput}
                                    className="w-full px-6 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Validate & Add
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 mb-6">
                            <div className="flex items-start gap-3">
                                <FiAlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-900 mb-1">Safety Alert</h3>
                                    <p className="text-red-700">{error}</p>
                                </div>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Complete Button */}
                    {allItemsScanned && (
                        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
                            <div className="text-center mb-4">
                                <FiCheck className="w-16 h-16 text-green-600 mx-auto mb-3" />
                                <h3 className="text-xl font-bold text-green-900 mb-2">All Items Scanned!</h3>
                                <p className="text-green-700">Ready to send for final check</p>
                            </div>
                            <button
                                onClick={handleComplete}
                                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                            >
                                Send to Pharmacist Check
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Scanning Log */}
            <div className="w-1/3 bg-white border-l border-[#e2e8f0] p-6 overflow-y-auto">
                <h2 className="text-xl font-bold text-[#0f172a] mb-4">Scanning Log</h2>

                {scannedItems.length === 0 ? (
                    <p className="text-sm text-[#64748b] text-center py-8">No items scanned yet</p>
                ) : (
                    <div className="space-y-3">
                        {scannedItems.map((item, idx) => (
                            <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-[#0f172a]">{item.drugName}</h3>
                                    <FiCheck className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="text-sm text-[#64748b] space-y-1">
                                    <p>Batch: {item.batch?.batchNumber}</p>
                                    <p>Qty: {item.quantityDispensed}</p>
                                    <p>Expiry: {item.batch?.expiryDate ? new Date(item.batch.expiryDate).toLocaleDateString() : '-'}</p>
                                    <p className="text-xs text-green-600">
                                        ✓ Scanned at {new Date(item.scannedAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

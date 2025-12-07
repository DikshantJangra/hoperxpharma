'use client';

import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiCircle, FiPackage, FiPrinter } from 'react-icons/fi';
import toast from 'react-hot-toast';
// @ts-ignore
import BarcodeReader from 'react-barcode-reader';

interface FillStepProps {
    prescription: any;
    onComplete: () => void;
}

const FillStep = ({ prescription, onComplete }: FillStepProps) => {
    // Mock inventory state for items
    const [itemsState, setItemsState] = useState(
        prescription.items.map((item: any) => ({
            ...item,
            status: 'PENDING', // PENDING, SCANNED, COUNTED
            scannedBatch: null
        }))
    );

    const handleScan = (data: string) => {
        // Mock Scan Logic: Check if scanned code matches any item
        // In real app, query backend to identify product
        const matchedIndex = itemsState.findIndex((item: any) =>
            item.status === 'PENDING' // Find first pending item (simplified)
            // item.drug.barcode === data // Real logic
        );

        if (matchedIndex !== -1) {
            updateItemStatus(matchedIndex, 'SCANNED');
            toast.success(`Scanned: ${itemsState[matchedIndex].drug.name}`);
        } else {
            toast.error(`Unknown barcode: ${data}`);
        }
    };

    const handleError = (err: any) => {
        console.error(err);
    };

    const updateItemStatus = (index: number, status: string) => {
        const newItems = [...itemsState];
        newItems[index] = { ...newItems[index], status };
        setItemsState(newItems);
    };

    const allComplete = itemsState.every((i: any) => i.status === 'COUNTED');

    return (
        <div className="max-w-5xl mx-auto">
            <BarcodeReader
                onError={handleError}
                onScan={handleScan}
            />

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pick & Count</h2>
                <div className="text-sm text-gray-500">
                    Scan items to verify accuracy. Press <kbd className="bg-gray-100 border px-1 rounded">F2</kbd> to focus scanner.
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {itemsState.map((item: any, index: number) => (
                    <div
                        key={item.id}
                        className={`bg-white border rounded-xl p-5 transition-all ${item.status === 'COUNTED' ? 'border-green-200 bg-green-50/30' :
                                item.status === 'SCANNED' ? 'border-blue-200 bg-blue-50/30 shadow-md ring-1 ring-blue-100' : 'border-gray-200'
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${item.status === 'COUNTED' ? 'bg-green-100 text-green-700' :
                                        item.status === 'SCANNED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{item.drug.name}</h3>
                                    <p className="text-sm text-gray-500">{item.sig || 'Take as directed'}</p>

                                    <div className="mt-3 flex items-center gap-6 text-sm">
                                        <div>
                                            <span className="text-gray-400 block text-xs uppercase font-medium">Quantity</span>
                                            <span className="font-bold text-gray-900 text-lg">{item.quantityPrescribed}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-xs uppercase font-medium">Days Supply</span>
                                            <span className="font-medium text-gray-900">{item.daysSupply || '-'} days</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-xs uppercase font-medium">Location</span>
                                            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">Shelf A-23</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col items-end gap-2">
                                {item.status === 'PENDING' && (
                                    <button
                                        onClick={() => updateItemStatus(index, 'SCANNED')}
                                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                                    >
                                        Manual Verify
                                    </button>
                                )}

                                {item.status === 'SCANNED' && (
                                    <button
                                        onClick={() => updateItemStatus(index, 'COUNTED')}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 animate-pulse"
                                    >
                                        Confirm Count <FiCheckCircle />
                                    </button>
                                )}

                                {item.status === 'COUNTED' && (
                                    <span className="flex items-center gap-2 text-green-600 font-medium px-4 py-2 bg-green-50 rounded-lg">
                                        <FiCheckCircle /> Ready
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Batch Selection (Shown when scanned) */}
                        {item.status === 'SCANNED' && (
                            <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Confirm Batch</h4>
                                <div className="flex gap-2">
                                    <BatchOption batch="B123" expiry="Jan 2026" isBest />
                                    <BatchOption batch="B124" expiry="Jun 2026" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={onComplete}
                    disabled={!allComplete}
                    className={`px-8 py-3 rounded-lg font-semibold transition-colors shadow-sm flex items-center gap-2 ${allComplete
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <FiPrinter /> Print Labels & Continue
                </button>
            </div>
        </div>
    );
};

const BatchOption = ({ batch, expiry, isBest }: { batch: string, expiry: string, isBest?: boolean }) => (
    <div className={`border rounded-md px-3 py-2 cursor-pointer flex items-center gap-2 text-sm ${isBest ? 'border-teal-500 bg-teal-50 text-teal-900 ring-1 ring-teal-500' : 'border-gray-200 hover:border-gray-300'
        }`}>
        <div className={`w-3 h-3 rounded-full border ${isBest ? 'border-teal-600 bg-teal-600' : 'border-gray-400'}`}></div>
        <div className="flex flex-col">
            <span className="font-medium">{batch}</span>
            <span className="text-xs opacity-75">Exp: {expiry}</span>
        </div>
        {isBest && <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold ml-2">FEFO</span>}
    </div>
);

export default FillStep;

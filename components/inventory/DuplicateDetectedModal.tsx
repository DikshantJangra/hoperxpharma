'use client';

import React from 'react';
import { FiCheckCircle, FiPackage, FiPlus, FiX, FiEye } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ExistingMedicine {
    id: string;
    name: string;
    manufacturer?: string;
    form?: string;
    batchCount: number;
    totalStock: number;
    saltComposition?: Array<{
        name: string;
        strength: string;
    }>;
}

interface DuplicateDetectedModalProps {
    isOpen: boolean;
    existingMedicine: ExistingMedicine;
    onAddBatch: () => void;
    onViewDetails: () => void;
    onCancel: () => void;
}

export default function DuplicateDetectedModal({
    isOpen,
    existingMedicine,
    onAddBatch,
    onViewDetails,
    onCancel
}: DuplicateDetectedModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
            <Card className="bg-white rounded-lg max-w-md w-full p-0 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 border-b border-emerald-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                <FiCheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Already in Inventory</h2>
                                <p className="text-sm text-gray-600 mt-0.5">This medicine already exists</p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Medicine Info */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FiPackage className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{existingMedicine.name}</h3>
                            <div className="mt-1 space-y-0.5">
                                {existingMedicine.manufacturer && (
                                    <p className="text-sm text-gray-600">Manufacturer: {existingMedicine.manufacturer}</p>
                                )}
                                {existingMedicine.form && (
                                    <p className="text-sm text-gray-600">Form: {existingMedicine.form}</p>
                                )}
                                {existingMedicine.saltComposition && existingMedicine.saltComposition.length > 0 && (
                                    <p className="text-sm text-gray-600">
                                        Composition: {existingMedicine.saltComposition.map(s => `${s.name} ${s.strength}`).join(' + ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stock Summary */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Current Stock</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">{existingMedicine.totalStock.toLocaleString()}</p>
                                <p className="text-xs text-blue-600 mt-0.5">units</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Batches</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">{existingMedicine.batchCount}</p>
                                <p className="text-xs text-blue-600 mt-0.5">active</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Message */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                            <strong className="text-gray-900">To add more stock:</strong> Use the "Add New Batch" option below. This will add a new inventory batch to the existing medicine.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onViewDetails}
                        className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                        <FiEye className="mr-2 h-4 w-4" />
                        View Details
                    </Button>
                    <Button
                        onClick={onAddBatch}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <FiPlus className="mr-2 h-4 w-4" />
                        Add New Batch
                    </Button>
                </div>
            </Card>
        </div>
    );
}

'use client';

import React from 'react';
import { FiAlertTriangle, FiEye, FiArrowRight } from 'react-icons/fi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SimilarMedicine {
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
    matchReason: string;
}

interface SimilarMedicineWarningProps {
    similarMedicines: SimilarMedicine[];
    currentMedicineName: string;
    onViewSimilar: (medicine: SimilarMedicine) => void;
    onProceedAnyway: () => void;
}

export default function SimilarMedicineWarning({
    similarMedicines,
    currentMedicineName,
    onViewSimilar,
    onProceedAnyway
}: SimilarMedicineWarningProps) {
    if (!similarMedicines || similarMedicines.length === 0) return null;

    const topSimilar = similarMedicines[0];

    return (
        <Alert className="bg-yellow-50 border-yellow-200 mb-4">
            <FiAlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
                <div className="space-y-3">
                    {/* Header */}
                    <div>
                        <p className="font-semibold text-sm">Similar medicine found in your inventory</p>
                        <p className="text-xs text-yellow-700 mt-1">
                            {topSimilar.matchReason}
                        </p>
                    </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white bg-opacity-60 rounded p-2.5 border border-yellow-100">
                            <p className="text-yellow-800 font-medium mb-1">Existing in inventory:</p>
                            <p className="font-semibold text-gray-900">{topSimilar.name}</p>
                            {topSimilar.manufacturer && (
                                <p className="text-gray-600 mt-0.5">{topSimilar.manufacturer}</p>
                            )}
                            {topSimilar.saltComposition && topSimilar.saltComposition.length > 0 && (
                                <p className="text-gray-600 text-[11px] mt-1">
                                    {topSimilar.saltComposition.map(s => `${s.name} ${s.strength}`).join(' + ')}
                                </p>
                            )}
                        </div>
                        <div className="bg-white bg-opacity-60 rounded p-2.5 border border-yellow-100">
                            <p className="text-yellow-800 font-medium mb-1">You're adding:</p>
                            <p className="font-semibold text-gray-900">{currentMedicineName}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onViewSimilar(topSimilar)}
                            className="text-xs border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                        >
                            <FiEye className="mr-1.5 h-3.5 w-3.5" />
                            View Similar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={onProceedAnyway}
                            className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                            Continue Anyway
                            <FiArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Additional similar medicines */}
                    {similarMedicines.length > 1 && (
                        <p className="text-xs text-yellow-700 pt-1 border-t border-yellow-200">
                            + {similarMedicines.length - 1} more similar medicine{similarMedicines.length > 2 ? 's' : ''} found
                        </p>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    );
}
